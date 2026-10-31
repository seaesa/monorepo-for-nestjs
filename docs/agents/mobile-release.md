# Mobile release

## App identity (one-time setup)

1. `cd apps/mobile && npx eas init` creates the EAS project. Put its id in the repo variable
   `EAS_PROJECT_ID` (GitHub → Settings → Variables) and in your local `.env`.
2. Replace the placeholder identifiers `com.example.monorepostarter` in `app.config.ts` with
   yours. Non-production variants get a suffix (`.development`, `.preview`) so all three install side by side.
3. Credentials: `npx eas credentials` (Apple distribution cert + provisioning, Android keystore).
4. Push: upload the APNs key (iOS) and the FCM v1 service account (Android) with `eas credentials`.
   The API sends through Expo's push service; set `EXPO_ACCESS_TOKEN` on the API if you enable
   enhanced push security.
5. Repo secret `EXPO_TOKEN` (an Expo robot token). Optional variable `EAS_AUTO_SUBMIT=true` to
   send production builds to TestFlight / Play internal testing.

## Variants

`APP_VARIANT` (set per EAS profile in `eas.json`) selects the app name and bundle id:
`development` (dev client), `preview` (internal, Android APK), `production` (store).

## Releasing

Releases come from Conventional Commits. `.github/workflows/release.yml` (release-please) keeps a
release PR open on `main` with the next version and `CHANGELOG.md` (`feat` = minor, `fix` = patch,
`feat!`/`BREAKING CHANGE` = major). Merging it tags `vX.Y.Z`, publishes the GitHub release and
calls the mobile build. Never edit the version or the changelog by hand.

A tag pushed by hand (`git tag v1.4.0 && git push origin v1.4.0`) also starts a build.

`.github/workflows/mobile-release.yml` builds production (iOS IPA + Android AAB) and a preview
APK on EAS, with `APP_VERSION=1.4.0`. Build numbers are incremented by EAS (remote version
source). Manual run: Actions → Mobile release → version.

## OTA updates

JS-only fixes can ship with `eas update --channel production`. The runtime version follows the
app version, so an update reaches only binaries with the same version; anything that changes
native code (new Expo module, permission, config plugin) needs a new tag and store build.

## Sentry (optional)

Set `EXPO_PUBLIC_SENTRY_DSN` per EAS environment, plus `SENTRY_ORG`, `SENTRY_PROJECT` and the
secret `SENTRY_AUTH_TOKEN` so EAS uploads source maps. Without them the app builds and Sentry
stays off. See `docs/agents/observability.md`.
