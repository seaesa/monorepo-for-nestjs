import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  contract,
  type ForgotPasswordInput,
  type Locale,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type UpdateMeInput,
  type VerifyEmailInput,
} from '@repo/contracts';

import { request } from '../../http/client';
import { usePreferencesStore } from '../../preferences/preferences-store';
import { useAuthStore, useIsAuthenticated } from '../../session/auth-store';
import { endSession, logoutBody, startSession } from '../../session/session';

export const authKeys = {
  me: ['auth', 'me'] as const,
  sessions: ['auth', 'sessions'] as const,
};

export function useMeQuery() {
  const enabled = useIsAuthenticated();
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: authKeys.me,
    enabled,
    queryFn: async () => {
      const user = await request(contract.auth.me);
      setUser(user);
      return user;
    },
  });
}

/** The account follows the language of the app the user signs in from. */
const withLocale = <T extends object>(body: T): T & { locale: Locale } => ({
  ...body,
  locale: usePreferencesStore.getState().locale,
});

/** Form-bound mutations are `silent`: the form shows the error instead of a global toast. */
export function useLoginMutation() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: LoginInput) => request(contract.auth.login, { body: withLocale(body) }),
    onSuccess: startSession,
  });
}

export function useRegisterMutation() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: RegisterInput) =>
      request(contract.auth.register, { body: withLocale(body) }),
    onSuccess: startSession,
  });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: UpdateMeInput) => request(contract.auth.updateMe, { body }),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

/** Switches the UI language now and, when signed in, the language of emails and pushes. */
export function useChangeLocale() {
  const signedIn = useIsAuthenticated();
  const updateMe = useUpdateMeMutation();
  return (locale: Locale) => {
    usePreferencesStore.getState().setLocale(locale);
    if (signedIn) updateMe.mutate({ locale });
  };
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: () => request(contract.auth.logout, { body: logoutBody() }).catch(() => undefined),
    onSettled: async () => {
      await endSession();
      queryClient.clear();
    },
  });
}

/** Signs out every device. The server revokes all refresh tokens for the user. */
export function useLogoutAllMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request(contract.auth.logoutAll),
    onSettled: async () => {
      await endSession();
      queryClient.clear();
    },
  });
}

export function useSessionsQuery() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: authKeys.sessions,
    enabled,
    queryFn: () => request(contract.auth.sessions),
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (id: string) => request(contract.auth.revokeSession, { params: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions }),
  });
}

/**
 * Always reports success: the API refuses to reveal whether an address exists, and the
 * UI must not leak that either.
 */
export function useForgotPasswordMutation() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: ForgotPasswordInput) => request(contract.auth.forgotPassword, { body }),
  });
}

/** A reset kills every session, so the local one goes too. */
export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: ResetPasswordInput) => request(contract.auth.resetPassword, { body }),
    onSuccess: async () => {
      await endSession();
      queryClient.clear();
    },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: VerifyEmailInput) => request(contract.auth.verifyEmail, { body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: ForgotPasswordInput) => request(contract.auth.resendVerification, { body }),
  });
}
