# Phase 6 – Content Migration: Elifba Kids

**Status:** Abgeschlossen  
**Datum:** 2026-07-19  
**Grundlage:** [`01_analysis.md`](./01_analysis.md), [`02_architecture.md`](./02_architecture.md), [`03_learning_engine.md`](./03_learning_engine.md)  
**Code-Root:** `mobile/`  
**Skript:** [`scripts/import-content.py`](../scripts/import-content.py)

> Phase 6 übernimmt die **Elifba-Lehrinhalte** aus der offiziellen JPG-Bibliothek in typisierte Expo-Module.  
> **Nicht** enthalten: Audio-Integration, Avatar/Shop, neue Trainer-Features.

---

## 1. Quellen (getrennt)

| Quelle | Verwendung |
|--------|------------|
| **PWA** (`kapitel/elifba/…`) | Lektionstitel, Reihenfolge, IDs (`lesson-1`…`lesson-12`, `k1-l…`) |
| **JPG** (`https://elifba.ditib-akademie.de/files/mobile/XX.jpg`) | Tatsächliche Lehrinhalte (Buchstaben, Wörter, Erklärtexte) |

Die JPG-Struktur ist **nicht** identisch mit der PWA. Es gibt **keine** 1:1-Dateizuordnung aus dem PWA-Dateibaum.  
Seitengrenzen kommen ausschließlich aus dem **Inhaltsverzeichnis** (`7.jpg`, Teil 1 – Elifba).

JPGs werden **nur als Quelle** genutzt – sie erscheinen nicht als Bilder in der App.

---

## 2. Inhaltsverzeichnis Teil 1 – Elifba (`7.jpg`)

Nur **Teil 1 – Elifba** (Seiten bis vor Teil 2 ab S. 45).

| TOC-Titel | Start | Ende (inkl.) | Seiten |
|-----------|------:|-------------:|--------|
| Die Buchstaben des Korans | 14 | 17 | 14–17 |
| Die Vokalzeichen | 18 | 18 | 18 |
| Fetha | 18 | 19 | 18–19 |
| Kesra | 20 | 21 | 20–21 |
| Damme | 22 | 23 | 22–23 |
| Die Medd-Buchstaben | 24 | 27 | 24–27 |
| Das Dschezm-Zeichen | 28 | 29 | 28–29 |
| Schedde/Verdoppelung | 30 | 31 | 30–31 |
| Tenwin | 32 | 33 | 32–33 |
| Das runde Te (ة) | 34 | 34 | 34 |
| Das Dehnungszeichen | 35 | 35 | 35 |
| Verlängerungsbuchstaben | 36 | 36 | 36 |
| Hemze | 37 | 37 | 37 |
| Langes he (ه ﻪ) | 38 | 39 | 38–39 |
| Das Medd-Zeichen | 40 | 40 | 40 |
| Das Wort *Allah* | 41 | 41 | 41 |
| Die Mukatta'a-Buchstaben | 42 | 42 | 42 |
| ال El Der Artikel | 43 | 44 | 43–44 |

**Regel:** Inhalt einer TOC-Zeile gilt von `startPage` bis zur nächsten TOC-Startseite − 1.

Maschinenlesbar: `tmp/jpg-import/content-mapping.json` (wird vom Import-Skript geschrieben).

---

## 3. Zuordnung PWA → TOC → JPG

PWA-Titel unverändert (keine neuen Titel). TOC-Seiten werden den 12 PWA-Lektionen zugeordnet:

| # | PWA-ID | PWA-Titel | TOC-Bezug | JPG-Seiten |
|---|--------|-----------|-----------|------------|
| 1 | `lesson-1` | Buchstaben des Korans | Die Buchstaben… | 14–16 |
| 2 | `lesson-2` | Anfangs, Mittel- und Endstellung | Formen-Tabelle (S. 17) | 17 |
| 3 | `lesson-3` | Vokalzeichen | Fetha / Kesra / Damme | 18–23 |
| 4 | `lesson-4` | Die Dehnungsbuchstaben | Die Medd-Buchstaben | 24–27 |
| 5 | `lesson-5` | Das Dschezm-Zeichen | Das Dschezm-Zeichen | 28–29 |
| 6 | `lesson-6` | Das Schedde - Das Verdopplungszeichen | Schedde/Verdoppelung | 30–31 |
| 7 | `lesson-7` | Das Tenwin | Tenwin | 32–33 (+ S. 34 s. Offene Punkte) |
| 8 | `lesson-8` | Das runde Te | Das runde Te | 34 |
| 9 | `lesson-9` | Das Dehnungszeichen | Das Dehnungszeichen | 35 |
| 10 | `lesson-10` | Das Verlängerungszeichen | Verlängerungsbuchstaben + Medd-Zeichen | 36, 40 |
| 11 | `lesson-11` | Das Hemze | Hemze | 37 |
| 12 | `lesson-12` | Abschluss Elifba | Langes he, Allah, Mukatta'a, Artikel | 38–39, 41–44 |

Hinweis: TOC zählt S. 17 noch zu „Buchstaben“; die PWA führt die Positionsformen als eigene Lektion 2 – so übernommen.

---

## 4. Importierte Lektionen & Übungen

### 4.1 Bestehend (PWA→Expo, mit Audio) – unverändert

| Exercise-ID | Lektion | Titel |
|-------------|---------|-------|
| `k1-l1-a2` | 1 | Buchstaben des Korans |
| `k1-l2-a1` … `a3` | 2 | Anfangs- / Mittel- / Endstellung |
| `k1-l3-a1-ue2` … `ue4` | 3 | Fetha |
| `k1-l3-a2-ue2` … `ue4` | 3 | Kesra |

### 4.2 Neu aus JPG (Audio `null`)

