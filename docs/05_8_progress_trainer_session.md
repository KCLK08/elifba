# Phase 5.8 – Progress, Trainer UX & Session Settings Fixes

**Status:** Abgeschlossen  
**Datum:** 2026-07-18

---

## 1. Änderungen

### 1.1 Fortschritt zurücksetzen (vollständig)

- `resetLocalProgress`: leert `byExercise`, Session, `progressEpoch++`, entfernt Storage-Keys.
- Zusätzlich: Rewards (`resetAllRewards`) + Übungs-Einstellungen.
- UI abonniert `byExercise` / `progressEpoch` (Lernpfad, Lektion, Home, Progress) → Ringe/Status aktualisieren sofort.
- Nach Reset: Navigation zum Lernpfad; Profile bleiben.

### 1.2 Sterne über dem Balken

- `MilestoneStars`: zentriert über dem Balken, Pop nur beim erstmaligen Erreichen.
- Balken ohne Sterne darin (`StarProgressBar`, `TrainerQueueBar`).

### 1.3 Nochmal lernen – Farben

- Practice startet mit frischen Session-Stats (`unbeantwortet` = grau).
- Mastery im Store unverändert.

### 1.4 Trainer kompakter

- Weniger Abstand Karte → Anhören → Bewertung (`justify-start`, kleinere Margins).

### 1.5 Session-Limit aktiv

- Global: 10 / 20 / 30 / Alle.
- Pro Übung überschreibbar (⚙️ im Trainer).
- Queue wird auf Limit begrenzt; Rest in späteren Sessions („Mehr lernen“).

### 1.6 Übungs-Einstellungen

- ⚙️ oben rechts: Session-Limit + Abfragemodus (Reihenfolge / Zufällig).
- Speicherung in `exerciseSettingsStore` (pro Übung).

### 1.7 Queue / Mastery

- Limit ändert nur die Session-Queue, nicht den Mastery-Store.
- Falsch/Unsicher weiterhin Positions-3 / 9 innerhalb der Session.

---

## 2. Checks

```bash
cd mobile && npm run typecheck && npm run check-content && npx expo-doctor
```

### Manuell

- [ ] Reset → Ringe 0%, keine Sterne, kein Resume
- [ ] Sterne über Balken, Pop einmalig
- [ ] Practice: graue Segmente, Mastery 100%
- [ ] Kompaktes Trainer-Layout
- [ ] Limit 10/20/30/Alle + Mehr lernen
- [ ] Zufällig / Reihenfolge
- [ ] Einstellungen bleiben erhalten

---

## 3. Abgrenzung

Keine Phase-6-Features, keine Content-Erweiterung.
