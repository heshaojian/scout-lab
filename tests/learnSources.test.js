import { describe, expect, it } from 'vitest';

import { getDailyLearningLink, getLearningCards, learningLinks } from '../src/services/learnSources.js';

describe('learning catalog', () => {
  it('contains the five maintained learning sources with safe metadata', () => {
    expect(learningLinks).toHaveLength(5);
    expect(learningLinks.every((item) => item.url.startsWith('https://'))).toBe(true);
    expect(learningLinks.map((item) => item.title)).toEqual(expect.arrayContaining([
      'Hugging Face Context Course',
      'Hugging Face Agents Course',
      'Hugging Face LLM Course',
      'Hugging Face Open-Source AI Cookbook',
      'Google Machine Learning Crash Course',
    ]));
  });

  it('resumes an in-progress item, then the first unfinished item', () => {
    expect(getDailyLearningLink({
      'learn:hf-agents-course': { status: 'in-progress' },
    }).id).toBe('learn:hf-agents-course');
    expect(getDailyLearningLink({
      'learn:hf-context-course': { status: 'done' },
    }).id).toBe('learn:hf-agents-course');
  });

  it('filters by focus, format, level, and progress and keeps in-progress first', () => {
    const progress = {
      'learn:hf-context-course': { status: 'done' },
      'learn:hf-agents-course': { status: 'in-progress' },
    };
    const cards = getLearningCards({ focus: 'agents', format: 'course', level: 'intermediate', progress: 'in-progress' }, progress);
    const foundational = getLearningCards({ focus: 'all', format: 'all', level: 'foundational', progress: 'all' }, progress);
    const all = getLearningCards({ focus: 'all', format: 'all', level: 'all', progress: 'all' }, progress);

    expect(cards.map((card) => card.id)).toEqual(['learn:hf-agents-course']);
    expect(foundational.map((card) => card.id)).toEqual(expect.arrayContaining([
      'learn:hf-llm-course', 'learn:google-ml-crash-course',
    ]));
    expect(all[0].id).toBe('learn:hf-agents-course');
    expect(all.at(-1).id).toBe('learn:hf-context-course');
    expect(all[0]).toMatchObject({ openLabel: 'Resume' });
    expect(all.at(-1)).toMatchObject({ openLabel: 'Review' });
    expect(all.find(({ id }) => id === 'learn:hf-llm-course').facts).toEqual([
      { label: 'Level', value: 'Foundational' },
      { label: 'Effort', value: '12 chapters' },
    ]);
  });
});
