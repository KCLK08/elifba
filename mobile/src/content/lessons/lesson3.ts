import type { ContentLesson } from '../types';

export const lesson3: ContentLesson = {
  id: 'lesson-3',
  chapterId: 'elifba',
  title: 'Vokalzeichen',
  order: 3,
  sourcePages: [18, 19, 20, 21, 22, 23],
  exerciseIds: [
    'k1-l3-a1-ue1',
    'k1-l3-a1-ue2',
    'k1-l3-a1-ue3',
    'k1-l3-a1-ue4',
    'k1-l3-a2-ue1',
    'k1-l3-a2-ue2',
    'k1-l3-a2-ue3',
    'k1-l3-a2-ue4',
    'k1-l3-a3-ue1',
    'k1-l3-a3-ue2',
    'k1-l3-a3-ue3',
    'k1-l3-a3-ue4',
  ],
  sections: [
    {
      id: 'l3-a1',
      title: 'Fetha',
      order: 1,
      exerciseIds: [
        'k1-l3-a1-ue1',
        'k1-l3-a1-ue2',
        'k1-l3-a1-ue3',
        'k1-l3-a1-ue4',
      ],
    },
    {
      id: 'l3-a2',
      title: 'Kesra',
      order: 2,
      exerciseIds: [
        'k1-l3-a2-ue1',
        'k1-l3-a2-ue2',
        'k1-l3-a2-ue3',
        'k1-l3-a2-ue4',
      ],
    },
    {
      id: 'l3-a3',
      title: 'Damme',
      order: 3,
      exerciseIds: [
        'k1-l3-a3-ue1',
        'k1-l3-a3-ue2',
        'k1-l3-a3-ue3',
        'k1-l3-a3-ue4',
      ],
    },
  ],
};
