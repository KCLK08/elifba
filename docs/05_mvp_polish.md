# Phase 5 – MVP Polish & Release Prep: Elifba Kids

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Grundlage:** docs/01–04  
**Code-Root:** `mobile/`

> Phase 5 poliert das MVP für ein fertiges Kinder-App-Gefühl: Settings, Onboarding, Trainer, Progress-UX, Content-Checks, Arabic Quality, Release-Metadaten.  
> **Explizit nicht:** Elternbereich, PIN, Cloud, Accounts.

---

## 1. Settings

**Route:** `/settings` · Feature: `src/features/settings/SettingsScreen.tsx`  
**Store:** `settingsStore` (ohne `parentPinEnabled`)

| Setting | Bedeutung |
|---------|-----------|
| `soundEnabled` | Audio an/aus |
| `animationsEnabled` | Reanimated-Animationen an/aus |
| `sessionLimit` | 10 / 20 / 30 (UI bereit; Trainer-Batch folgt später) |

**Fortschritt zurücksetzen:** Bestätigungs-Modal → löscht Progress + Session + Rewards; Profile bleiben.

Eltern-Route `/parent/settings` entfernt.

---

## 2. Onboarding Polish

3 Schritte:
1. **Willkommen** – Assalamu alaikum + App-Zweck  
2. **So funktioniert’s** – Anhören / Üben / Sterne  
3. **Profil** – Name + Avatar → Home  

Bestehende Profile springen direkt zum Profil-Schritt („Kind hinzufügen“).

---

## 3. Trainer Polish

- Haptik (`expo-haptics`) bei Antworten / Audio / Abschluss  
- Audio-Zustände: ok / muted / missing / error mit kindgerechten Hinweisen  
- Abschluss-Screen mit Navigation zurück zur Lektion / Lernpfad  
- Animationen respektieren `animationsEnabled`  

---

## 4. Progress UX

- Sterne + Serie (`RewardsStrip`)  
- Anzahl geschaffter Lektionen  
- „Zuletzt geübt“ mit **Titeln** (keine technischen IDs)  
- Übungen als Titel + % / ⭐  

---

## 5. Content Validator

```bash
cd mobile && npm run check-content
```

Script: `scripts/check-content.ts`

Prüft:
- doppelte Exercise-/Card-IDs  
- fehlende Audio-Dateien  
- leere Übungen / leere arabische Texte  
- kaputte Chapter→Lesson→Exercise-Referenzen  
- verwaiste MP3s (Warnung)

---

## 6. Arabic Quality

- `constants/arabicFonts.ts` – Font-Vorbereitung (Noto-Kandidaten dokumentiert)  
- RTL + Accessibility-Label  
- Highlight `initial` / `middle` / `final` + Targets  
- Animation optional über Settings  

---

## 7. Release Preparation

| Artefakt | Status |
|----------|--------|
| `app.json` | name, slug, version `1.0.0`, Android `versionCode: 1`, iOS `buildNumber: 1`, primaryColor |
| Icons / Splash | vorhanden unter `assets/images/` |
| `eas.json` | preview=APK, production=AAB |
| EAS `projectId` | Placeholder `TODO_SET_WITH_eas_init` – vor Build: `eas init` |

Empfohlener Preview-Build:

```bash
cd mobile
npx eas-cli build -p android --profile preview
```

---

## 8. Qualitätschecks (lokal)

```bash
npm run typecheck
npm run check-content
npx expo-doctor
```

---

## 9. Offene Punkte

1. EAS Project-ID setzen und ersten APK-Build fahren  
2. Custom arabische Fonts bundlen  
3. `sessionLimit` im Trainer aktivieren  
4. Brand-Icons (aktuell Template-Assets) ersetzen  
5. Store-Listings / Screenshots  

---

*Ende Phase-5-Dokumentation. STOPP — keine weitere Phase ohne Freigabe.*
