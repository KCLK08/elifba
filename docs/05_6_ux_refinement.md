# Phase 5.6 – UX Bugfixes & Trainer Refinement

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Ziel:** Bestehende Kinder-UX verbessern – keine neuen Features, keine Content-Erweiterung

---

## 1. Änderungen

### 1.1 Arabische Leserichtung (RTL)

- Alle arabischen Texte nutzen `writingDirection: 'rtl'`, `textAlign: 'right'`, Container `direction: 'rtl'`.
- Zentral in `arabicTextStyle` / `arabicBaseStyle`.
- Angewendet in: `ArabicLetterView` / TrainerCard, Home-Preview, Progress-Preview, Onboarding-Beispiel.
- Deutsche UI bleibt LTR.

### 1.2 Arabische Schrift vergrößert

- `typography.arabicLarge`: **112** (Buchstaben-Fokus).
- `typography.arabicMedium`: **64** (Wörter/Gruppen).
- Karte bleibt visueller Hauptfokus vor Buttons.

### 1.3 Kartenanimation entfernt

- Kein Zoom/Fade mehr beim Kartenwechsel (`ArabicLetterView` ohne Enter/Exit).
- Beibehalten: Celebration nach Abschluss, kurzes Feedback nach Bewertung (wenn Animationen an).

### 1.4 Android Navigation / Safe Area

- Root: `SafeAreaProvider`.
- `ScreenContainer`: Bottom-Padding über `useSafeAreaInsets`.
- Tab-Bar: Höhe + `paddingBottom` = System-Inset.
- Besonders relevant: TrainerScreen und untere Buttons.

### 1.5 Trainer-Fortschritt (Statusfarben)

Neue Progress-Leiste `TrainerStatusBar` – ein Segment pro Karte:

| Status | Farbe |
|--------|--------|
| Falsch / unbeantwortet | Neutral grau |
| Unsicher | Gelb |
| Richtig (diese Runde korrekt) | Hellgrün |
| Gelernt (`REQUIRED_CORRECT`) | Dunkelgrün |

- Nutzt bestehendes `CardStatus` (`richtig` vs `gelernt`) – kein separates `learningStatus` nötig.
- Fortschritt zeigt damit mehr als nur „gelernt“.

### 1.6 Trainer-Layout kompakter

- Reihenfolge: Arabische Karte → Anhören → kleiner Abstand → Bewertungen.
- Tipps wie „Achte auf den Anfang“ / „Beachte die Form“ sind nicht im Trainer (Fokus: sehen → hören → bewerten).

### 1.7 Profil-Avatare

- Nur Tier-Emojis (16 Stück): Fuchs, Katze, Hund, Panda, Koala, Tiger, Löwe, Affe, Frosch, Hase, Bär, Pinguin, Eule, Schildkröte, Oktopus, Einhorn.
- Keine Sterne, Formen oder menschlichen Avatare.
- Auswahl als Grid im Onboarding.
- Legacy-IDs (`bird`, `star`) werden auf Eule gemappt.

### 1.8 Arabische Zeichenreihenfolge (Nachzug)

- Ursache: `flex-row-reverse` + `direction: rtl` kehrte die logische Reihenfolge doppelt um.
- Fix: Ein Parent-`Text` mit nested `Text`-Spans → korrektes Unicode-Bidi und Buchstabenverbindung.
- Erster Buchstabe steht rechts; Gruppen/Wörter/Silben korrekt.

### 1.9 Übung erneut lernen

- Abgeschlossene Übung öffnet zuerst `ExerciseCompletedGate` (nicht direkt den Trainer).
- „Nochmal lernen“: neue Session-Queue inkl. gelernter Karten; gespeicherter Fortschritt bleibt.
- Vorbereitung: Queue-Filter `hardOnly` für später „Nur schwierige Karten“.

### 1.10 Sterne im Übungsfortschritt

- `StarProgressBar`: max. 3 Sterne bei ca. 33% / 66% / 100% **gelernt**.
- Sterne über dem Balken + auf dem Fill-Track; Fortschritt = gelernt, nicht nur beantwortet.

### 1.11 Lektionskarten (Lernpfad)

- Keine Fotos/Bilder: `lessonVisuals` mit Emoji + Label + Akzentfarbe (austauschbar).
- `LessonNode`: Emoji im Fortschrittsring + Status (`LockState`).

### 1.12 Bewertungsbuttons (Nachzug)

- Drei klare Zustände: **✅ Richtig** · **🟡 Unsicher** · **❌ Falsch** (nicht „Nochmal“).
- Falsch: Status `falsch`, `correctCount = 0`, Queue-Pos. ~3, Feedback „Nochmal versuchen 😊“.
- Unsicher: Status `unsicher`, `correctCount = 0`, Queue-Pos. ~9.
- Richtig: `correctCount +1`, Status `richtig`; nach 3× hintereinander → `gelernt` (Queue verlassen).
- Fortschritt (`X von Y gelernt` / Prozent / Sterne) steigt **nur** bei `gelernt`, nicht bei jedem Richtig.

---

## 2. Technische Anpassungen

| Bereich | Dateien |
|---------|---------|
| RTL / Arabic | `arabicDisplay.ts`, `arabicFonts.ts`, `ArabicLetterView.tsx`, Home/Progress/Onboarding |
| Theme | `theme.ts` (`arabicLarge`, `cardStatusColors`) |
| Trainer | `TrainerScreen.tsx`, `TrainerStatusBar.tsx`, `ExerciseCompletedGate.tsx`, `useTrainer`, `queue.ts` |
| Sterne | `StarProgressBar.tsx`, Lesson-Screen |
| Lernpfad | `lessonVisuals.ts`, `LessonNode.tsx` |
| Safe Area | `ScreenContainer.tsx`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx` |
| Avatare | `avatars.ts`, `types` `AvatarId`, `Avatar.tsx`, `OnboardingScreen.tsx`, `profileStore` |

---

## 3. Checks

```bash
cd mobile
npm run typecheck
npm run check-content
npx expo-doctor
# oder: npm run preflight
```

### Manuell

- [ ] RTL Arabisch (Trainer, Previews)
- [ ] Arabische Gruppen/Wörter richtige Zeichenreihenfolge
- [ ] Kleine Android-Geräte (Schriftgröße, Buttons)
- [ ] Trainer ohne Kartenwechsel-Animation
- [ ] Safe Area unten (Tabs + Trainer)
- [ ] Statusfarben in der Progress-Leiste
- [ ] Avatar-Grid (nur Tiere)
- [ ] Abgeschlossene Übung → Gate → Nochmal lernen
- [ ] Sterne bei 33 / 66 / 100 % gelernt
- [ ] Lernpfad mit Emoji-Visuals (ohne Bilder)

---

## 4. Offene Punkte

- Custom Arabic-Font (Noto Naskh) noch nicht gebündelt – Systemfont + RTL.
- Echte Geräte-Validierung der Safe-Area auf mehreren Android-OEMs.
- Optional: Avatar später im Profil-Screen ändern (aktuell nur Onboarding).
- UI für „Nur schwierige Karten wiederholen“ (Filter `hardOnly` ist vorbereitet).

---

## 5. Abgrenzung

- Keine Phase-6-Features.
- Keine Content-Erweiterung (kein Damme, keine L4–12).
- Keine neuen Lernmodi.
