# Phase 3 – Learning Engine: Elifba Kids

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Grundlage:** [`01_analysis.md`](./01_analysis.md), [`02_architecture.md`](./02_architecture.md)  
**Code-Root:** `mobile/`

> Phase 3 liefert den **funktionierenden Lernkern**: Content L1–L3 (ohne Damme), Audio, Trainer mit Selbstbewertung, einfache Queue-Wiederholung, Fortschritt in AsyncStorage.  
> **Nicht** enthalten: Gamification, Eltern-PIN, Lektionen 4–12.

---

## 1. Content-Struktur

```
mobile/src/content/
├── index.ts              # Katalog-API
├── version.ts            # CONTENT_VERSION = 1
├── types.ts              # ContentExercise / ContentCard / …
├── chapters/elifba.ts
├── lessons/
│   ├── lesson1.ts
│   ├── lesson2.ts
│   └── lesson3.ts
└── exercises/
    ├── index.ts
    ├── k1_l1_a2.ts
    ├── k1_l2_a1.ts … k1_l2_a3.ts
    └── k1_l3_a1_ue2.ts … k1_l3_a2_ue4.ts
```

### Content-Modell

**Exercise:** `id`, `lessonId`, `title`, `type: 'trainer'`, `cards`, `audioBase`, `mode`, `order`  
**Card:** `id`, `arabic`, `audioId`, `target?`, `highlightMode?`, `tags?`

Web-IDs (`k1-l…`) bleiben kanonisch.

---

## 2. Importierte Übungen

| ID | Lektion | Titel | Karten | Audio |
|----|---------|-------|-------:|------:|
| `k1-l1-a2` | lesson-1 | Buchstaben des Korans | 29 | 29 |
| `k1-l2-a1` | lesson-2 | Anfangsstellung | 29 | 29 |
| `k1-l2-a2` | lesson-2 | Mittelstellung | 29 | 29 |
| `k1-l2-a3` | lesson-2 | Endstellung | 29 | 29 |
| `k1-l3-a1-ue2` | lesson-3 | Fetha – Einzelne | 28 | 28 |
| `k1-l3-a1-ue3` | lesson-3 | Fetha – Gruppen | 42 | 42 |
| `k1-l3-a1-ue4` | lesson-3 | Fetha – Abschluss | 30 | 30 |
| `k1-l3-a2-ue2` | lesson-3 | Kesra – Einzelne | 28 | 28 |
| `k1-l3-a2-ue3` | lesson-3 | Kesra – Gruppen | 42 | 42 |
| `k1-l3-a2-ue4` | lesson-3 | Kesra – Abschluss | 56 | 56 |

**Summe:** 10 Übungen, **342** Karten/Audio-Dateien  

**Nicht importiert:** Damme (`k1-l3-a3-*`), L4–L12, Erklärungs-Stubs, `buchstaben2` / `k1-l1-a2-alt`

Quelle: Web-HTML `letter-data` JSON + MP3 unter `audio/kapitel-1/…` → kopiert nach `mobile/assets/audio/{audioId}.mp3`.

---

## 3. Audio-System

```
src/services/audio/
├── audioPlayer / player.ts   # playAudio, stopAudio, configureAudio
├── audioRegistry.ts          # audioId → require(asset)  (statisch generiert)
├── types.ts
└── index.ts
```

- **Keine dynamischen Dateipfade** – Metro braucht statische `require()`.
- Registry: `audioId` z. B. `k1-l1-a2-1` → `require('../../../assets/audio/k1-l1-a2-1.mp3')`.
- Wiedergabe: `expo-av` (`Audio.Sound.createAsync`).
- Silent-Mode iOS: `playsInSilentModeIOS: true`.

---

## 4. Trainer-Architektur

```
src/features/learning/trainer/
├── TrainerScreen.tsx   # UI-Orchestrierung
├── TrainerCard.tsx     # große arabische Darstellung + Highlight
├── useTrainer.ts       # Session-State, Audio, Persistenz-Anbindung
├── queue.ts            # Queue / Re-Insert
├── scoring.ts          # Statusübergänge
└── index.ts
```

### UI

- Großer arabischer Prompt  
- **Anhören** (IconButton)  
- Bewertung: **Richtig** · **Unsicher** · **Nochmal** (`falsch`)

### Scoring (an Web angelehnt, vereinfacht)

| Antwort | Effekt |
|---------|--------|
| Richtig | Status-Leiter → nach 3× richtig in Folge: `gelernt` |
| Unsicher | Status `unsicher`, Counter 0, Re-Insert bei Pos. 9 |
| Nochmal | Status `falsch`, Counter 0, Re-Insert bei Pos. 3 |

Konstanten: `REQUIRED_CORRECT = 3`, `RED_POS = 3`, `YELLOW_POS = 9`.

Gelernte Karten verlassen die Queue. Session gilt als abgeschlossen, wenn alle Karten `gelernt` sind.

**Noch keine** finale SRS-Optimierung (Batches 10/20/30, Shuffle-Modus-Persistenz, Repeat-Modals).

---

## 5. Progress-System

Store: `src/store/progressStore.ts`  
Persistenz: AsyncStorage Key `@elifba_kids:progress` + `:session`

Pro Karte gespeichert:

```ts
{
  status: CardStatus,
  correctCount: number,
  updatedAt: string
}
```

Gruppiert nach `profileId::exerciseId` mit `lessonId`, `exerciseId`, `cards`.

Zusätzlich: **Session**-Snapshot für „Weiterlernen“ (`exerciseId`, `lastCardPreview`, …).

Hydration beim App-Start über `useHydrateAppState`.

---

## 6. Routing

| Route | Verhalten |
|-------|-----------|
| `/(tabs)/learn` | Kapitel Elifba → Lektionen 1–3 + %-Fortschritt |
| `/lesson/[lessonId]` | Übungsliste der Lektion |
| `/exercise/[exerciseId]` | `TrainerScreen` |
| `/(tabs)/home` | Resume / Weiterlernen |
| `/(tabs)/progress` | %-Werte je Lektion/Übung |

---

## 7. Testdaten / Smoke-Flow

1. App starten (Default-Profil „Yusuf“)  
2. Lernen → Lektion 1 → Übung `k1-l1-a2`  
3. Anhören → Richtig/Unsicher/Nochmal tippen  
4. Fortschritt-Tab zeigt Prozent  
5. App schließen / neu öffnen → Kartenstatus bleibt (AsyncStorage)

```bash
cd mobile
npm start
npm run typecheck
```

---

## 8. Offene Probleme / nächste Schritte

1. **Audio-Bundle-Größe** (~342 MP3) – für Stores ggf. komprimieren oder lazy laden (Phase 9).  
2. **Batch-Limits / Shuffle** aus Web noch nicht portiert.  
3. **Highlight-Logik** für komplexe `targets`-Arrays ist vereinfacht (Zeichen-Match).  
4. **Profil anlegen UI** – aktuell Default-Profil; Onboarding folgt später.  
5. **SQLite** weiterhin Stub – Card-Stats liegen in AsyncStorage.  
6. Damme + L4–12 bewusst ausgelassen.  
7. Regenerierung Content/Audio: Python-Importskript war einmalig in der Session; bei Web-Änderungen neu erzeugen.

---

## 9. Abgrenzung

- Keine Gamification (Sterne/Streaks als Belohnung)  
- Keine neuen Elternfunktionen  
- Keine Lektionen 4–12  
- Keine WebView / HTML-Laufzeit  

---

*Ende Phase-3-Dokumentation. Nicht mit Phase 4 beginnen ohne Freigabe.*
