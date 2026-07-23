# Phase 2 – Architektur: Elifba Kids

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Grundlage:** [`docs/01_analysis.md`](./01_analysis.md)  
**Code-Root:** `mobile/`  
**Zielgruppe:** Externe Software-Architekt:innen / KI-Agenten für Phase 3+

> Phase 2 liefert **App-Shell, Navigation, Domain-Typen, Design-Basis und Persistenz-Vorbereitung**.  
> **Nicht** enthalten: Trainer-Logik, SRS, Content-Migration, vollständige Audio-Assets.

---

## 1. Architekturentscheidungen (Bewertung bestehendes `mobile/`)

Vor Phase 2 existierte bereits ein Expo-Scaffold unter `mobile/` (Tabs, NativeWind, Zustand). **Aktuell gültig: Expo SDK 54.**

| Entscheidung | Begründung |
|--------------|------------|
| **Beibehalten** | Expo Router, NativeWind 4, Zustand, expo-av, expo-sqlite, Reanimated, Gesture Handler, `app.json`-Branding „Elifba Kids“, EAS-Stub |
| **SDK-Pin** | Zielplattform: **Expo SDK 54** (React Native 0.81) — siehe Changelog-Eintrag „SDK 54 Migration“ |
| **Anpassen** | Code von Root-Ordnern (`components/`, `store/`, …) nach **`src/`** verschoben; Routen auf `lesson/[lessonId]` und `exercise/[exerciseId]` vereinheitlicht; `userStore` → **`profileStore`**; Theme-Tokens an Spec angeglichen |
| **Neu erstellt** | `ScreenContainer`, `IconButton`, Domain-Typen (`Profile`, `Section`, `Session`, …), Persistenz-Keys, Hydration-Hook, Architektur-Doku |
| **Entfernt** | Alte Root-Module und Routen `lesson/[id]`, `lesson/exercise` (vermeiden Doppelstrukturen) |
| **Nicht gewählt** | Clean-Delete von `mobile/` – unnötig, da Stack bereits passte; **keine WebView**, **keine HTML-Laufzeit** |

**Fazit:** Evolutionärer Umbau statt Greenfield – weniger Risiko, klare `src/`-Grenze.

---

## 2. Gesamtarchitektur

```
┌─────────────────────────────────────────────────────────┐
│  app/          Expo Router (UI-Routen, dünne Screens)   │
├─────────────────────────────────────────────────────────┤
│  src/components/ui   Design-System / wiederverwendbar   │
│  src/features/       Domänen-Features (später Logik)    │
│  src/content/        Curriculum-Kataloge (später)       │
│  src/store/          Zustand (Profile, Settings, Progress)│
│  src/services/       Audio, AsyncStorage, SQLite-Stub   │
│  src/types/          Domain-Modelle                     │
│  src/constants/      Theme, Avatare                     │
│  src/hooks/          App-Hydration etc.                 │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   AsyncStorage (MVP)      expo-sqlite (vorbereitet)
```

**Prinzipien**

1. **Screens sind dünn** – Layout + Navigation; Logik wandert in `features/` + `services/`.
2. **Content ist Daten** – typisierte Module unter `src/content/`, nie HTML.
3. **Kind-first UI** – große Touchflächen, wenig Text, Tabs.
4. **Offline-first** – lokale Profile/Settings; SQLite für feinkörnigen Fortschritt später.
5. **Keine 1:1-Web-Migration** – Web-IDs/Pädagogik als Referenz, native UX neu.

---

## 3. Ordnerstruktur (Ist nach Phase 2)

