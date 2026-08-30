import { describe, expect, it } from 'vitest';

import {
  backfillLibraryAnnotations,
  createLibraryCard,
  getLibraryCards,
  isLibraryMember,
  updateLibraryAnnotation,
} from '../src/services/library.js';

const card = (overrides = {}) => ({
  id: 'github:openai/evals', source: 'github', section: 'code', type: 'Code',
  title: 'openai/evals', url: 'https://github.com/openai/evals', summary: 'Evaluation framework.',
  tags: ['evaluation', 'Python'], metricLabel: 'Stars', metricValue: '18k',
  metrics: [{ id: 'stars', label: 'Stars', value: 18000, meaning: 'Total stars' }],
  facts: [{ label: 'Forks', value: '2k' }], secondary: { left: 'Python', right: '18k stars' },
  links: [], details: { language: 'Python' }, ...overrides,
});

describe('Library collection', () => {
  it('uses favorite or a non-empty comment as automatic membership', () => {
    expect(isLibraryMember({ favorite: true })).toBe(true);
    expect(isLibraryMember({ comment: 'Read this.' })).toBe(true);
    expect(isLibraryMember({ favorite: false, comment: '  ' })).toBe(false);
    expect(isLibraryMember({ hidden: true })).toBe(false);
  });

  it('creates a bounded immutable card snapshot with validated source fields', () => {
    const source = card({ transient: 'drop me', user: { favorite: true } });
    const snapshot = createLibraryCard(source);

    expect(snapshot).toMatchObject({ id: source.id, title: source.title, url: source.url, type: 'Code' });
    expect(snapshot).not.toHaveProperty('transient');
    expect(snapshot).not.toHaveProperty('user');
    expect(snapshot).not.toBe(source);
    source.tags.push('later');
    expect(snapshot.tags).not.toContain('later');
  });

  it('adds, retains, and removes the durable snapshot according to membership', () => {
    const saved = updateLibraryAnnotation({}, { favorite: true }, card(), new Date('2026-08-29T10:00:00Z'));
    const noted = updateLibraryAnnotation(saved, { favorite: false, comment: 'Compare later.' }, card(), new Date('2026-08-29T11:00:00Z'));
    const removed = updateLibraryAnnotation(noted, { comment: '' }, card(), new Date('2026-08-29T12:00:00Z'));

    expect(saved).toMatchObject({ favorite: true, savedAt: '2026-08-29T10:00:00.000Z', libraryCard: { id: card().id } });
    expect(noted.savedAt).toBe(saved.savedAt);
    expect(noted.libraryCard.id).toBe(card().id);
    expect(removed).not.toHaveProperty('savedAt');
    expect(removed).not.toHaveProperty('libraryCard');
  });

  it('filters and sorts Library cards without hiding annotated hidden items', () => {
    const states = {
      'github:openai/evals': {
        favorite: true, hidden: true, savedAt: '2026-08-27T00:00:00Z', updatedAt: '2026-08-29T00:00:00Z',
        libraryCard: createLibraryCard(card()),
      },
      'hf-model:Qwen/Qwen': {
        comment: 'Run locally.', savedAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T12:00:00Z',
        libraryCard: createLibraryCard(card({
          id: 'hf-model:Qwen/Qwen', source: 'huggingface', section: 'models', type: 'Model',
          title: 'Qwen/Qwen', url: 'https://huggingface.co/Qwen/Qwen',
        })),
      },
      ignored: { hidden: true, updatedAt: '2026-08-29T00:00:00Z' },
    };

    expect(getLibraryCards(states, { view: 'all', type: 'all', source: 'all', sort: 'updated' })
      .map(({ title }) => title)).toEqual(['openai/evals', 'Qwen/Qwen']);
    expect(getLibraryCards(states, { view: 'notes', type: 'all', source: 'all', sort: 'saved' })
      .map(({ title }) => title)).toEqual(['Qwen/Qwen']);
    expect(getLibraryCards(states, { view: 'all', type: 'Model', source: 'huggingface', sort: 'title' })
      .map(({ title }) => title)).toEqual(['Qwen/Qwen']);
  });

  it('backfills qualifying legacy annotations from the newest matching daily snapshot', () => {
    const annotations = {
      'github:openai/evals': { favorite: true, updatedAt: '2026-08-28T10:00:00Z' },
      missing: { comment: 'Unresolved', updatedAt: '2026-08-28T11:00:00Z' },
    };
    const snapshots = {
      '2026-08-27': { sections: { code: { cards: [card({ summary: 'Old' })] } } },
      '2026-08-28': { sections: { today: { cards: [card({ summary: 'Newest' })] } } },
    };

    const migrated = backfillLibraryAnnotations(annotations, snapshots);

    expect(migrated['github:openai/evals'].libraryCard.summary).toBe('Newest');
    expect(migrated['github:openai/evals'].savedAt).toBe('2026-08-28T10:00:00Z');
    expect(migrated.missing.libraryCard).toBeUndefined();
    expect(annotations['github:openai/evals'].libraryCard).toBeUndefined();
  });
});
