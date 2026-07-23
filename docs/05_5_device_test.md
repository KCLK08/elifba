# Phase 5.5 – Real Device Test Preparation

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Ziel:** APK-/Geräte-Test von Elifba Kids vorbereiten und absichern

---

## 1. Build-Check (Ergebnis)

| Check | Ergebnis |
|-------|----------|
| `npx expo-doctor` | **18/18** bestanden |
| `npm run typecheck` | grün (vor Release erneut) |
| `npm run check-content` | 10 Übungen / 342 Karten OK |
| Icons | `icon.png` 1024×1024 |
| Splash | `splash-icon.png` 1024×1024 |
| SDK | Expo **54** / RN 0.81 |
| Package | `com.elifba.kids` · version `1.0.0` · `versionCode` 1 |

### Behoben / angepasst

- Ungültiger Placeholder `extra.eas.projectId` aus `app.json` entfernt (vor EAS: `eas init`).
- `description` in `app.json` ergänzt.
- Script `npm run preflight` = typecheck + content + doctor.

### APK bauen (Preview)

```bash
cd mobile
npm run preflight
npx eas-cli login          # falls nötig
npx eas-cli init          # setzt echte projectId
npx eas-cli build -p android --profile preview
```

`eas.json` → Profil `preview` erzeugt eine **APK** (internal distribution).

---

## 2. Device-Test-Checkliste

Gerät: Android · Build: Preview-APK · Datum: ________ · Tester: ________

### Installation

- [ ] APK installiert ohne Fehler
- [ ] App-Icon sichtbar („Elifba Kids“)
- [ ] App startet (Splash → App)

### Erster Start

- [ ] Kein Crash beim ersten Launch
- [ ] Onboarding erscheint (wenn keine Profile)

### Onboarding

- [ ] Willkommen-Text verständlich
- [ ] „So funktioniert’s“ lesbar
- [ ] Name eingeben möglich
- [ ] Avatar wählbar
- [ ] „Los geht’s“ öffnet Home

### Profil erstellen

- [ ] Name + Avatar werden auf Home angezeigt
- [ ] Zweites Kind über Profil → „Neues Kind“ anlegbar

### Lektion starten

- [ ] Lernpfad zeigt Lektion 1 offen
- [ ] Lektion 2/3 gesperrt bis vorherige fertig (oder erwartet)
- [ ] Übung öffnet Trainer

### Audio Offline

- [ ] Flugmodus / Offline: Audio spielt trotzdem (gebündelte MP3s)
- [ ] Sound aus (Einstellungen): Hinweis statt Crash
- [ ] Anhören mehrmals hintereinander funktioniert

### Trainer nutzen

- [ ] Arabische Karte groß lesbar
- [ ] Richtig / Unsicher / Nochmal reagieren
- [ ] Fortschrittsbalken bewegt sich
- [ ] Abschluss-Screen erscheint bei 100 %

### Fortschritt speichern

- [ ] Fortschritt-Tab zeigt Titel (keine technischen IDs)
- [ ] Sterne erhöhen sich nach Abschluss

### App schließen / neu öffnen

- [ ] App aus Recents schließen
- [ ] Neu öffnen: gleiches Profil
- [ ] Lernfortschritt erhalten
- [ ] „Weiterlernen“ zeigt letzte Übung / Buchstabe

### Profil wechseln

- [ ] Zweites Profil wählen
- [ ] Fortschritt ist getrennt (oder leer bei neuem Kind)

### Reset testen

- [ ] Einstellungen → Fortschritt löschen → Bestätigung
- [ ] Sterne/Progress weg, Profile bleiben
- [ ] Onboarding erscheint **nicht** erneut (Profile existieren)

### Negativfälle (kurz)

- [ ] Kein Crash bei schnellem Tippen im Trainer
- [ ] App in Hintergrund → zurück: kein hängendes Audio
- [ ] Logcat: bei Fehlern Prefixe `[elifba:audio|storage|content]`

---

## 3. Error Logging (Dev)

Modul: `src/services/logger.ts`

| Scope | Verwendung |
|-------|------------|
| `audio` | fehlende Assets, Playback-/Unload-Fehler |
| `storage` | AsyncStorage get/set/parse Fehler |
| `content` | unbekannte Exercise-IDs |
| `app` | Root-Init |

**Keine** externe Analytics. Filter in Logcat: `elifba:`

---

## 4. Performance-Hinweise (Phase 5.5)

| Thema | Maßnahme |
|-------|----------|
| Audio Cleanup | `stopAudio` + unload; Cleanup beim Unmount; Stop bei App-Background |
| Playback | unload nach `didJustFinish` |
| Re-Renders | `answer` nutzt Refs (stabile Callback-Deps); CelebrationModal einmal im Root |
| Animationen | abschaltbar via Settings |
| Memory | kein zweites Sound-Objekt parallel (`stop` vor `play`) |

Offen für spätere Phasen: Session-Limit im Trainer, React Compiler / Memo nur bei Messbedarf.

---

## 5. Bekannte Einschränkungen vor Device-Test

1. EAS `projectId` muss lokal per `eas init` gesetzt werden.
2. Icons sind noch Template-Assets (funktional, nicht final gebrandet).
3. Custom arabische Fonts noch nicht gebündelt.

---

*Ende Phase 5.5. STOPP.*
