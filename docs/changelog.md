# Changelog – Elifba Kids

## [CI] – 2026-07-23

### Android APK Release auf `main`

- GitHub Action baut bei Änderungen unter `mobile/` eine APK über EAS (`profile: apk`).
- APK wird als Artifact und GitHub Release veröffentlicht.
- Setup: [`docs/07_ci_apk_release.md`](./07_ci_apk_release.md)

---

## [Phase 6] – 2026-07-19

### Content Migration (JPG → Expo)

- Alle 12 Elifba-Lektionen im Lernpfad; TOC Teil 1 (`7.jpg`) → JPG-Seitenbereiche.
- Neu: Damme + Lektionen 4–12 aus JPG (Karten mit `audioId: null`, `sourcePage`).
- Bestehende L1–L3 Fetha/Kesra mit Audio unverändert.
- Skript: `scripts/import-content.py`; Katalog: `tmp/jpg-import/extracted-pages.json`.
- Validator akzeptiert optionales Audio (Warning statt Error).
- Doku: [`docs/06_content_migration.md`](./06_content_migration.md)

---

## [Phase 5.8] – 2026-07-18

### Progress, Trainer UX & Session Settings

- Fortschritt-Reset löscht Progress/Session/Rewards/Exercise-Settings; UI (Ringe) aktualisiert sich zuverlässig.
- Sterne zentriert über dem Balken mit einmaligem Pop; nicht mehr im Balken.
- Practice: Session-Farben auf Neutral; Mastery bleibt.
- Trainer kompakter; Session-Limit 10/20/30/Alle aktiv; ⚙️ Übungs-Einstellungen (Limit + Reihenfolge/Zufall).
- Trainer-Header: 🔄 Neustart (Session only, Mastery bleibt) neben ⚙ Einstellungen.
- Doku: [`docs/05_8_progress_trainer_session.md`](./05_8_progress_trainer_session.md)

---

## [Phase 5.7] – 2026-07-18

### Trainer & Progress UX Fixes

- Practice: Session-Fortschritt startet bei 0%; Mastery/Sterne/Resume unverändert.
- Home „Weiterlernen“: nächste offene Übung (`resolveContinueLearning`).
- Trainer: dynamischer Queue-Balken + Sterne bei 33/66/100% gelernt.
- Abschluss: „Nochmal lernen“ + Lernpfad; Sterne nur noch im Fortschrittsbalken.
- Lektionskarten: nur linkes Icon, keine rechten Status-Bilder.
- Doku: [`docs/05_7_trainer_progress_ux.md`](./05_7_trainer_progress_ux.md)

---

## [Phase 5.6] – 2026-07-18

### UX Bugfixes & Trainer Refinement

- Arabisch: durchgängig RTL (`writingDirection` / `textAlign` / `direction`); größere Trainer-Schrift (`arabicLarge` 112).
- Arabische Zeichenreihenfolge: nested Text (kein flex-reverse) für korrektes Bidi + Joining.
- Trainer: keine Zoom/Fade-Animation beim Kartenwechsel; kompakteres Layout; Tipps entfernt.
- Safe Area: Bottom-Insets für Screens + Tab-Bar (`react-native-safe-area-context`).
- Fortschrittsleiste: Farben nach Kartenstatus (neutral / gelb / hellgrün / dunkelgrün).
- Abgeschlossene Übung: Zwischen-Screen + „Nochmal lernen“ (Queue neu, Fortschritt bleibt).
- Übungssterne: `StarProgressBar` bei 33/66/100% gelernt.
- Trainer-Buttons: ✅ Richtig · 🟡 Unsicher · ❌ Falsch (Fortschritt nur bei `gelernt`).
- Lernpfad: Emoji-Visuals statt Bilder (`lessonVisuals`).
- Avatare: 16 Tier-Emojis als Grid; Legacy-Mapping.
- Doku: [`docs/05_6_ux_refinement.md`](./05_6_ux_refinement.md)

---

## [Phase 5.5] – 2026-07-18

### Real Device Test Preparation

- Build-Check: `expo-doctor` 18/18; Icons/Splash 1024px; ungültige EAS-`projectId` entfernt.
- Preflight-Script: `npm run preflight`.
- Device-Test-Checkliste: [`docs/05_5_device_test.md`](./05_5_device_test.md).
- Dev-Logging: `[elifba:audio|storage|content|app]` ohne externe Analytics.
- Performance: Audio-Unload/Background-Stop, stabile Trainer-Callbacks, CelebrationModal im Root.

---

## [Phase 5] – 2026-07-18

### MVP Polish & Release Prep

- Settings: Sound, Animationen, Session-Limit, Fortschritt-Reset mit Bestätigung.
- Elternbereich entfernt (kein PIN / kein Parent-Flow).
- Onboarding in 3 Schritten (Willkommen → Erklärung → Profil).
- Trainer: Haptik, Audio-Fehlerhinweise, klarer Abschlusszustand.
- Progress-UX ohne technische IDs; Sterne + Lektionsfortschritt.
- Content-Validator: `npm run check-content`.
- Arabic: Font-Vorbereitung + RTL/Highlight-Polish.
- Release: app.json Version/Codes, eas.json APK-Preview.
- Doku: [`docs/05_mvp_polish.md`](./05_mvp_polish.md)

