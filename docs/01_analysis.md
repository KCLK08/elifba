# Phase 1 – Analyse: Elifba Kids

**Status:** Abgeschlossen (nur Dokumentation)  
**Datum:** 2026-07-18  
**Zielgruppe dieses Dokuments:** Externe Software-Architekt:innen / andere KI-Agenten, die Phase 2 planen  
**Scope:** Analyse der bestehenden Web-App; Ableitung MVP und Tech-Stack für die native App **Elifba Kids** (Expo)

> **Wichtig:** Phase 1 umfasst ausschließlich Analyse und Dokumentation. Es wird hier **kein** Mobile-Code implementiert und keine unfertige Scaffolding-Arbeit fortgesetzt.

---

## 1. Zweck und Abgrenzung

### 1.1 Was dieses Dokument leistet

Dieses Dokument beschreibt die bestehende Web-Anwendung im Repository `/Users/kazimcelik/Projects/elifba` so vollständig, dass jemand **ohne Vorwissen** Phase 2 (Architektur & Implementierungsplan für Elifba Kids) planen kann.

### 1.2 Explizite Abgrenzung: Keine 1:1-Kopie

**Elifba Kids ist keine 1:1-Kopie der Web-App.**

| Aspekt | Web-App (Ist) | Elifba Kids (Soll) |
|--------|---------------|-------------------|
| Plattform | Statische HTML/CSS/JS-PWA | Native Expo-App (iOS/Android) |
| Zielgruppe | Allgemeiner Lernweg (Jugendliche/Erwachsene möglich) | Primär **Kinder**, sekundär **Eltern** |
| UX | Kartenlisten, Text-Buttons, Web-Navigation | Kindgerechte UI, Avatare, klare Hierarchie, Tab-Navigation |
| Inhalte | 12 Lektionen geplant, L1–L3 teilweise fertig | MVP fokussiert auf **funktionierende** Inhalte; Platzhalter später |
| Speicher | `localStorage` / `sessionStorage` | AsyncStorage (+ SQLite-Vorbereitung) |
| Accounts | Keine | Kind-Profile (lokal), optional Elternansicht |
| Übungsform | Ein zentraler Letter-Trainer | Trainer als Kern; weitere Typen später möglich |

Die Web-App ist **Referenz für Lernstruktur, Übungsmechanik, Audio und Fortschrittslogik** – nicht für Layout, Navigationsmuster oder Code-Architektur.

---

## 2. Analyse der bestehenden Web-Anwendung

### 2.1 Technologie und Architektur (Ist)

| Komponente | Beschreibung |
|------------|--------------|
| Typ | Statische Multi-Page-App (kein Framework, kein Bundler) |
| Sprache | Deutsch (`lang="de"`) |
| Markup | Viele einzelne HTML-Dateien unter `kapitel/` |
| Styles | `css/style.css` (~1400 Zeilen), warmes Farbschema (`theme-color` `#b44d2a`) |
| Logik | Vanilla JS unter `js/` |
| Offline | PWA: `manifest.webmanifest`, Service Worker `sw.js`, `js/pwa-register.js` |
| Audio | Lokale MP3-Dateien unter `audio/` (~343 Dateien) |
| Persistenz | Browser-`localStorage` / `sessionStorage` |
| Backend | **Keins** – rein clientseitig |

**Kernmodule:**

| Datei | Rolle |
|-------|--------|
| `js/letter-trainer.js` | Interaktiver Buchstaben-/Silben-Trainer (~1577 Zeilen) |
| `js/progress.js` | Fortschritts-Aggregation und Overview-Tiles |
| `js/dashboard.js` | Detaillierter Fortschrittsbaum |
| `js/start.js` | „Weiterlernen“-Karte auf der Startseite |
| `js/exercise-list-progress.js` | Prozentanzeige in Listen |
| `js/reset-progress.js` | Fortschritt zurücksetzen (pro Lektion/Abschnitt) |
| `js/app.js` | Einfaches Klick-Audio für Grid-Zellen (`data-audio`) |

### 2.2 Benutzerflüsse (User Flows)

