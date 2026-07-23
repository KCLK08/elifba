/**
 * Content quality checks for Elifba Kids.
 * Run: npm run check-content
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  chapters,
  exercises,
  getExerciseById,
  getLessonById,
  lessons,
} from '../src/content/index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const audioDir = path.join(root, 'assets', 'audio');

type Issue = { level: 'error' | 'warn'; message: string };

const issues: Issue[] = [];

function error(message: string) {
  issues.push({ level: 'error', message });
}
function warn(message: string) {
  issues.push({ level: 'warn', message });
}

const exerciseIds = new Set<string>();
const cardIds = new Set<string>();
const audioIds = new Set<string>();

for (const chapter of chapters) {
  for (const lessonId of chapter.lessonIds) {
    if (!getLessonById(lessonId)) {
      error(`Chapter ${chapter.id} references missing lesson ${lessonId}`);
    }
  }
}

for (const lesson of lessons) {
  if (!chapters.some((c) => c.id === lesson.chapterId)) {
    error(`Lesson ${lesson.id} has unknown chapterId ${lesson.chapterId}`);
  }
  for (const exerciseId of lesson.exerciseIds) {
    if (!getExerciseById(exerciseId)) {
      error(`Lesson ${lesson.id} references missing exercise ${exerciseId}`);
    }
  }
}

for (const exercise of exercises) {
  if (exerciseIds.has(exercise.id)) {
    error(`Duplicate exercise id: ${exercise.id}`);
  }
  exerciseIds.add(exercise.id);

  if (!getLessonById(exercise.lessonId)) {
    error(`Exercise ${exercise.id} has unknown lessonId ${exercise.lessonId}`);
  }

  if (!exercise.cards.length) {
    error(`Exercise ${exercise.id} has no cards`);
  }

  for (const card of exercise.cards) {
    if (cardIds.has(card.id)) {
      error(`Duplicate card id: ${card.id}`);
    }
    cardIds.add(card.id);

    if (!card.arabic?.trim()) {
      error(`Card ${card.id} has empty arabic text`);
    }
    if (card.audioId == null || card.audioId === '') {
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
    }
  }
}

// Orphan audio files (warn only)
if (fs.existsSync(audioDir)) {
  for (const file of fs.readdirSync(audioDir)) {
    if (!file.endsWith('.mp3')) continue;
    const id = file.replace(/\.mp3$/, '');
    if (!audioIds.has(id)) {
      warn(`Orphan audio file (not referenced): ${file}`);
    }
  }
}

const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warn');

console.log(`Content check: ${exercises.length} exercises, ${cardIds.size} cards`);
for (const issue of issues) {
  console.log(`${issue.level.toUpperCase()}: ${issue.message}`);
}

if (errors.length) {
  console.error(`\nFAILED with ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`\nOK — ${warnings.length} warning(s).`);
