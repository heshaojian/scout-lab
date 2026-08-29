import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCache,
  getLearnProgress,
  getDailyNote,
  getSnapshot,
  getSettings,
  getUserState,
  getWorkbenchFilters,
  removeCache,
  setCache,
  setLearnProgress,
  setDailyNote,
  setSnapshot,
  setUserItemState,
  setWorkbenchFilters,
} from '../src/services/storage.js';

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('query-aware storage', () => {
  it('migrates the legacy topic into every topic-aware workbench', () => {
    localStorage.setItem('scout-lab:settings', JSON.stringify({
      selectedSection: 'models',
      selectedTopic: 'rag',
    }));

    const settings = getSettings();

    expect(settings.selectedSection).toBe('models');
    expect(settings.filters.code.topic).toBe('rag');
    expect(settings.filters.models.topic).toBe('rag');
    expect(settings.filters.papers.topic).toBe('rag');
  });

  it('updates one workbench immutably without erasing other filters', () => {
    const before = getWorkbenchFilters('code');
    const after = setWorkbenchFilters('code', { language: 'python' });

    expect(before.language).toBe('all');
    expect(after.language).toBe('python');
    expect(getWorkbenchFilters('models').rank).toBe('trending');
  });

  it('stores cache entries by the complete query and expires them', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'));
    const query = { section: 'models', filters: { rank: 'trending', task: 'all' } };

    setCache(query, [{ id: 'one' }], 1000, { notice: 'Live' });
    expect(getCache(query)).toEqual(expect.objectContaining({ cards: [{ id: 'one' }], notice: 'Live' }));

    vi.advanceTimersByTime(1001);
    expect(getCache(query)).toBeNull();
  });

  it('removes only the matching cache entry', () => {
    const first = { section: 'models', filters: { rank: 'trending' } };
    const second = { section: 'models', filters: { rank: 'downloads' } };
    setCache(first, [{ id: 'one' }]);
    setCache(second, [{ id: 'two' }]);

    removeCache(first);

    expect(getCache(first)).toBeNull();
    expect(getCache(second)?.cards).toEqual([{ id: 'two' }]);
  });

  it('stores learning progress separately from generic item state', () => {
    setLearnProgress('learn:hf-agents-course', 'in-progress');

    expect(getLearnProgress()).toEqual(expect.objectContaining({
      'learn:hf-agents-course': expect.objectContaining({ status: 'in-progress' }),
    }));
  });

  it('preserves daily notes, snapshots, and immutable item annotations', () => {
    setDailyNote('2026-08-28', 'A note');
    setSnapshot('2026-08-28', { sections: { today: { cards: [] } } });
    const first = setUserItemState('item:1', { favorite: true });
    const second = setUserItemState('item:1', { comment: 'Read this.' });

    expect(getDailyNote('2026-08-28')).toBe('A note');
    expect(getSnapshot('2026-08-28').sections.today.cards).toEqual([]);
    expect(first['item:1'].comment).toBeUndefined();
    expect(second['item:1']).toMatchObject({ favorite: true, comment: 'Read this.' });
    expect(getUserState()).toEqual(second);
  });

  it('recovers from malformed stored JSON', () => {
    localStorage.setItem('scout-lab:settings', '{bad json');
    expect(getSettings().selectedSection).toBe('today');
  });
});