```
index.html (Start)
  ├─► Kapitelauswahl (kapitel/kapitel.html)
  │     └─► Kapitel Elifba (elifba.html)
  │           └─► Lektion N (lektionN.html)
  │                 └─► Abschnitt / Übungsliste
  │                       ├─► Erklärung (meist Platzhalter)
  │                       └─► Trainer-Übung ODER Platzhalter
  ├─► Dashboard (dashboard.html) – Fortschritt
  └─► Resume-Karte → letzte Session / nächste Übung
```

**Typischer Lernfluss (implementierte Trainer-Übung):**

1. Navigation Kapitel → Lektion → Abschnitt → Übung  
2. Anzeige einer arabischen Karte (Buchstabe oder Wortgruppe)  
3. Audio anhören (`Anhören`)  
4. Selbstbewertung: **Richtig** / **Unsicher** / **Falsch**  
5. Karte wird je nach Antwort in der Warteschlange neu positioniert  
6. Nach genug richtigen Antworten gilt die Karte als **gelernt**  
7. Fortschritt wird in `localStorage` gespeichert  
8. Bei Abschluss: Abschluss-UI, optional Weiterleitung zur nächsten Übung  

### 2.3 Datenmodell (implizit, Web)

Es gibt kein zentrales Schema. Inhalte und IDs sind **dupliziert** in HTML-JSON und mehreren JS-Dateien.

#### Hierarchie

```
Kapitel (chapter)
  └── Lektion (lesson)
        └── Abschnitt (section)
              └── Übung (exercise)   ← Fortschritts-ID, z. B. k1-l1-a2
                    └── Karten (letters[]) + Audio
```

#### Übungs-IDs (kanonisch in `progress.js` / `dashboard.js` / `start.js`)

Format: `k1-l{Lektion}-a{Abschnitt}[-ue{Übung}]`

Beispiele:

- `k1-l1-a2` – Lektion 1, Abschnitt 2  
- `k1-l3-a1-ue2` – Lektion 3, Abschnitt 1 (Fetha), Übung 2  

#### Trainer-Payload (`<script id="letter-data" type="application/json">`)

| Feld | Bedeutung |
|------|-----------|
| `letters` | Array der angezeigten Strings (Buchstaben oder Silben/Wörter) |
| `targets` | Optional: Zielbuchstabe zum Hervorheben (Positionsform) |
| `lispel` | Buchstaben mit besonderer Markierung (z. B. Lispellaute) |
| `accentGreen` | Zusätzliche Akzent-Markierung |
| `highlightMode` | `"all"` \| `"initial"` \| `"middle"` \| `"final"` |
| `audioBase` | Pfadpräfix; Datei = `{audioBase}{index}.mp3` (1-basiert) |
| `progressId` | ID für Fortschrittsspeicher |
| `nextUrl` / `homeUrl` | Navigation nach Abschluss / Home |
| `mode` | Startmodus `sequence` oder `shuffle` |
| `hideProgressBar` | Fortschrittsbalken ausblenden |

#### Fortschritt in `localStorage`

| Key-Muster | Inhalt |
|------------|--------|
| `elifba.progress.{id}.{mode}` | `{ learned, total, completedCount, … }` |
| `elifba.progress.{id}` | Legacy (nur sequence) |
| `elifba.mode.{id}` | `sequence` \| `shuffle` |
| `elifba.limit.{id}` | Kartenlimit pro Session (`all` oder Zahl) |
| `elifba.includeLearned.{id}` | Bereits Gelernte einbeziehen |
| `elifba.lastSession` | Letzte Pfad-/Übungs-Session für Resume |
| `elifba.lastPrompt.{id}` | Letzte angezeigte Karte (für Startseiten-Vorschau) |
| `elifba.batch.*` / `elifba.repeat*` / … | Batch- und Wiederholungsmodus |

**Modi:** `sequence` (Reihenfolge) und `shuffle` (Zufällig). Anzeige-Prozent = Max aus beiden Modi.

**Lernregel (Trainer):** Eine Karte gilt als gelernt nach **3× „richtig“** (`REQUIRED_CORRECT = 3`). Antworten „unsicher“/„falsch“ führen zu erneuter Einordnung in der Queue.

### 2.4 Audio

