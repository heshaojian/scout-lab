import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { composeTodayCards, fetchSection } from '../src/services/feeds.js';
import { setCache } from '../src/services/storage.js';
import { createDefaultFilters } from '../src/workbenches.js';

const trendingHtml = await readFile(resolve(process.cwd(), 'tests', 'fixtures', 'github-trending.html'), 'utf8');
const arxivXml = await readFile(resolve(process.cwd(), 'tests', 'fixtures', 'arxiv.xml'), 'utf8');

const response = (body, { status = 200, type = 'application/json' } = {}) => new Response(
  type === 'application/json' ? JSON.stringify(body) : body,
  { status, headers: { 'content-type': type } },
);

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('feed integration', () => {
  it('loads and caches parseable GitHub Trending cards', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(trendingHtml, { type: 'text/html' }));
    vi.stubGlobal('fetch', fetchMock);
    const filters = createDefaultFilters().code;

    const first = await fetchSection('code', filters, { force: true });
    const second = await fetchSection('code', filters);

    expect(first.cards).toHaveLength(2);
    expect(first.status.label).toBe('GitHub Trending');
    expect(second.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to official GitHub search without period stars when Trending parsing fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('<html><body>changed</body></html>', { type: 'text/html' }))
      .mockResolvedValueOnce(response({
        items: [{
          full_name: 'openai/evals',
          html_url: 'https://github.com/openai/evals',
          description: 'Evaluation framework',
          language: 'Python',
          topics: ['evaluation'],
          stargazers_count: 18000,
          forks_count: 2700,
          owner: { login: 'openai' },
          created_at: '2023-01-01T00:00:00Z',
          pushed_at: '2026-08-27T00:00:00Z',
        }],
      }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSection('code', createDefaultFilters().code, { force: true });

    expect(result.cards[0].metricLabel).toBe('Total stars');
    expect(result.cards[0].metrics.some((metric) => metric.id === 'period-stars')).toBe(false);
    expect(result.status).toMatchObject({ stale: true, label: 'GitHub search fallback' });
  });

  it('returns a trusted GitHub discovery card when Trending and Search are empty', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(response({ total_count: 0, items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSection('code', createDefaultFilters().code, { force: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      id: 'fallback:code:agents',
      source: 'github',
      url: 'https://github.com/topics/agents',
    });
    expect(result.status).toMatchObject({ label: 'Code fallback', stale: true });
    expect(result.status.message).toContain('no repositories');
  });

  it('returns a trusted GitHub discovery card for malformed Search data', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response('<html><body>changed</body></html>', { type: 'text/html' }))
      .mockResolvedValueOnce(response({ unexpected: true })));

    const result = await fetchSection(
      'code',
      createDefaultFilters().code,
      { force: true },
    );

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].id).toBe('fallback:code:agents');
    expect(result.status.message).toContain('unexpected response');
  });

  it('does not reuse a cached empty Code result', async () => {
    const filters = createDefaultFilters().code;
    setCache(
      { section: 'code', filters },
      [],
      60_000,
      { status: { label: 'Old empty result', stale: true } },
    );
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(response({
        total_count: 1,
        items: [{
          full_name: 'openai/evals',
          html_url: 'https://github.com/openai/evals',
          description: 'Evaluation framework',
          language: 'Python',
          topics: ['evaluation'],
          stargazers_count: 18_000,
          forks_count: 2_700,
          owner: { login: 'openai' },
          created_at: '2026-08-20T00:00:00Z',
          pushed_at: '2026-08-28T00:00:00Z',
        }],
      }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSection('code', filters);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.cached).toBe(false);
    expect(result.cards[0].title).toBe('openai/evals');
  });

  it('deduplicates simultaneous matching source requests', async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    const fetchMock = vi.fn(async () => {
      await pending;
      return response([{ id: 'owner/model', downloads: 10, likes: 2, tags: [] }]);
    });
    vi.stubGlobal('fetch', fetchMock);
    const filters = createDefaultFilters().models;

    const first = fetchSection('models', filters, { force: true });
    const second = fetchSection('models', filters, { force: true });
    release();
    const results = await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results[0].cards).toEqual(results[1].cards);
  });

  it('loads model, dataset, community paper, and arXiv workbenches', async () => {
    const fetchMock = vi.fn(async (url) => {
      const value = `${url}`;
      if (value.includes('/api/models')) return response([{ id: 'owner/model', downloads: 10, likes: 2, trendingScore: 3, tags: [] }]);
      if (value.includes('/api/datasets')) return response([{ id: 'owner/dataset', downloads: 20, likes: 4, trendingScore: 5, tags: [] }]);
      if (value.includes('/api/daily_papers')) return response([{ paper: { id: '2608.10000', title: 'Paper', summary: 'Summary', upvotes: 6, authors: [] }, numComments: 1 }]);
      if (value.includes('export.arxiv.org')) return response(arxivXml, { type: 'application/atom+xml' });
      throw new Error(`Unexpected URL: ${value}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const filters = createDefaultFilters();

    const model = await fetchSection('models', filters.models, { force: true });
    const dataset = await fetchSection('datasets', filters.datasets, { force: true });
    const community = await fetchSection('papers', filters.papers, { force: true });
    const arxiv = await fetchSection('papers', { ...filters.papers, source: 'arxiv', sort: 'newest' }, { force: true });

    expect(model.cards[0].type).toBe('Model');
    expect(dataset.cards[0].type).toBe('Dataset');
    expect(community.cards[0]).toMatchObject({ type: 'Paper', source: 'huggingface' });
    expect(arxiv.cards[0]).toMatchObject({ type: 'Paper', source: 'arxiv' });
  });

  it('serves the curated learning catalog without a network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const filters = { ...createDefaultFilters().learn, focus: 'agents', format: 'course', progress: 'in-progress' };
    const result = await fetchSection('learn', filters, {
      force: true,
      learnProgress: { 'learn:hf-agents-course': { status: 'in-progress' } },
    });

    expect(result.cards.map((card) => card.id)).toEqual(['learn:hf-agents-course']);
    expect(result.status.label).toBe('Curated learning catalog');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses an expired matching cache when a source request fails', async () => {
    const filters = createDefaultFilters().models;
    const query = { section: 'models', filters };
    setCache(query, [{ id: 'saved:model', type: 'Model' }], -1, { status: { label: 'Saved models', stale: false } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchSection('models', filters, { force: true });

    expect(result.cards).toEqual([{ id: 'saved:model', type: 'Model' }]);
    expect(result.status).toMatchObject({ label: 'Saved models', stale: true });
    expect(result.error).toBe('offline');
  });

  it('shows a safe source fallback when no cache exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchSection('datasets', createDefaultFilters().datasets, { force: true });

    expect(result.cards[0].url).toBe('https://huggingface.co/datasets');
    expect(result.status).toMatchObject({ label: 'Datasets fallback', stale: true });
  });

  it('keeps a valid empty filtered result distinct from a source failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])));

    const result = await fetchSection('datasets', createDefaultFilters().datasets, { force: true });

    expect(result.cards).toEqual([]);
    expect(result.status).toEqual({ label: 'Hugging Face datasets', stale: false });
  });

  it('assembles Today from all six source lanes despite different response shapes', async () => {
    const fetchMock = vi.fn(async (url) => {
      const value = `${url}`;
      if (value.includes('github.com/trending')) return response(trendingHtml, { type: 'text/html' });
      if (value.includes('/api/models')) return response([{ id: 'owner/model', downloads: 10, likes: 2, trendingScore: 3, tags: [] }]);
      if (value.includes('/api/datasets')) return response([{ id: 'owner/dataset', downloads: 20, likes: 4, trendingScore: 5, tags: [] }]);
      if (value.includes('/api/daily_papers')) return response([{ paper: { id: '2608.10000', title: 'Paper', summary: 'Summary', upvotes: 6, authors: [] }, numComments: 1 }]);
      if (value.includes('export.arxiv.org')) return response(arxivXml, { type: 'application/atom+xml' });
      throw new Error(`Unexpected URL: ${value}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const filters = createDefaultFilters();

    const result = await fetchSection('today', filters.today, {
      force: true,
      allFilters: filters,
      learnProgress: {},
    });

    expect(result.cards).toHaveLength(7);
    expect(result.cards.map((card) => card.type)).toEqual(['Code', 'Code', 'Model', 'Dataset', 'Paper', 'Paper', 'Learn']);
    expect(result.status).toMatchObject({ label: 'All sources live', stale: false });
  });

  it('composes custom Today lanes, alternates papers, and replaces hidden cards', () => {
    const card = (id, type) => ({ id, type });
    const result = composeTodayCards({
      code: [card('code:one', 'Code'), card('code:two', 'Code'), card('code:three', 'Code')],
      models: [card('model:one', 'Model')],
      datasets: [card('dataset:one', 'Dataset')],
      community: [card('paper:community-one', 'Paper'), card('paper:community-two', 'Paper')],
      arxiv: [card('paper:arxiv-one', 'Paper'), card('paper:arxiv-two', 'Paper')],
      learn: [card('learn:one', 'Learn')],
    }, {
      code: 2,
      models: 0,
      datasets: 0,
      papers: 4,
      learn: 1,
    }, {
      'code:one': { hidden: true },
    });

    expect(result.cards.map(({ id }) => id)).toEqual([
      'code:two',
      'code:three',
      'paper:community-one',
      'paper:arxiv-one',
      'paper:community-two',
      'paper:arxiv-two',
      'learn:one',
    ]);
    expect(result.shortfalls).toEqual({});
  });

  it('reports Today source shortfalls instead of silently substituting another lane', () => {
    const result = composeTodayCards({
      code: [{ id: 'code:one' }],
      models: [],
      datasets: [],
      community: [],
      arxiv: [],
      learn: [],
    }, { code: 2, models: 1, datasets: 0, papers: 0, learn: 0 }, {});

    expect(result.cards.map(({ id }) => id)).toEqual(['code:one']);
    expect(result.shortfalls).toEqual({ code: 1, models: 1 });
  });
});
