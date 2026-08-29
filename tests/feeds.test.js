import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { fetchSection } from '../src/services/feeds.js';
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
});