```
mobile/
├── app/                          # Expo Router
│   ├── _layout.tsx               # Root Stack, Hydration, DB/Audio init
│   ├── index.tsx                 # Redirect → /(tabs)/home
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom Tabs
│   │   ├── home.tsx
│   │   ├── learn.tsx
│   │   ├── progress.tsx
│   │   └── profile.tsx
│   ├── lesson/[lessonId].tsx
│   ├── exercise/[exerciseId].tsx
│   └── parent/settings.tsx
├── src/
│   ├── components/ui/            # Button, Card, ScreenContainer, …
│   ├── features/                 # learning | progress | profile | settings
│   ├── content/                  # Placeholder CONTENT_VERSION
│   ├── services/
│   │   ├── audio/player.ts
│   │   ├── storage/              # AsyncStorage + Strategie
│   │   └── database/             # SQLite Stub
│   ├── store/
│   │   ├── profileStore.ts
│   │   ├── settingsStore.ts
│   │   └── progressStore.ts
│   ├── hooks/useHydrateAppState.ts
│   ├── types/index.ts
│   ├── constants/theme.ts | avatars.ts
│   └── utils/math.ts
├── assets/                       # Expo-Assets (Icons, Splash) – absichtlich Root
├── global.css | tailwind | babel | metro
├── app.json | eas.json | package.json
└── …
```

**Path-Alias:** `@/*` → `./src/*` (`tsconfig.json`).

---

## 4. Verantwortlichkeiten

| Bereich | Verantwortung |
|---------|----------------|
| `app/` | Routing, Screen-Komposition, Header/Tabs |
| `components/ui` | Generische UI ohne Domänenlogik |
| `features/*` | Domänen-UI + Use-Cases (Phase 3+) |
| `content/` | Kapitel/Lektionen/Karten-Kataloge |
| `store/` | Client-State + Persistenz-Orchestrierung |
| `services/storage` | AsyncStorage-API, Key-Namespace |
| `services/database` | SQLite-Lebenszyklus (später Schema) |
| `services/audio` | expo-av Wiedergabe |
| `types/` | Kanonische Domain-Interfaces |

---

## 5. Navigation

**Tabs:** Home · Lernen · Fortschritt · Profil  

**Stack (zusätzlich):**

- `/lesson/[lessonId]` – Lektions-Shell  
- `/exercise/[exerciseId]` – Übungs-/Trainer-Shell (UI-Platzhalter)  
- `/parent/settings` – Modal, erreichbar per **Long-Press** auf Profil-Hinweis  

Phase-2-Screens enthalten **Header + Placeholder**; keine Lernlogik.

---

## 6. Datenfluss (Zielbild)

```
Content (src/content) ──► features/learning ──► Screens
                                │
                                ▼
                         progressStore
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
        AsyncStorage                      SQLite (später)
     (Profile, Settings,                  (Card-Stats,
      Session-Resume)                      Progress-Rows)
```

Aktuell: Profile/Settings hydrieren beim Start; Progress-Store nur Struktur.

---

## 7. State Management (Zustand)

| Store | Inhalt Phase 2 |
|-------|----------------|
| `profileStore` | Profile-Liste, aktives Kind, hydrate/upsert/persist |
| `settingsStore` | Sound, Session-Limit (10/20/30), PIN-Flag (noch ohne PIN-UI) |
| `progressStore` | `entries`, `session`, `stars`, `streak` – **ohne SRS** |

Persistenz der Profile/Settings über `services/storage`.

---

## 8. Persistenzstrategie

### AsyncStorage (jetzt)

Namespace: `@elifba_kids:`

| Key | Zweck |
|-----|--------|
| `profiles` | `Profile[]` |
| `active_profile_id` | aktives Kind |
| `settings` | Sound, Session-Limit, PIN-Flag |
| `session` | reserviert für Resume (Phase 8) |

### SQLite (vorbereitet)

- `initDatabase()` setzt Status `ready`, **ohne Schema**.  
- Empfohlen ab Progress-/Kartenstatistik (Phase 8): Tabellen `progress`, `card_stats`.  
- Migration AsyncStorage → SQLite dokumentieren, wenn Card-Level-Writes steigen.

---

## 9. Design-System (Basis)

Datei: `src/constants/theme.ts`