- Verzeichnis: `audio/kapitel-1/...` (Kapitel 1 = Elifba)  
- Benennung typisch: `K1.L{n}.A{m}.Audio{i}.mp3`  
- Trainer spielt `audioBase + (Kartenindex + 1) + ".mp3"`  
- Vorhanden für: **Lektion 1**, **Lektion 2** (alle 3 Abschnitte), **Lektion 3 Fetha & Kesra**  
- **Fehlt / inkonsistent:** Damme (L3 A3) – HTML verweist teils auf flache Pfade wie `audio/k1_l3_s3_e1_01.mp3`, die so nicht im Audio-Baum liegen; kein `letter-data`-Trainer  
- Ab Lektion 4+: keine Audio-Ordner für die Platzhalter-Übungen

### 2.5 Features der Web-App

| Feature | Status |
|---------|--------|
| Startseite mit Resume | Implementiert |
| Kapitel- / Lektionsnavigation | Implementiert (1 Kapitel sichtbar) |
| Letter-Trainer (Self-Assessment + Audio) | Implementiert (L1, L2, L3 Fetha/Kesra) |
| Fortschrittsübersicht auf Listen | Implementiert |
| Dashboard mit Baum | Implementiert |
| Fortschritt zurücksetzen | Implementiert (wo `reset-data` gesetzt) |
| Modus Reihenfolge/Zufällig | Implementiert (im Trainer) |
| Session-Limit / Batch / Wiederholen | Implementiert (komplex, im Trainer) |
| PWA / Offline-Cache | Grundlegend implementiert |
| Erklärungsseiten | **Platzhalter** („Hier folgt die Erklärung.“) |
| Elternbereich / Profile | **Nicht vorhanden** |
| Authentifizierung / Sync | **Nicht vorhanden** |
| Gamification (Sterne, Streaks) | **Nicht vorhanden** |
| Multiple-Choice / Drag-Drop | **Nicht vorhanden** (nur Trainer + ein Legacy-Audio-Grid bei Damme) |

---

## 3. Lernstruktur (Kapitel / Lektionen / Abschnitte / Übungen)

### 3.1 Kapitel

Aktuell nur **Kapitel 1: Elifba** (`chapter: "elifba"`).  
Kapitelauswahl zeigt einen Eintrag; weitere Kapitel sind vorbereitet im Sinne der Navigation, aber nicht befüllt.

### 3.2 Lektionen (1–12)

| # | Titel | Abschnitte / Inhalt |
|---|--------|---------------------|
| 1 | Buchstaben des Korans | 1.1 Erklärung · 1.2 Buchstaben lernen |
| 2 | Anfangs-, Mittel- und Endstellung | 2.1 Anfang · 2.2 Mittel · 2.3 Ende |
| 3 | Vokalzeichen | 3.1 Fetha · 3.2 Kesra · 3.3 Damme |
| 4 | Die Dehnungsbuchstaben | Elif / Ye / Vav / alle Dehnungen |
| 5 | Das Dschezm-Zeichen | Erklärung · einzeln · Gruppen |
| 6 | Das Schedde | Erklärung · einzeln · Gruppen |
| 7 | Das Tenwin | Doppel-Fetha / -Kesra / -Damme |
| 8 | Das runde Te | Erklärung · Übungen |
| 9 | Das Dehnungszeichen | Erklärung · Übungen |
| 10 | Das Verlängerungszeichen | Erklärung · Übungen |
| 11 | Das Hemze | Erklärung · Übungen |
| 12 | Abschluss Elifba | Abschlussübungen |

### 3.3 Implementierungsstand der Übungen

#### Vollständig als Letter-Trainer (mit `letter-data` + `letter-trainer.js`)

| ID | Titel | Karten (total) | Audio |
|----|--------|----------------|-------|
| `k1-l1-a2` | Buchstaben des Korans | 29 | ja |
| `k1-l2-a1` | Anfangsstellung | 29 | ja |
| `k1-l2-a2` | Mittelstellung | 29 | ja |
| `k1-l2-a3` | Endstellung | 29 | ja |
| `k1-l3-a1-ue2` | Buchstaben mit Fetha | 28 | ja |
| `k1-l3-a1-ue3` | Gruppen mit Fetha | 42 | ja |
| `k1-l3-a1-ue4` | Abschluss Fetha | 30 | ja |
| `k1-l3-a2-ue2` | Buchstaben mit Kesra | 28 | ja |
| `k1-l3-a2-ue3` | Gruppen mit Kesra | 42 | ja |
| `k1-l3-a2-ue4` | Abschluss Kesra | 56 | ja |

