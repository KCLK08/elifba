# AGENTS.md

## Cursor Cloud specific instructions

This repo contains two client-side products for learning the Elifba (Arabic/Quranic alphabet). There is no backend, database, or Docker — every service is static/local.

- `mobile/` — **Elifba Kids**, the primary active product. Expo SDK 54 / React Native / TypeScript app (package manager: npm, see `mobile/package.json`). All scripts are defined there.
- Repo root (`index.html`, `kapitel/`, `js/`, `css/`, `audio/`) — legacy **Elifba Lernweg** static PWA (no build step, no package manager).

### Running the mobile app (Elifba Kids)
- Dev server (Metro): run `npm run web` (or `npm start`, `npm run android`, `npm run ios`) from `mobile/`. Web target is the easiest to smoke-test in this headless environment; it serves on `http://localhost:8081`. The first bundle takes ~15s.
- On web, `expo-av` prints a deprecation warning and there's a harmless `Require cycle` warning from `src/features/learning/path` — both are non-fatal.
- App state (child profiles, progress) persists in browser storage on web; clear site data to re-trigger onboarding.

### Running the legacy PWA
- It's fully static but the service worker needs HTTP, not `file://`. Serve the repo root with any static server, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080/index.html`.

### Lint / test / build
- There are no ESLint/Jest suites. The quality gates live in `mobile/package.json`: `npm run typecheck` (`tsc --noEmit`) and `npm run check-content` (content integrity validator). `npm run check-content` prints many `WARN: ... has no audio yet` lines and still exits 0 — those warnings are expected, only a non-zero exit means failure.
- `npm run preflight` also runs `npx expo-doctor` (needs network).
- Production APK/AAB builds go through EAS (`eas build`, see `mobile/eas.json`) and require an `EXPO_TOKEN` secret; not needed for local dev.
