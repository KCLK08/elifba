import type { ContentExercise } from '../types';

import { k1_l1_a2 } from './k1_l1_a2';
import { k1_l2_a1 } from './k1_l2_a1';
import { k1_l2_a2 } from './k1_l2_a2';
import { k1_l2_a3 } from './k1_l2_a3';
import { k1_l3_a1_ue2 } from './k1_l3_a1_ue2';
import { k1_l3_a1_ue3 } from './k1_l3_a1_ue3';
import { k1_l3_a1_ue4 } from './k1_l3_a1_ue4';
import { k1_l3_a2_ue2 } from './k1_l3_a2_ue2';
import { k1_l3_a2_ue3 } from './k1_l3_a2_ue3';
import { k1_l3_a2_ue4 } from './k1_l3_a2_ue4';

import { k1_l10_a2 } from './generated/k1_l10_a2';
import { k1_l11_a2 } from './generated/k1_l11_a2';
import { k1_l12_a1 } from './generated/k1_l12_a1';
import { k1_l3_a3_ue2 } from './generated/k1_l3_a3_ue2';
import { k1_l3_a3_ue3 } from './generated/k1_l3_a3_ue3';
import { k1_l4_a1_ue2 } from './generated/k1_l4_a1_ue2';
import { k1_l4_a2_ue2 } from './generated/k1_l4_a2_ue2';
import { k1_l4_a3_ue2 } from './generated/k1_l4_a3_ue2';
import { k1_l4_a4 } from './generated/k1_l4_a4';
import { k1_l5_a2 } from './generated/k1_l5_a2';
import { k1_l5_a3 } from './generated/k1_l5_a3';
import { k1_l6_a2 } from './generated/k1_l6_a2';
import { k1_l6_a3 } from './generated/k1_l6_a3';
import { k1_l7_a1_ue2 } from './generated/k1_l7_a1_ue2';
import { k1_l7_a2_ue2 } from './generated/k1_l7_a2_ue2';
import { k1_l7_a3_ue2 } from './generated/k1_l7_a3_ue2';
import { k1_l8_a2 } from './generated/k1_l8_a2';
import { k1_l9_a2 } from './generated/k1_l9_a2';

export const exercises: ContentExercise[] = [
  k1_l1_a2,
  k1_l2_a1,
  k1_l2_a2,
  k1_l2_a3,
  k1_l3_a1_ue2,
  k1_l3_a1_ue3,
  k1_l3_a1_ue4,
  k1_l3_a2_ue2,
  k1_l3_a2_ue3,
  k1_l3_a2_ue4,
  k1_l10_a2,
  k1_l11_a2,
  k1_l12_a1,
  k1_l3_a3_ue2,
  k1_l3_a3_ue3,
  k1_l4_a1_ue2,
  k1_l4_a2_ue2,
  k1_l4_a3_ue2,
  k1_l4_a4,
  k1_l5_a2,
  k1_l5_a3,
  k1_l6_a2,
  k1_l6_a3,
  k1_l7_a1_ue2,
  k1_l7_a2_ue2,
  k1_l7_a3_ue2,
  k1_l8_a2,
  k1_l9_a2,
];

export function getExerciseById(id: string): ContentExercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getExercisesForLesson(lessonId: string): ContentExercise[] {
  return exercises
    .filter((e) => e.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);
}