Zusätzlich existiert `buchstaben2.html` mit `progressId: "k1-l1-a2-alt"` (Variante; nicht in der zentralen Fortschrittsliste).

#### Teilweise / Legacy (nicht als vollwertiger Trainer)

| ID | Status |
|----|--------|
| `k1-l3-a3-ue2/3/4` (Damme) | HTML vorhanden; **kein** Letter-Trainer; Audio-Grid mit teils **falschen Pfaden**; Totals in Progress-JS gesetzt (29/20/15), aber ohne funktionierende Trainer-Persistenz wie bei L1–L3 Kesra |

#### Nur Platzhalter („Inhalt folgt“ / „Übung später“)

Alle Übungen ab **Lektion 4** sowie Erklärungen durchgängig:  
`k1-l4-*` … `k1-l12-a1` – Navigation und Progress-IDs existieren, **Inhalt und Totals = 0**.

#### Erklärungen

Alle `erklaerung.html`-Seiten sind Platzhalter ohne didaktischen Inhalt.

### 3.4 Didaktisches Muster (wiederkehrend)

1. **Erklärung** (Soll: Theorie)  
2. **Einzelbuchstaben / einfache Formen** mit Audio  
3. **Gruppen / Wörter** mit Hervorhebung (`targets` + `highlightMode`)  
4. **Abschlussübung**  

Dieses Muster sollte in der Mobile-App als Content-Schema abbildbar sein.

---

## 4. Nutzergruppen

### 4.1 Web-App (Ist)

- **Eine** anonyme Lernperson pro Browser  
- Keine Unterscheidung Kind / Eltern  
- Keine Multi-Profile  

### 4.2 Elifba Kids (Soll)

| Rolle | Bedürfnisse | Konsequenzen für die App |
|-------|-------------|---------------------------|
| **Kind** | Einfache Navigation, große Touch-Targets, Audio, motivierendes Feedback, Avatar | Kind-Modus als Haupt-UI; kurze Sessions; klare „Weiter“-Pfade |
| **Elternteil** | Überblick Fortschritt, ggf. Reset, Einstellung Kartenlimit/Hilfe | Separater Einstiegs-/Profilbereich; Fortschrittsansicht; keine komplexe Web-Dashboard-1:1-Übernahme |

MVP kann mit **lokalen Kind-Profilen** starten (Name + Avatar). Cloud-Accounts sind **nicht** MVP-Pflicht.

---

## 5. Mobile vs. Web: Behalten, Redesign, Weglassen

### 5.1 Behalten (fachlich / inhaltlich)

- Hierarchie Kapitel → Lektion → Abschnitt → Übung  
- Letter-Trainer-Kern: Anzeigen → Hören → Selbstbewertung → Spaced-Requeue → „gelernt“ nach N richtigen  
- Audio-Zuordnung pro Karte  
- Hervorhebung von Positionsformen (`initial` / `middle` / `final`)  
- Fortschritt pro Übung (mindestens: gelernt / gesamt / Prozent)  
- Resume „weitermachen wo aufgehört“  
- Modi Reihenfolge / Zufällig (vereinfacht, wenn nötig)  
- Bestehende Audio-Assets und arabische Kartendaten aus L1–L3  

### 5.2 Redesign (für Kinder / Native)

- Gesamte visuelle Sprache und Navigation (Tabs statt tiefer HTML-Pfade)  
- Onboarding mit Avatar/Name  
- Feedback (Sterne, kurze Animationen) statt nur Text-Completion  
- Eltern-freundliche Fortschrittsansicht statt dichter Web-Dashboard-Modals  
- Content als **zentrale Datenquelle** (JSON/TS), nicht pro HTML-Datei dupliziert  
- Speicherung über App-Stores (AsyncStorage/SQLite), nicht Browser-localStorage  
- Erklärungen als kindgerechte Screens (Illustrations/kurze Texte), sobald Inhalt vorliegt  

### 5.3 Weglassen / stark vereinfachen im MVP

- Service-Worker / PWA-Install  
- Komplexität von Batch-/Repeat-/Override-/Leave-Prompt-Logik der Web-App (nur das fachlich Nötige übernehmen)  
- Legacy-Audio-Grid (Damme-Zwischenlösung)  
- Unbenutzte Varianten (`k1-l1-a2-alt`)  
- Alle Platzhalter-Lektionen 4–12 als „leer anklickbar“ (besser: locked / „kommt bald“)  
- 1:1-Übernahme der Web-CSS und Button-Labels-Ästhetik  

