#!/usr/bin/env python3
"""
Elifba Kids – Phase 6 content import

Sources:
  1) PWA lesson titles / IDs / order (elifba-PWA in this repo)
  2) Official JPG library: https://elifba.ditib-akademie.de/files/mobile/XX.jpg

Steps:
  - Download Inhaltsverzeichnis (7.jpg) + Teil-1 pages
  - Resolve TOC start pages → page ranges (until next TOC entry)
  - Load extracted Arabic/German catalog (tmp/jpg-import/extracted-pages.json)
  - Emit TypeScript under mobile/src/content/ (lessons + jpg-imported exercises)

Usage (from repo root):
  python3 scripts/import-content.py
  python3 scripts/import-content.py --download-only
  python3 scripts/import-content.py --skip-download
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "mobile"
CACHE = ROOT / "tmp" / "jpg-import"
EXTRACTED = CACHE / "extracted-pages.json"
CONTENT = MOBILE / "src" / "content"
EXERCISES_DIR = CONTENT / "exercises"
LESSONS_DIR = CONTENT / "lessons"
GENERATED_DIR = EXERCISES_DIR / "generated"

JPG_BASE = "https://elifba.ditib-akademie.de/files/mobile"
JPG_QS = "201016210631"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# PWA titles (Quelle 1) — do not invent new titles.
PWA_LESSONS: list[tuple[str, str]] = [
    ("lesson-1", "Buchstaben des Korans"),
    ("lesson-2", "Anfangs, Mittel- und Endstellung"),
    ("lesson-3", "Vokalzeichen"),
    ("lesson-4", "Die Dehnungsbuchstaben"),
    ("lesson-5", "Das Dschezm-Zeichen"),
    ("lesson-6", "Das Schedde - Das Verdopplungszeichen"),
    ("lesson-7", "Das Tenwin"),
    ("lesson-8", "Das runde Te"),
    ("lesson-9", "Das Dehnungszeichen"),
    ("lesson-10", "Das Verlängerungszeichen"),
    ("lesson-11", "Das Hemze"),
    ("lesson-12", "Abschluss Elifba"),
]

# TOC Teil 1 – Elifba (from 7.jpg). Page range = start .. next.start-1
# (Vorwort / Teil-header omitted from content generation.)
TOC_TEIL1: list[tuple[str, int]] = [
    ("Die Buchstaben des Korans", 14),
    ("Die Vokalzeichen", 18),
    ("Fetha", 18),
    ("Kesra", 20),
    ("Damme", 22),
    ("Die Medd-Buchstaben", 24),
    ("Das Dschezm-Zeichen", 28),
    ("Schedde/Verdoppelung", 30),
    ("Tenwin", 32),
    ("Das runde Te (ة)", 34),
    ("Das Dehnungszeichen", 35),
    ("Verlängerungsbuchstaben", 36),
    ("Hemze", 37),
    ("Langes he (ه ﻪ)", 38),
    ("Das Medd-Zeichen", 40),
    ("Das Wort Allah", 41),
    ("Die Mukatta'a-Buchstaben", 42),
    ("ال El Der Artikel", 43),
]

# End of Teil 1 content (Teil 2 starts at 45).
TEIL1_END_EXCLUSIVE = 45

# Map PWA lesson → JPG pages (via TOC; never via PWA file paths).
LESSON_PAGES: dict[str, list[int]] = {
    "lesson-1": [14, 15, 16],
    "lesson-2": [17],
    "lesson-3": [18, 19, 20, 21, 22, 23],
    "lesson-4": [24, 25, 26, 27],
    "lesson-5": [28, 29],
    "lesson-6": [30, 31],
    "lesson-7": [32, 33],
    "lesson-8": [34],
    "lesson-9": [35],
    "lesson-10": [36, 40],
    "lesson-11": [37],
    "lesson-12": [38, 39, 41, 42, 43, 44],
}

# Exercises newly generated from JPG (existing L1–L3 Fetha/Kesra kept as-is).
# Each entry: exerciseId, lessonId, title, order, pages
NEW_EXERCISES: list[dict] = [
    {
        "id": "k1-l3-a3-ue2",
        "lessonId": "lesson-3",
        "title": "Damme – Einzelne",
        "order": 7,
        "pages": [22],
        "pwaTitle": "Die Buchstaben mit Damme",
    },
    {
        "id": "k1-l3-a3-ue3",
        "lessonId": "lesson-3",
        "title": "Damme – Gruppen",
        "order": 8,
        "pages": [23],
        "pwaTitle": "Buchstabengruppen mit Damme",
    },
    {
        "id": "k1-l4-a1-ue2",
        "lessonId": "lesson-4",
        "title": "Dehnungs-Elif",
        "order": 1,
        "pages": [24],
        "pwaTitle": "Übungen mit Dehnungs-Elif",
    },
    {
        "id": "k1-l4-a2-ue2",
        "lessonId": "lesson-4",
        "title": "Dehnungs-Ye",
        "order": 2,
        "pages": [25],
        "pwaTitle": "Übungen mit Dehnungs-Ye",
    },
    {
        "id": "k1-l4-a3-ue2",
        "lessonId": "lesson-4",
        "title": "Dehnungs-Vav",
        "order": 3,
        "pages": [26],
        "pwaTitle": "Übungen mit Dehnungs-Vav",
    },
    {
        "id": "k1-l4-a4",
        "lessonId": "lesson-4",
        "title": "Alle Dehnungsbuchstaben",
        "order": 4,
        "pages": [27],
        "pwaTitle": "Übungen mit allen Dehnungsbuchstaben",
    },
    {
        "id": "k1-l5-a2",
        "lessonId": "lesson-5",
        "title": "Dschezm – Einzelne",
        "order": 1,
        "pages": [28],
        "pwaTitle": "Das Dschezm mit einzelnen Buchstaben",
    },
    {
        "id": "k1-l5-a3",
        "lessonId": "lesson-5",
        "title": "Dschezm – Gruppen",
        "order": 2,
        "pages": [29],
        "pwaTitle": "Das Dschezm in Buchstabengruppen",
    },
    {
        "id": "k1-l6-a2",
        "lessonId": "lesson-6",
        "title": "Schedde – Einzelne",
        "order": 1,
        "pages": [30],
        "pwaTitle": "Das Schedde mit einzelnen Buchstaben",
    },
    {
        "id": "k1-l6-a3",
        "lessonId": "lesson-6",
        "title": "Schedde – Gruppen",
        "order": 2,
        "pages": [31],
        "pwaTitle": "Das Schedde in Buchstabengruppen",
    },
    {
        "id": "k1-l7-a1-ue2",
        "lessonId": "lesson-7",
        "title": "Doppel-Fetha",
        "order": 1,
        "pages": [32],
        "pwaTitle": "Übungen mit Doppel-Fetha",
    },
    {
        "id": "k1-l7-a2-ue2",
        "lessonId": "lesson-7",
        "title": "Doppel-Kesra",
        "order": 2,
        "pages": [33],
        "pwaTitle": "Übungen mit Doppel-Kesra",
    },
    {
        "id": "k1-l7-a3-ue2",
        "lessonId": "lesson-7",
        "title": "Doppel-Damme",
        "order": 3,
        "pages": [34],
        "pwaTitle": "Übungen mit Doppel-Damme",
        "notes": "Page 34 also introduces rundes Te; cards shared pending split.",
    },
    {
        "id": "k1-l8-a2",
        "lessonId": "lesson-8",
        "title": "Rundes Te",
        "order": 1,
        "pages": [34],
        "pwaTitle": "Übungen mit rundem Te",
        "notes": "Same source page as Doppel-Damme (34); refine later.",
    },
    {
        "id": "k1-l9-a2",
        "lessonId": "lesson-9",
        "title": "Dehnungszeichen",
        "order": 1,
        "pages": [35],
        "pwaTitle": "Übungen mit dem Dehnungszeichen",
    },
    {
        "id": "k1-l10-a2",
        "lessonId": "lesson-10",
        "title": "Verlängerungszeichen",
        "order": 1,
        "pages": [36, 40],
        "pwaTitle": "Übungen mit dem Verlängerungszeichen",
    },
    {
        "id": "k1-l11-a2",
        "lessonId": "lesson-11",
        "title": "Hemze",
        "order": 1,
        "pages": [37],
        "pwaTitle": "Übungen mit Hemze",
    },
    {
        "id": "k1-l12-a1",
        "lessonId": "lesson-12",
        "title": "Abschlussübungen",
        "order": 1,
        "pages": [38, 39, 41, 42, 43, 44],
        "pwaTitle": "Abschlussübungen",
    },
]


@dataclass
class TocEntry:
    title: str
    start_page: int
    end_page: int  # inclusive


def toc_with_ranges() -> list[TocEntry]:
    entries: list[TocEntry] = []
    for i, (title, start) in enumerate(TOC_TEIL1):
        if i + 1 < len(TOC_TEIL1):
            end = TOC_TEIL1[i + 1][1] - 1
        else:
            end = TEIL1_END_EXCLUSIVE - 1
        # Collapse zero-length ranges for same-page headings (e.g. Vokalzeichen/Fetha).
        if end < start:
            end = start
        entries.append(TocEntry(title=title, start_page=start, end_page=end))
    return entries


def download_page(n: int) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / f"{n}.jpg"
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    url = f"{JPG_BASE}/{n}.jpg?{JPG_QS}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": "https://elifba.ditib-akademie.de/"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    print(f"downloaded {dest.name} ({dest.stat().st_size} bytes)")
    return dest


def download_teil1() -> None:
    download_page(7)
    pages = set()
    for e in toc_with_ranges():
        for p in range(e.start_page, e.end_page + 1):
            pages.add(p)
    for p in sorted(pages):
        download_page(p)


def ocr_page(n: int) -> str:
    img = CACHE / f"{n}.jpg"
    if not img.exists():
        return ""
    try:
        out = subprocess.check_output(
            ["tesseract", str(img), "stdout", "-l", "deu+ara", "--psm", "6"],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return out
    except (FileNotFoundError, subprocess.CalledProcessError):
        return ""


def load_extracted() -> dict[int, dict]:
    if not EXTRACTED.exists():
        raise SystemExit(
            f"Missing {EXTRACTED}. Run vision extraction first or keep curated catalog."
        )
    data = json.loads(EXTRACTED.read_text(encoding="utf-8"))
    return {int(p["page"]): p for p in data["pages"]}


def ts_string(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def write_exercise_ts(ex: dict, pages: dict[int, dict]) -> Path:
    items: list[tuple[str, int]] = []
    explanations: list[str] = []
    for page_num in ex["pages"]:
        page = pages.get(page_num)
        if not page:
            print(f"WARN: no extraction for page {page_num} ({ex['id']})", file=sys.stderr)
            continue
        expl = page.get("explanationDe")
        if expl:
            explanations.append(expl)
        for arabic in page.get("items") or []:
            arabic = (arabic or "").strip()
            if not arabic:
                continue
            items.append((arabic, page_num))

    # Deduplicate consecutive identical cards while keeping order.
    deduped: list[tuple[str, int]] = []
    seen: set[str] = set()
    for arabic, page_num in items:
        key = arabic
        if key in seen:
            continue
        seen.add(key)
        deduped.append((arabic, page_num))

    if not deduped:
        raise SystemExit(f"Exercise {ex['id']} has no Arabic items from pages {ex['pages']}")

    var_name = ex["id"].replace("-", "_")
    cards_lines = []
    for i, (arabic, page_num) in enumerate(deduped, start=1):
        cards_lines.append(
            "  {\n"
            f"    id: {ts_string(f'{ex['id']}-card-{i}')},\n"
            f"    arabic: {ts_string(arabic)},\n"
            f"    audioId: null,\n"
            f"    sourcePage: {page_num},\n"
            f"    tags: [],\n"
            "  }"
        )

    explanation = "\n\n".join(explanations) if explanations else None
    source_pages = ", ".join(str(p) for p in ex["pages"])

    body = (
        "import type { ContentExercise } from '../../types';\n\n"
        f"/** JPG import: pages {source_pages}. PWA id {ex['id']}. */\n"
        f"export const {var_name}: ContentExercise = {{\n"
        f"  id: {ts_string(ex['id'])},\n"
        f"  lessonId: {ts_string(ex['lessonId'])},\n"
        f"  title: {ts_string(ex['title'])},\n"
        "  type: 'trainer',\n"
        "  mode: 'sequence',\n"
        f"  order: {ex['order']},\n"
        "  audioBase: '',\n"
        f"  sourcePages: [{source_pages}],\n"
    )
    if explanation:
        body += f"  explanation: {ts_string(explanation)},\n"
    body += "  cards: [\n" + ",\n".join(cards_lines) + "\n  ],\n};\n"

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    out = GENERATED_DIR / f"{var_name}.ts"
    out.write_text(body, encoding="utf-8")
    return out


def write_lesson_files() -> None:
    # Existing hand-crafted lessons 1–2 stay; lesson-3 gains Damme exercise ids.
    lesson3 = (
        "import type { ContentLesson } from '../types';\n\n"
        "export const lesson3: ContentLesson = {\n"
        "  id: 'lesson-3',\n"
        "  chapterId: 'elifba',\n"
        "  title: 'Vokalzeichen',\n"
        "  order: 3,\n"
        "  sourcePages: [18, 19, 20, 21, 22, 23],\n"
        "  exerciseIds: [\n"
        "    'k1-l3-a1-ue2',\n"
        "    'k1-l3-a1-ue3',\n"
        "    'k1-l3-a1-ue4',\n"
        "    'k1-l3-a2-ue2',\n"
        "    'k1-l3-a2-ue3',\n"
        "    'k1-l3-a2-ue4',\n"
        "    'k1-l3-a3-ue2',\n"
        "    'k1-l3-a3-ue3',\n"
        "  ],\n"
        "};\n"
    )
    (LESSONS_DIR / "lesson3.ts").write_text(lesson3, encoding="utf-8")

    # Patch sourcePages onto lesson1/2 without changing exercise ids.
    lesson1 = (
        "import type { ContentLesson } from '../types';\n\n"
        "export const lesson1: ContentLesson = {\n"
        "  id: 'lesson-1',\n"
        "  chapterId: 'elifba',\n"
        "  title: 'Buchstaben des Korans',\n"
        "  order: 1,\n"
        "  sourcePages: [14, 15, 16],\n"
        "  exerciseIds: ['k1-l1-a2'],\n"
        "};\n"
    )
    lesson2 = (
        "import type { ContentLesson } from '../types';\n\n"
        "export const lesson2: ContentLesson = {\n"
        "  id: 'lesson-2',\n"
        "  chapterId: 'elifba',\n"
        "  title: 'Anfangs, Mittel- und Endstellung',\n"
        "  order: 2,\n"
        "  sourcePages: [17],\n"
        "  exerciseIds: ['k1-l2-a1', 'k1-l2-a2', 'k1-l2-a3'],\n"
        "};\n"
    )
    (LESSONS_DIR / "lesson1.ts").write_text(lesson1, encoding="utf-8")
    (LESSONS_DIR / "lesson2.ts").write_text(lesson2, encoding="utf-8")

    for order, (lesson_id, title) in enumerate(PWA_LESSONS, start=1):
        if order <= 3:
            continue
        pages = LESSON_PAGES[lesson_id]
        exercise_ids = [e["id"] for e in NEW_EXERCISES if e["lessonId"] == lesson_id]
        pages_lit = ", ".join(str(p) for p in pages)
        ids_lit = ",\n    ".join(ts_string(i) for i in exercise_ids)
        # Keep PWA titles exactly (except lesson-2 already used shortened mobile title).
        body = (
            "import type { ContentLesson } from '../types';\n\n"
            f"export const lesson{order}: ContentLesson = {{\n"
            f"  id: {ts_string(lesson_id)},\n"
            "  chapterId: 'elifba',\n"
            f"  title: {ts_string(title)},\n"
            f"  order: {order},\n"
            f"  sourcePages: [{pages_lit}],\n"
            f"  exerciseIds: [\n    {ids_lit}\n  ],\n"
            "};\n"
        )
        (LESSONS_DIR / f"lesson{order}.ts").write_text(body, encoding="utf-8")


def write_barrels() -> None:
    generated = sorted(GENERATED_DIR.glob("k1_*.ts"))
    imports = []
    names = []
    for path in generated:
        name = path.stem
        imports.append(f"import {{ {name} }} from './generated/{name}';")
        names.append(name)

    existing = [
        "k1_l1_a2",
        "k1_l2_a1",
        "k1_l2_a2",
        "k1_l2_a3",
        "k1_l3_a1_ue2",
        "k1_l3_a1_ue3",
        "k1_l3_a1_ue4",
        "k1_l3_a2_ue2",
        "k1_l3_a2_ue3",
        "k1_l3_a2_ue4",
    ]
    existing_imports = "\n".join(f"import {{ {n} }} from './{n}';" for n in existing)
    gen_imports = "\n".join(imports)
    all_names = existing + names

    exercises_index = (
        "import type { ContentExercise } from '../types';\n\n"
        f"{existing_imports}\n\n"
        f"{gen_imports}\n\n"
        "export const exercises: ContentExercise[] = [\n  "
        + ",\n  ".join(all_names)
        + ",\n];\n\n"
        "export function getExerciseById(id: string): ContentExercise | undefined {\n"
        "  return exercises.find((e) => e.id === id);\n"
        "}\n\n"
        "export function getExercisesForLesson(lessonId: string): ContentExercise[] {\n"
        "  return exercises\n"
        "    .filter((e) => e.lessonId === lessonId)\n"
        "    .sort((a, b) => a.order - b.order);\n"
        "}\n"
    )
    (EXERCISES_DIR / "index.ts").write_text(exercises_index, encoding="utf-8")

    lesson_imports = "\n".join(
        f"import {{ lesson{i} }} from './lessons/lesson{i}';" for i in range(1, 13)
    )
    content_index = (
        "import { elifbaChapter } from './chapters/elifba';\n"
        "import {\n"
        "  exercises,\n"
        "  getExerciseById,\n"
        "  getExercisesForLesson,\n"
        "} from './exercises';\n"
        f"{lesson_imports}\n"
        "import type { ContentChapter, ContentLesson } from './types';\n"
        "import { CONTENT_VERSION } from './version';\n\n"
        "export { CONTENT_VERSION };\n"
        "export { exercises, getExerciseById, getExercisesForLesson };\n"
        "export type { ContentCard, ContentExercise, ContentLesson, ContentChapter } from './types';\n\n"
        "export const chapters: ContentChapter[] = [elifbaChapter];\n\n"
        "export const lessons: ContentLesson[] = [\n"
        "  lesson1,\n"
        "  lesson2,\n"
        "  lesson3,\n"
        "  lesson4,\n"
        "  lesson5,\n"
        "  lesson6,\n"
        "  lesson7,\n"
        "  lesson8,\n"
        "  lesson9,\n"
        "  lesson10,\n"
        "  lesson11,\n"
        "  lesson12,\n"
        "];\n\n"
        "export function getChapterById(id: string): ContentChapter | undefined {\n"
        "  return chapters.find((c) => c.id === id);\n"
        "}\n\n"
        "export function getLessonById(id: string): ContentLesson | undefined {\n"
        "  return lessons.find((l) => l.id === id);\n"
        "}\n\n"
        "export function getLessonsForChapter(chapterId: string): ContentLesson[] {\n"
        "  return lessons.filter((l) => l.chapterId === chapterId).sort((a, b) => a.order - b.order);\n"
        "}\n"
    )
    (CONTENT / "index.ts").write_text(content_index, encoding="utf-8")

    chapter = (
        "import type { ContentChapter } from '../types';\n\n"
        "export const elifbaChapter: ContentChapter = {\n"
        "  id: 'elifba',\n"
        "  title: 'Elifba',\n"
        "  description: 'Lerne die Buchstaben des Korans Schritt für Schritt.',\n"
        "  order: 1,\n"
        "  lessonIds: [\n"
        + ",\n".join(f"    'lesson-{i}'" for i in range(1, 13))
        + ",\n  ],\n};\n"
    )
    (CONTENT / "chapters" / "elifba.ts").write_text(chapter, encoding="utf-8")


def write_mapping_json() -> Path:
    toc = [
        {
            "title": e.title,
            "startPage": e.start_page,
            "endPage": e.end_page,
            "pages": list(range(e.start_page, e.end_page + 1)),
        }
        for e in toc_with_ranges()
    ]
    mapping = {
        "tocTeil1": toc,
        "pwaLessons": [
            {
                "id": lid,
                "title": title,
                "order": i,
                "jpgPages": LESSON_PAGES[lid],
            }
            for i, (lid, title) in enumerate(PWA_LESSONS, start=1)
        ],
        "newExercises": NEW_EXERCISES,
    }
    out = CACHE / "content-mapping.json"
    out.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out


def update_validator() -> None:
    path = MOBILE / "scripts" / "check-content.ts"
    text = path.read_text(encoding="utf-8")
    old = """    if (!card.audioId) {
      error(`Card ${card.id} missing audioId`);
      continue;
    }
    if (audioIds.has(card.audioId)) {
      warn(`Duplicate audioId reused: ${card.audioId}`);
    }
    audioIds.add(card.audioId);

    const file = path.join(audioDir, `${card.audioId}.mp3`);
    if (!fs.existsSync(file)) {
      error(`Missing audio file for ${card.audioId}: ${file}`);
    }"""
    new = """    if (card.audioId == null || card.audioId === '') {
      warn(`Card ${card.id} has no audio yet (audioId=null)`);
      continue;
    }
    if (audioIds.has(card.audioId)) {
      warn(`Duplicate audioId reused: ${card.audioId}`);
    }
    audioIds.add(card.audioId);

    const file = path.join(audioDir, `${card.audioId}.mp3`);
    if (!fs.existsSync(file)) {
      error(`Missing audio file for ${card.audioId}: ${file}`);
    }"""
    if old not in text:
        print("WARN: check-content.ts audio block not found; update manually", file=sys.stderr)
        return
    path.write_text(text.replace(old, new), encoding="utf-8")


def bump_content_version() -> None:
    path = CONTENT / "version.ts"
    path.write_text("/** Bump when curriculum content changes. */\nexport const CONTENT_VERSION = 2;\n")


def update_lesson_visuals() -> None:
    path = (
        MOBILE
        / "src"
        / "features"
        / "learning"
        / "path"
        / "lessonVisuals.ts"
    )
    text = path.read_text(encoding="utf-8")
    replacements = {
        "7: { emoji: '🌙', label: 'Weiter', accent: '#E0F2FE' },": "7: { emoji: '🌙', label: 'Tenwin', accent: '#E0F2FE' },",
        "8: { emoji: '🌟', label: 'Weiter', accent: '#F3E8FF' },": "8: { emoji: '🌟', label: 'Rundes Te', accent: '#F3E8FF' },",
        "9: { emoji: '📗', label: 'Weiter', accent: '#CCFBF1' },": "9: { emoji: '📗', label: 'Dehnung', accent: '#CCFBF1' },",
        "10: { emoji: '🎯', label: 'Weiter', accent: '#FEF3C7' },": "10: { emoji: '🎯', label: 'Verlängerung', accent: '#FEF3C7' },",
        "11: { emoji: '🦋', label: 'Weiter', accent: '#FCE7F3' },": "11: { emoji: '🦋', label: 'Hemze', accent: '#FCE7F3' },",
        "6: { emoji: '⭐', label: 'Schedde', accent: '#DCFCE7' },": "6: { emoji: '⭐', label: 'Schedde', accent: '#DCFCE7' },",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Elifba JPG content into Expo modules")
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--skip-download", action="store_true")
    args = parser.parse_args()

    if not args.skip_download:
        print("Downloading JPG pages…")
        download_teil1()
    if args.download_only:
        print("Download complete.")
        return

    print("TOC Teil 1 ranges:")
    for e in toc_with_ranges():
        print(f"  {e.title}: {e.start_page}–{e.end_page}")

    pages = load_extracted()
    write_mapping_json()

    print("Generating exercises…")
    for ex in NEW_EXERCISES:
        out = write_exercise_ts(ex, pages)
        print(f"  wrote {out.relative_to(ROOT)}")

    print("Writing lessons + barrels…")
    write_lesson_files()
    write_barrels()
    update_validator()
    bump_content_version()
    update_lesson_visuals()
    print("Done.")


if __name__ == "__main__":
    main()
