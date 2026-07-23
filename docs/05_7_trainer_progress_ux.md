# Phase 5.7 – Trainer & Progress UX Fixes

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Ziel:** Session- vs. Mastery-Fortschritt, Weiterlernen-Logik, Trainer-Queue-Anzeige, UI-Polish

---

## 1. Änderungen

### 1.1 Übung erneut lernen – Fortschritt trennen

| Art | Verhalten |
|-----|-----------|
| **Session Progress** | Bei „Nochmal lernen“ auf 0% / 0 gelernt; nur visuelle Runde |
| **Mastery Progress** | Unverändert im Progress-Store; Übung bleibt abgeschlossen; keine neuen Sterne |

- Practice schreibt **nicht** in `saveCardProgress`.
- Practice aktualisiert **nicht** die Resume-Session (`markExerciseVisited`).

### 1.2 Lektionsicons

- Rechte Icons (`LockState` / dekorative Emojis rechts) entfernt.
- Einzige visuelle Identität: linkes Lesson-Emoji (`lessonVisuals`).
- Status als Text unter dem Titel.
- Fortschritts-Tab: gleiches linkes Icon, kein Icon rechts an der Lektionszeile.

### 1.3 Home – Weiterlernen

`resolveContinueLearning`:

1. Session-Übung, falls Mastery &lt; 100%
2. Nächste offene Übung in freigeschalteter Lektion
3. Nächste freigeschaltete Lektion
4. Sonst: „Alle Übungen geschafft“

Wiederholungs-Sessions überschreiben Resume nicht.

### 1.4 Sterne in der Lektionsübersicht

- `StarProgressBar`: Sterne **nur im** Balken (keine zweite Reihe darüber).

### 1.5 Trainer – dynamischer Queue-Balken

- `TrainerQueueBar`: ein Segment pro Karte **in der Queue** (Reihenfolge = Queue).
- Falsch → Pos. ~3, Unsicher → ~9, Gelernt → Segment verschwindet; Rest wandert nach links.

### 1.6 Sterne im Trainer

- Meilensteine 33 / 66 / 100 % **gelernt** (Session-Zähler) im Trainer-Balken.

### 1.7 Abschluss-Screen

- Nach Abschluss: „Geschafft!“ + **Nochmal lernen** + **Zurück zum Lernpfad**.
- „Nochmal lernen“ nur wenn Mastery abgeschlossen (nicht mitten im ersten Durchlauf).

---

## 2. Technische Dateien

| Bereich | Dateien |
|---------|---------|
| Session/Practice | `useTrainer.ts`, `app/exercise/[exerciseId].tsx` |
| Queue-UI | `TrainerQueueBar.tsx`, `TrainerScreen.tsx` |
| Weiterlernen | `resolveContinueLearning.ts`, `home.tsx` |
| Icons | `LessonNode.tsx`, `progress.tsx` |
| Sterne | `StarProgressBar.tsx` |

---

## 3. Checks

```bash
cd mobile
npm run typecheck
npm run check-content
npx expo-doctor
```

### Manuell

- [ ] Erstabschluss zeigt „Nochmal lernen“
- [ ] Wiederholung: visueller Fortschritt bei 0%, Mastery bleibt 100%
- [ ] Keine doppelten Sterne-Belohnungen
- [ ] Weiterlernen = nächste offene Übung
- [ ] Practice überschreibt Resume nicht
- [ ] Queue bewegt sich bei Falsch/Unsicher/Gelernt
- [ ] Sterne im Trainer-Balken bei 33/66/100
- [ ] Keine rechten Lektions-Icons

---

## 4. Abgrenzung

- Keine Phase-6-Features, keine Content-Erweiterung.