| Exercise-ID | Lektion | Titel | JPG-Seiten |
|-------------|---------|-------|------------|
| `k1-l3-a3-ue2` | 3 | Damme – Einzelne | 22 |
| `k1-l3-a3-ue3` | 3 | Damme – Gruppen | 23 |
| `k1-l4-a1-ue2` | 4 | Dehnungs-Elif | 24 |
| `k1-l4-a2-ue2` | 4 | Dehnungs-Ye | 25 |
| `k1-l4-a3-ue2` | 4 | Dehnungs-Vav | 26 |
| `k1-l4-a4` | 4 | Alle Dehnungsbuchstaben | 27 |
| `k1-l5-a2` | 5 | Dschezm – Einzelne | 28 |
| `k1-l5-a3` | 5 | Dschezm – Gruppen | 29 |
| `k1-l6-a2` | 6 | Schedde – Einzelne | 30 |
| `k1-l6-a3` | 6 | Schedde – Gruppen | 31 |
| `k1-l7-a1-ue2` | 7 | Doppel-Fetha | 32 |
| `k1-l7-a2-ue2` | 7 | Doppel-Kesra | 33 |
| `k1-l7-a3-ue2` | 7 | Doppel-Damme | 34 |
| `k1-l8-a2` | 8 | Rundes Te | 34 |
| `k1-l9-a2` | 9 | Dehnungszeichen | 35 |
| `k1-l10-a2` | 10 | Verlängerungszeichen | 36, 40 |
| `k1-l11-a2` | 11 | Hemze | 37 |
| `k1-l12-a1` | 12 | Abschlussübungen | 38–39, 41–44 |

**Stand nach Import:** 12 Lektionen, **28** Übungen, **1185** Karten (`CONTENT_VERSION = 2`).

Generierte Dateien: `mobile/src/content/exercises/generated/*.ts`  
Lektionen: `mobile/src/content/lessons/lesson1.ts` … `lesson12.ts`

---

## 5. Datenmodell (kompatibel zum Trainer)

Bestehende Trainer-Struktur bleibt:

```ts
ContentLesson { id, chapterId, title, order, exerciseIds, sourcePages? }
ContentExercise { id, lessonId, title, type:'trainer', cards, audioBase, mode, order, explanation?, sourcePages? }
ContentCard { id, arabic, audioId: string | null, sourcePage?, tags? }
```

Neue Karten aus JPG:

```ts
{ id, arabic, audioId: null, sourcePage: 18, tags: [] }
```

(`audioId: null` entspricht dem Spec-Feld `audio: null` – Feldname bleibt `audioId` für Kompatibilität.)

---

## 6. Automatisierung

```bash
# JPGs laden + Content erzeugen
python3 scripts/import-content.py

# Nur Download
python3 scripts/import-content.py --download-only

# Ohne erneuten Download (nutzt tmp/jpg-import/)
python3 scripts/import-content.py --skip-download
```

Ablauf:

1. `7.jpg` + Seiten 14–44 laden  
2. TOC-Ranges berechnen  
3. Katalog `tmp/jpg-import/extracted-pages.json` einlesen  
4. TS-Übungen unter `exercises/generated/` schreiben  
5. Lektionen 1–12 + Chapter-/Index-Barrels aktualisieren  
6. Validator: fehlendes Audio = Warning (kein Error)

Extraktionskatalog: Vision-/manuelle Erfassung der Arabisch-Gitter (Tesseract allein ist für die stilisierten Glyphen unzuverlässig). Bei Inhaltskorrekturen Katalog anpassen und Skript erneut laufen lassen.

---

## 7. Fehlende Inhalte / Abweichungen

| Punkt | Status |
|-------|--------|
| Damme-Abschluss `k1-l3-a3-ue4` | **Fehlt** – JPG hat nur S. 22–23 (wie Fetha/Kesra-Abschlussseite nicht vorhanden) |
| Erklärungs-Abschnitte der PWA | Nicht als eigene Übungen; deutscher Text liegt in `explanation` wo extrahiert |
| Seite 17 Positionsformen | PWA-L2-Übungen mit Audio bleiben; JPG-S.17 nicht zusätzlich als Trainer-Karten importiert |
| Seiten 14–16 Buchstaben | L1 behält bestehende Audio-Karten; JPG als Quellenreferenz/`sourcePages` |
| Fetha/Kesra JPG 18–21 | Bestehende Audio-Übungen behalten (nicht überschrieben) |

---

## 8. Offene Punkte (nächste Phasen)

1. **Audio:** `audioId: null` → Assets + Registry (Phase 7+)  
2. **Seite 34:** enthält Doppel-Damme und rundes Te – aktuell in `k1-l7-a3-ue2` und `k1-l8-a2` geteilt; feiner Split nötig  
3. **OCR-Qualität:** einzelne Grid-Zellen (besonders S. 17, dichte Schedde/Dschezm-Seiten) manuell gegen JPG prüfen  
4. **Damme-Abschlussübung** falls später eine weitere Quelle existiert  
5. Erklärtexte in der Kids-UI anzeigen (derzeit nur im Content-Feld gespeichert)

---

## 9. Definition of Done

| Kriterium | Status |
|-----------|--------|
| Alle Elifba-Lektionen aus Teil 1 erkannt | ✓ |
| Seiten über `7.jpg` ermittelt | ✓ |
| JPG-Seiten analysiert (Katalog) | ✓ |
| Content-Dateien erzeugt | ✓ |
| Trainer-Struktur kompatibel | ✓ |
| Audio optional (`null`) | ✓ |
| Typecheck | ✓ `npm run typecheck` |
| Content Validator | ✓ `npm run check-content` (Warnings für fehlendes Audio) |

**STOPP nach dieser Phase** – keine Audio-Integration, keine weiteren Features.
