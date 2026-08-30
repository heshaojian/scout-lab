import { describe, expect, it } from 'vitest';

import { buildDailyArchive } from '../src/services/archiveFormat.js';

describe('daily archive formatter', () => {
  it('includes the briefing, annotations, filters, progress, and source status', () => {
    const markdown = buildDailyArchive({
      date: '2026-08-28',
      note: 'Compare weak-to-strong evaluation methods.',
      todayCards: [{
        id: 'github:openai/evals',
        type: 'Code',
        title: 'openai/evals',
        url: 'https://github.com/openai/evals',
        summary: 'Evaluation framework.',
        metrics: [{ label: 'Total stars', value: 18000, meaning: 'Cumulative GitHub stars' }],
      }],
      allCards: [{ id: 'github:openai/evals', type: 'Code', title: 'openai/evals', url: 'https://github.com/openai/evals', summary: 'Evaluation framework.' }],
      userState: { 'github:openai/evals': { favorite: true, comment: 'Run one eval.' } },
      filters: { code: { time: 'week', language: 'python', topic: 'evaluation' } },
      sourceStatus: { code: { label: 'GitHub Trending', stale: false } },
    });

    expect(markdown).toContain('# Scout Lab - 2026-08-28');
    expect(markdown).toContain('## Today by Source');
    expect(markdown).toContain('Total stars: 18000 (Cumulative GitHub stars)');
    expect(markdown).toContain('Run one eval.');
    expect(markdown).toContain('language: python');
    expect(markdown).toContain('GitHub Trending');
  });

  it('writes explicit empty states when the day has no activity', () => {
    const markdown = buildDailyArchive({ date: '2026-08-28' });

    expect(markdown).toContain('No briefing items available.');
    expect(markdown).toContain('No favorites yet.');
    expect(markdown).toContain('No hidden items.');
    expect(markdown).toContain('No comments yet.');
    expect(markdown).toContain('No source status recorded.');
  });
});
