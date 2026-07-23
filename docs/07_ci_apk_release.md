# CI / Releases – Elifba Kids

## GitHub → APK

Bei jedem Push auf `main` (Änderungen unter `mobile/` oder am Workflow) baut GitHub Actions eine **Android-APK** über EAS und veröffentlicht sie als GitHub Release.

Workflow: [`.github/workflows/android-apk.yml`](../.github/workflows/android-apk.yml)

Profil: `apk` in [`mobile/eas.json`](../mobile/eas.json) (`buildType: apk`).

## Einmalig einrichten

1. Expo-Account: https://expo.dev/signup  
2. Access Token: https://expo.dev/accounts/[account]/settings/access-tokens  
3. GitHub Secret `EXPO_TOKEN` im Repo setzen (Settings → Secrets → Actions).  
4. EAS-Projekt verknüpfen (einmal lokal):

```bash
cd mobile
npx eas-cli login
npx eas-cli init
git add app.json
git commit -m "Link EAS project"
git push
```

Ohne `extra.eas.projectId` in `app.json` schlägt der Build fehl.

## Manuell starten

GitHub → Actions → **Android APK Release** → Run workflow.