---

## [Phase 4] – 2026-07-18

### Kids UX

- Onboarding: Name + Avatar, lokale Profile (`/onboarding`).
- Mehrere Kinderprofile + Wechsel (`ProfileSwitcher`).
- Home: Begrüßung, Sterne/Serie, Weiterlernen-Karte mit Lernziel.
- Lernpfad: `LessonNode`, `ProgressRing`, `LockState` (linear, ⭐/🔒).
- Rewards-Basis: Sterne bei Übungs-/Lektionsabschluss + CelebrationModal.
- Trainer-Polish: Animationen, positives Feedback.
- Arabisch: RTL + Highlight `initial`/`middle`/`final`.
- Doku: [`docs/04_kids_ux.md`](./04_kids_ux.md)

### Abgrenzung

- Keine komplexe Gamification, keine Eltern-PIN-Erweiterung, keine L4–12.

---

## [SDK 54 Migration] – 2026-07-18

### Runtime

- Expo von SDK 57 auf **SDK 54.0.36** umgestellt (Kompatibilitätsanforderung).
- React Native **0.81.5**, React **19.1.0**, expo-router **~6.0.24**.
- Abhängigkeiten an `bundledNativeModules` von SDK 54 angeglichen.
- `expo-doctor`: 18/18 Checks bestanden; `npm run typecheck` grün.

### Hinweis

- Install ggf. mit Peer-Auflösung (`--legacy-peer-deps` beim initialen Clean-Install).
- Nach dem Wechsel Expo-CLI neu starten (`npx expo start -c`).

---

## [Phase 3] – 2026-07-18

### Learning Engine

- Content-System unter `mobile/src/content/` (Kapitel Elifba, Lektionen 1–3).
- Importiert 10 Web-Übungen (L1, L2, L3 Fetha/Kesra) mit **342** Karten + MP3 in `mobile/assets/audio/`.
- Audio: `playAudio` / `stopAudio` / `configureAudio` + statische `audioRegistry`.
- Trainer: Selbstbewertung Richtig/Unsicher/Nochmal, Queue-Reinsert (Pos. 3/9), Mastery nach 3× richtig.
- Progress: Kartenstatus in AsyncStorage; Resume-Session für „Weiterlernen“.
- Routing: Lernen → Lektion → Übung/Trainer verbunden.
- Dokumentation: [`docs/03_learning_engine.md`](./03_learning_engine.md)

### Abgrenzung

- Kein Damme, keine L4–12, keine Gamification, keine Eltern-PIN-Erweiterung.

### Verifikation

- `npm run typecheck` erfolgreich

---

## [Phase 2] – 2026-07-18

### Architektur & App-Shell

- Expo-Projekt unter `mobile/` bewertet und auf **`src/`-Architektur** umgebaut (nicht gelöscht).
- Stack bestätigt: Expo SDK ~57, TypeScript strict, Expo Router, NativeWind, Zustand, AsyncStorage, expo-av, expo-sqlite (Stub), Reanimated.
- Navigation: Tabs Home / Lernen / Fortschritt / Profil + Stack Lektion / Übung / Elternbereich.
- Design-Basis: `src/constants/theme.ts` + UI-Komponenten (`Button`, `Card`, `ScreenContainer`, `ProgressBar`, `Avatar`, `IconButton`).
- Domain-Types: Profile, Chapter, Lesson, Section, Exercise, Card, Progress, Session.
- Stores: `profileStore`, `settingsStore`, `progressStore` (Progress nur Struktur).
- Persistenz: AsyncStorage für Profile/Settings; SQLite nur vorbereitet.
- Dokumentation: [`docs/02_architecture.md`](./02_architecture.md)

### Verifikation

- `npm run typecheck` erfolgreich
- Metro/Expo startet (`Waiting on http://localhost:8081`)

### Abgrenzung

- Keine Trainer-/SRS-Logik, keine Content-Migration, kein Phase-3-Design-Feinschliff.

---

## [Phase 1] – 2026-07-18

### Dokumentation

- Bestehende Web-App analysiert (Struktur, Flows, Fortschritt, Audio, Implementierungsstand vs. Platzhalter).
- Analyse-Dokument erstellt: [`docs/01_analysis.md`](./01_analysis.md)
  - Lernstruktur (Kapitel / Lektionen / Abschnitte / Übungen)
  - Nutzergruppen (Kinder, Eltern)
  - Funktionen der Web-App
  - Mobile: behalten / redesignen / weglassen
  - MVP-Definition für Elifba Kids (Expo)
  - Empfohlener Tech-Stack
  - Explizite Aussage: **keine 1:1-Kopie** der Web-App
  - Offene Fragen für Folgephasen

### Abgrenzung

- Phase 1 enthält **nur** Analyse und Dokumentation.
- Keine Implementierung von Phase 2+.
- Keine Fortsetzung unfertiger Mobile-Scaffolding-Arbeit.
