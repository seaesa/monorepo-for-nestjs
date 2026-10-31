import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type Redis from 'ioredis';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';

import {
  AUTH_MODE_COOKIE,
  AUTH_MODE_HEADER,
  type AuthTokens,
  type ClientToServerEvents,
  contract,
  ErrorCode,
  type ServerToClientEvents,
} from '@repo/contracts';

import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app-config.service';
import { configureApp } from '../src/configure-app';
import { RedisIoAdapter } from '../src/infra/realtime/redis-io.adapter';
import { REDIS } from '../src/infra/redis/redis.module';

describe('API (e2e)', () => {
  let app: NestExpressApplication;
  let redis: Redis;
  let tokens: AuthTokens;
  const email = `e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.useWebSocketAdapter(new RedisIoAdapter(app, []));
    await app.listen(0);
    redis = app.get<Redis>(REDIS);
    // Rate limits live in Redis and outlive a test run, so a second run within
    // the same minute would get 429 instead of testing behaviour. Clear the
    // counters this suite is about to touch.
    const throttled = await redis.keys('throttle:*');
    if (throttled.length > 0) await redis.del(...throttled);
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (accessToken = tokens.accessToken) => `Bearer ${accessToken}`;

  /** Out-of-band tokens live in Redis; the e2e pulls them out the same way a mail link would. */
  async function findToken(prefix: string, userId: string): Promise<string> {
    const keys = await redis.keys(`${prefix}:*`);
    for (const key of keys) {
      if ((await redis.get(key)) === userId) return key.slice(prefix.length + 1);
    }
    throw new Error(`no ${prefix} token for ${userId}`);
  }

  it('rejects invalid input with field errors', async () => {
    const res = await http()
      .post('/auth/register')
      .send({ name: 'x', email: 'nope', password: '1' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(res.body.fieldErrors.map((e: { path: string }) => e.path)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('registers, then reports a taken email on the email field', async () => {
    const body = { name: 'E2E', email, password: 'secret123' };
    const res = await http().post('/auth/register').send(body).expect(201);
    tokens = res.body.tokens;
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user.locale).toBe('en');

    const dup = await http().post('/auth/register').send(body).expect(409);
    expect(dup.body.code).toBe(ErrorCode.AUTH_EMAIL_TAKEN);
    expect(dup.body.fieldErrors[0].path).toBe('email');
  });

  it('requires a token on protected routes', async () => {
    const res = await http().get('/auth/me').expect(401);
    expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('rotates refresh tokens (each works once)', async () => {
    const { refreshToken } = tokens;
    await http().post('/auth/refresh').send({ refreshToken }).expect(200);
    const reused = await http().post('/auth/refresh').send({ refreshToken }).expect(401);
    expect(reused.body.code).toBe(ErrorCode.AUTH_TOKEN_INVALID);
  });

  it('accepts an authenticated socket and answers ping', async () => {
    const { port } = app.getHttpServer().address() as { port: number };
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      `http://localhost:${port}`,
      { transports: ['websocket'], auth: { token: tokens.accessToken } },
    );
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });

    const reply = await socket.emitWithAck('ping');
    expect(reply).toMatchObject({ pong: true });
    socket.disconnect();
  });

  it('serves /health in the shape the contract declares', async () => {
    const res = await http().get('/health').expect(200);
    // Throws if the controller drifts from the schema again.
    expect(() => contract.health.check.response.parse(res.body)).not.toThrow();
    expect(res.body.status).toBe('ok');
  });

  it('publishes the contract as OpenAPI with a reference page', async () => {
    const spec = await http().get('/openapi.json').expect(200);
    expect(spec.body.paths['/tasks/{id}']).toBeDefined();
    await http().get('/docs').expect(200);
  });

  it('revokes the refresh token on logout even without a valid access token', async () => {
    const fresh = await http()
      .post('/auth/register')
      .send({
        name: 'Leaver',
        email: `e2e-logout-${Date.now()}@example.com`,
        password: 'secret123',
      })
      .expect(201);

    // Regression: logout used to require a live access token, so an expired session
    // could never be revoked and the refresh token stayed valid for 30 days.
    await http()
      .post('/auth/logout')
      .set('authorization', 'Bearer expired-or-bogus')
      .send({ refreshToken: fresh.body.tokens.refreshToken })
      .expect(200);

    const reused = await http()
      .post('/auth/refresh')
      .send({ refreshToken: fresh.body.tokens.refreshToken })
      .expect(401);
    expect(reused.body.code).toBe(ErrorCode.AUTH_TOKEN_INVALID);
  });

  it('keeps web sessions in httpOnly cookies and rejects cross-site writes', async () => {
    const agent = request.agent(app.getHttpServer());
    const origin = new URL(app.get(AppConfig).get('WEB_APP_URL')).origin;
    const res = await agent
      .post('/auth/register')
      .set(AUTH_MODE_HEADER, AUTH_MODE_COOKIE)
      .set('origin', origin)
      .send({
        name: 'Web',
        email: `e2e-web-${Date.now()}@example.com`,
        password: 'secret123',
        locale: 'vi',
      })
      .expect(201);
    expect(res.body.tokens).toBeUndefined();
    expect(res.body.user.locale).toBe('vi');
    expect(String(res.headers['set-cookie'])).toContain('HttpOnly');

    await agent.get('/auth/me').expect(200);
    await agent
      .patch('/auth/me')
      .set('origin', 'https://evil.example')
      .send({ locale: 'en' })
      .expect(403);
    const updated = await agent
      .patch('/auth/me')
      .set('origin', origin)
      .send({ locale: 'en' })
      .expect(200);
    expect(updated.body.locale).toBe('en');

    const refreshed = await agent
      .post('/auth/refresh')
      .set(AUTH_MODE_HEADER, AUTH_MODE_COOKIE)
      .set('origin', origin)
      .send({})
      .expect(200);
    expect(refreshed.body.tokens).toBeUndefined();

    await agent.post('/auth/logout').set('origin', origin).send({}).expect(200);
    await agent.get('/auth/me').expect(401);
  });

  it('lists and revokes sessions per device', async () => {
    const sessions = await http().get('/auth/sessions').set('authorization', auth()).expect(200);
    expect(sessions.body.items.length).toBeGreaterThan(0);

    const [first] = sessions.body.items;
    await http().delete(`/auth/sessions/${first.id}`).set('authorization', auth()).expect(200);

    await http().delete(`/auth/sessions/${first.id}`).set('authorization', auth()).expect(404);
  });

  it('resets a password and signs every device out', async () => {
    const owner = await http()
      .post('/auth/register')
      .send({ name: 'Reset', email: `e2e-reset-${Date.now()}@example.com`, password: 'secret123' })
      .expect(201);

    // Unknown addresses must answer the same way, or the endpoint enumerates accounts.
    await http().post('/auth/password/forgot').send({ email: 'nobody@example.com' }).expect(200);
    await http().post('/auth/password/forgot').send({ email: owner.body.user.email }).expect(200);

    const token = await findToken('auth:password-reset', owner.body.user.id);
    await http()
      .post('/auth/password/reset')
      .send({ token, password: 'brand-new-123' })
      .expect(200);

    // The reset revoked every session, including the one that asked for it.
    await http()
      .get('/auth/sessions')
      .set('authorization', auth(owner.body.tokens.accessToken))
      .expect(200)
      .expect((res) => expect(res.body.items).toHaveLength(0));

    await http()
      .post('/auth/login')
      .send({ email: owner.body.user.email, password: 'secret123' })
      .expect(401);
    await http()
      .post('/auth/login')
      .send({ email: owner.body.user.email, password: 'brand-new-123' })
      .expect(200);
  });

  it('rejects one-shot tokens that were already used or never existed', async () => {
    const reset = await http()
      .post('/auth/password/reset')
      .send({ token: 'nope', password: 'brand-new-123' })
      .expect(400);
    expect(reset.body.code).toBe(ErrorCode.AUTH_RESET_TOKEN_INVALID);

    const verify = await http().post('/auth/email/verify').send({ token: 'nope' }).expect(400);
    expect(verify.body.code).toBe(ErrorCode.AUTH_VERIFICATION_TOKEN_INVALID);
  });

  it('verifies an email address once', async () => {
    const owner = await http()
      .post('/auth/register')
      .send({
        name: 'Verify',
        email: `e2e-verify-${Date.now()}@example.com`,
        password: 'secret123',
      })
      .expect(201);
    expect(owner.body.user.emailVerifiedAt).toBeNull();

    await http().post('/auth/email/resend').send({ email: owner.body.user.email }).expect(200);

    const token = await findToken('auth:email-verification', owner.body.user.id);
    await http().post('/auth/email/verify').send({ token }).expect(200);

    const me = await http()
      .get('/auth/me')
      .set('authorization', auth(owner.body.tokens.accessToken))
      .expect(200);
    expect(me.body.emailVerifiedAt).not.toBeNull();
  });

  async function signUp(label: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ name: label, email: `e2e-${label}-${Date.now()}@example.com`, password: 'secret123' })
      .expect(201);
    return auth(res.body.tokens.accessToken);
  }

  it('creates, filters, updates and deletes a task, private to its owner', async () => {
    const owner = await signUp('tasks-owner');
    const other = await signUp('tasks-other');
    const dueAt = new Date(Date.now() + 60 * 60_000).toISOString();

    const created = await http()
      .post('/tasks')
      .set('authorization', owner)
      .send({ title: '  Buy milk ', dueAt, location: { latitude: 10.77, longitude: 106.7 } })
      .expect(201);
    expect(created.body).toMatchObject({
      title: 'Buy milk',
      status: 'TODO',
      dueAt,
      location: { latitude: 10.77, longitude: 106.7 },
    });
    const path = `/tasks/${created.body.id}`;

    const todo = await http().get('/tasks?status=TODO').set('authorization', owner).expect(200);
    expect(todo.body.meta.total).toBe(1);
    const done = await http().get('/tasks?status=DONE').set('authorization', owner).expect(200);
    expect(done.body.items).toEqual([]);

    const updated = await http()
      .patch(path)
      .set('authorization', owner)
      .send({ status: 'DONE', location: null })
      .expect(200);
    expect(updated.body).toMatchObject({ status: 'DONE', location: null });

    const hidden = await http().get(path).set('authorization', other).expect(404);
    expect(hidden.body.code).toBe(ErrorCode.TASK_NOT_FOUND);
    await http().delete(path).set('authorization', other).expect(404);

    await http().delete(path).set('authorization', owner).expect(200);
    await http().get(path).set('authorization', owner).expect(404);
  });

  it('registers a push token once per device and removes it on sign-out', async () => {
    const user = await signUp('devices');
    const body = { token: `ExponentPushToken[e2e-${Date.now()}]`, platform: 'ios' };

    await http().post('/devices').set('authorization', user).send(body).expect(200);
    await http().post('/devices').set('authorization', user).send(body).expect(200);
    await http()
      .post('/devices/unregister')
      .set('authorization', user)
      .send({ token: body.token })
      .expect(200);
  });
});