**Farben:** `primary`, `secondary`, `background`, `card`, `success`, `warning`, `error` (+ Soft-Varianten)  
**Typografie:** `arabicLarge`, `arabicMedium`, `heading`, `body`, `caption`  
**Spacing:** `small`, `medium`, `large`

**UI-Komponenten:** `Button`, `Card`, `ScreenContainer`, `ProgressBar`, `Avatar`, `IconButton`

NativeWind spiegelt Tokens in `tailwind.config.js`. Visuelles Feintuning → Phase 3.

---

## 10. Domain-Modell (Types)

Implementiert in `src/types/index.ts`:

`Profile`, `Chapter`, `Lesson`, `Section`, `Exercise`, `Card`, `Progress`, `Session`

plus Hilfstypen: `ExerciseType`, `HighlightMode`, `CardStatus`, `TrainerMode`, `AvatarId`

**Noch keine Content-Migration** – IDs der Web-App (`k1-l…`) sollen später bewusst übernommen werden (siehe Phase 1).

---

## 11. Asset- & Audio-Strategie

| Thema | Phase-2-Entscheidung |
|-------|----------------------|
| App-Icons / Splash | Expo `assets/images/` (Root, Convention) |
| Curriculum-Audio | Später bundlen unter z. B. `assets/audio/` oder `src/content` + require-Map |
| Audio-API | `services/audio/player.ts` mit expo-av; `configureAudioMode()` beim Start |
| Offline | Ziel: MP3 im Bundle; kein Streaming-MVP |
| HTML/WebView | **Verboten** für Lerninhalte |

---

## 12. Tech-Stack (fixiert)

| Paket | Rolle |
|-------|--------|
| Expo SDK ~54 | Runtime (fest gepinnt; RN 0.81) |
| TypeScript strict | Typisierung |
| expo-router | Navigation |
| nativewind + tailwindcss 3.4 | Styling |
| zustand | State |
| @react-native-async-storage/async-storage | Persistenz MVP |
| expo-sqlite | vorbereitet |
| expo-av | Audio |
| react-native-reanimated | Motion (bereit) |
| @expo/vector-icons | Icons |
| react-native-gesture-handler | Gesten / Root |

---

## 13. Definition of Done – Checkliste

| Kriterium | Status |
|-----------|--------|
| Expo App startet / Typecheck grün | ✓ `npm run typecheck` |
| Navigation + Tabs | ✓ |
| Design-System + Basis-Komponenten | ✓ |
| Domain-Types | ✓ |
| Stores | ✓ |
| Persistenz vorbereitet | ✓ AsyncStorage + SQLite-Stub |
| Dokumentation | ✓ dieses Dokument + Changelog |

**Start lokal:**

```bash
cd mobile
npm start
```

---

## 14. Offene Punkte / Empfehlungen für Phase 3

1. **Design-System vertiefen** – Animationen, arabische Fonts, Feedback-States (siehe geplante `docs/03_design_system.md`).  
2. **Content-Schema** – erste Kataloge für L1–L3 in `src/content/` (ohne volle Trainer-Engine).  
3. **Freischaltlogik** – linear vs. frei (offen aus Phase 1).  
4. **Mehrere Profile** – UI zum Anlegen/Wechseln.  
5. **Eltern-PIN** – Flag existiert, UI fehlt.  
6. **EAS `projectId`** – vor APK ersetzen.  
7. **Trainer-Shell** bereits unter `/exercise/[exerciseId]` – Phase 7 kann Logik andocken.

---

## 15. Explizite Abgrenzung

- Keine 1:1-Kopie der Web-PWA  
- Keine WebView / keine HTML-Inhalte zur Laufzeit  
- Keine SRS-/Bewertungslogik in Phase 2  
- Keine vollständige Content-Portierung  

---

*Ende Phase-2-Dokumentation. Nicht mit Phase 3 beginnen ohne Freigabe.*
