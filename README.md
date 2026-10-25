# Barbell Battles

Barbell Battles is an Expo SDK 57 application.

## Development

Install dependencies and start the Expo development server:

```bash
npm install
npm start
```

Application routes live in `src/app`. Shared components, hooks, and constants have dedicated directories under `src`.

## CI and releases

- Pushes to `dev` and `main`, and pull requests into `main`, run TypeScript, ESLint, Expo Doctor, and an iOS JavaScript bundle export.
- After validation succeeds on a push to `main`, GitHub Actions builds a production iOS app using the EAS production environment and uploads that exact build to TestFlight. Merging a PR triggers this push event.
- The release job waits for build and upload completion. Apple processing, tester availability, on-device testing, App Review, and public release are subsequent steps.
- In Actions, run **Manual iOS development build** to rebuild the development client when native dependencies/configuration change. Select the desired branch. The workflow must first exist on the default branch to appear in the manual-run menu.

### One-time setup

1. Create an Expo access token in https://expo.dev/settings/access-tokens for an account with access to `@kevinkuriakosedev/barbell-battles`.
2. Add it to this GitHub repository under Settings → Secrets and variables → Actions → New repository secret, named `EXPO_TOKEN`. Never commit it or put it in an `EXPO_PUBLIC_` variable.
3. Keep signing and App Store Connect API credentials in EAS. The production submit profile uses App Store Connect ID `6826089766`.
4. Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in both EAS development and production environments. CI validation uses placeholder values only to compile; it does not connect to Supabase.
5. Protect `main` with a pull-request rule requiring the **Validate app** check. Choose the actual check name shown by GitHub after its first run. Require the branch to be up to date before merging.

Cloud build and upload jobs use EAS quota and run sequentially per release type. Canceling a GitHub workflow does not necessarily cancel an already-started EAS cloud job; check EAS before rerunning to avoid duplicate builds. Database migrations and Edge Function deployment are separate from the mobile release pipeline.