### 5.4 Hinweis zum Ordner `mobile/`

Unter `mobile/` existiert bereits **Expo-Scaffolding** (Router-Tabs, Zustand-Stores, NativeWind, Beispieldaten).  
**Phase 1 wertet das nur als Kontext:** Es zeigt die beabsichtigte Richtung, ist aber **nicht** fertig und wird in Phase 1 **nicht** weitergebaut. Phase 2 soll bewusst entscheiden, was davon übernommen, refaktoriert oder neu aufgesetzt wird.

---

## 6. MVP-Definition: Elifba Kids

### 6.1 Produktziel (MVP)

Eine **offline-fähige native App** (Expo), in der Kinder die **fertigen** Elifba-Übungen aus der Web-App (Lektion 1–2 vollständig, Lektion 3 Fetha & Kesra) spielerisch trainieren können – mit Profil, Audio, Fortschritt und Resume.

### 6.2 In Scope (MVP)

1. **Onboarding:** Kind-Profil (Name + Avatar), Speicherung lokal  
2. **Home:** Begrüßung, Continue-Learning, grober Fortschritt  
3. **Lernen:** Navigation Kapitel Elifba → Lektionen 1–3 (nur freigeschaltete Übungen)  
4. **Trainer-Screen:** Karte, Audio (Expo AV), Richtig/Unsicher/Falsch, Queue-Logik, „gelernt“ nach 3× richtig  
5. **Content:** Port der implementierten Übungen (IDs, letters, targets, highlightMode, Audio-Dateien)  
6. **Fortschritt:** Pro Übung und aggregiert pro Lektion; Persistenz AsyncStorage  
7. **Profil/Einstellungen:** Avatar wechseln, Fortschritt zurücksetzen (mind. pro Übung/Lektion), optional Modus sequence/shuffle  
8. **UI:** Kindgerechtes Design (NativeWind), Tab-Navigation Home / Lernen / Fortschritt / Profil  

### 6.3 Explizit Out of Scope (MVP)

- Cloud-Sync, Login, Mehrgeräte  
- Lektionen 4–12 mit echten Inhalten  
- Vollständige Erklärungsinhalte (optional Stub „Bald verfügbar“)  
- Damme als voller Trainer (kann als „bald“ markiert werden, bis Audio/Daten geklärt sind)  
- Weitere Übungstypen (Multiple Choice, Drag & Drop) – Typen im Datenmodell vorsehen, UI nicht bauen  
- Eltern-Account mit PIN/Remote-Kontrolle (einfache Elternansicht lokal reicht)  
- Web-PWA parallel weiterentwickeln (kein MVP-Ziel)  

### 6.4 MVP-Erfolgskriterien

- Kind kann Profil anlegen und Lektion 1 starten  
- Audio spielt zuverlässig offline (gebündelte Assets)  
- Fortschritt überlebt App-Neustart  
- Mindestens L1 + L2 end-to-end spielbar; L3 Fetha/Kesra spielbar  
- Kein Crashtest auf leeren Platzhalter-Routen  

---

## 7. Empfohlener Tech-Stack

| Schicht | Empfehlung | Begründung |
|---------|------------|------------|
| Runtime | **Expo SDK 54** (React Native 0.81) | Schneller Native-Pfad, Assets, AV, Updates |
| Sprache | **TypeScript** | Sicheres Content-/Progress-Modell |
| Navigation | **Expo Router** | File-based Routes, Tabs, Deep Links später |
| Styling | **NativeWind** (Tailwind) | Schnelle UI, konsistente Tokens |
| State | **Zustand** | Leichtgewichtig für User/Progress/Settings |
| Persistenz kurzfristig | **AsyncStorage** | Profile, Settings, Fortschritt MVP |
| Persistenz mittelfristig | **expo-sqlite** (Vorbereitung) | Strukturierte Queries, Migrationen, spätere Sync |
| Audio | **expo-av** | MP3-Wiedergabe analog Web-Trainer |
| Icons | **@expo/vector-icons** | Tab- und Aktions-Icons |
| Motion | **react-native-reanimated** | Feedback-Animationen (Sterne, Kartenwechsel) |

**Nicht empfohlen für MVP:** Eigenes Backend, komplexes ORM, WebView-Einbettung der alten HTML-Seiten.

**Content-Strategie:** Arabische Karten + Metadaten als typisierte Module/JSON unter z. B. `mobile/content/`; Audio als App-Assets (oder dokumentierter Asset-Pipeline-Schritt). Keine HTML-Seiten zur Laufzeit laden.

---

## 8. Empfohlene Content- und Domain-Modelle (für Phase 2)

Als Orientierung (nicht implementiert in Phase 1):

```ts
// Skizze – kanonische IDs an Web anbinden wo sinnvoll
Chapter { id, title, order }
Lesson { id, chapterId, title, order, locked? }
Section { id, lessonId, title, order }
Exercise {
  id,              // z. B. "k1-l1-a2"
  sectionId,
  type: "trainer" | "explanation" | ...,
  title,
  cards: Card[],
  audioBase?,      // oder card.audio pro Eintrag
  nextExerciseId?
}
Card { id, arabic, target?, highlightMode?, tags? }
Progress {
  profileId, exerciseId, mode,
  learned, total, cardStats?, updatedAt
}
Profile { id, name, avatarId, createdAt }
```

Web-IDs (`k1-l…`) sollten übernommen werden, um Mapping und spätere Parität zu erleichtern.

---

## 9. Offene Fragen / Entscheidungen für nächste Phasen

### Produkt / Didaktik

1. Soll Damme (L3 A3) im MVP mitportiert werden, sobald Audio korrigiert ist – oder bewusst nach MVP?  
2. Wie ausführlich müssen **Erklärungen** sein (Text, Illustration, Video)? Wer liefert Inhalte?  
3. Freischaltlogik: linear (L2 erst nach L1) oder frei wählbar wie in der Web-App?  
4. Eltern-PIN / Kindersicherung nötig für Reset und Einstellungen?  
5. Gamification-Tiefe: nur Sterne oder auch Streaks/Badges?  

### Technik

6. Audio-Pipeline: Assets in-App bundlen vs. nachladen; Größenbudget für Stores?  
7. Wann von AsyncStorage auf SQLite migrieren (Phase 2 vs. 3)?  
8. Mehrere Kind-Profile pro Gerät – hartes MVP-Requirement?  
9. RTL / arabische Fonts: welches Font-Paket, Fallback-Strategie?  
10. Umgang mit bestehendem `mobile/`-Scaffold: fortführen vs. gezielter Clean-Start in Phase 2?  
11. Soll Fortschritt später mit der Web-PWA austauschbar sein (Export/Import)?  

### Inhalt / Datenqualität

12. `TOTALS` und Audio-Ordner-Namen (z. B. `uebung-1` vs. HTML `uebung-2`) vereinheitlichen.  
13. `buchstaben2.html` / `k1-l1-a2-alt` behalten oder verwerfen?  
14. Quelle der Wahrheit für Kartentexte: Web-HTML, Word/PDF (`K1 Elifba.docx`, `1_ders_sekilleri.pdf`) oder neue kuratierte JSON-Dateien?  

---

## 10. Empfohlene Phasenübersicht (nur Planung, nicht Teil von Phase 1)

| Phase | Fokus |
|-------|--------|
| **1** | Analyse + dieses Dokument *(diese Phase)* |
| **2** | Architektur, Content-Schema, App-Shell, Navigation, Persistenz-Design |
| **3** | Trainer + Port L1–L2 (+ L3 Fetha/Kesra), Audio, Progress |
| **4** | Polish Kinder-UX, Elternansicht, Erklärungen, Damme, weitere Lektionen |

---

## 11. Kurzfazit für Architekt:innen

Die Web-App ist eine **solide didaktische Referenz** mit einem ausgereiften Letter-Trainer und klarer Elifba-Struktur, aber **unvollständigen Inhalten ab Lektion 4**, Platzhalter-Erklärungen und **browserzentrierter** Technik.  

**Elifba Kids** übernimmt die **Lernlogik und fertigen Inhalte**, baut sie als **kindgerechte native Expo-App** neu und ist ausdrücklich **keine Pixel- oder Architektur-Kopie** der PWA.

---

*Ende Phase-1-Dokumentation. Keine Implementierung in diesem Schritt.*
