import { describe, expect, it, vi } from 'vitest';

import {
  buildArxivUpstreamUrl, buildDatasetsPageUpstreamUrl, buildTrendingUpstreamUrl, createDevServer,
} from '../scripts/dev-server.mjs';

const withServer = async (fetchImpl, task) => {
  const server = createDevServer({ fetchImpl });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    return await task(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

describe('local GitHub Trending proxy validation', () => {
  it('builds allowlisted Any, English, and Chinese requests', () => {
    expect(buildTrendingUpstreamUrl(new URLSearchParams({ since: 'daily' }))).toBe(
      'https://github.com/trending?since=daily',
    );
    expect(buildTrendingUpstreamUrl(new URLSearchParams({
      since: 'weekly', language: 'python', spoken_language_code: 'en',
    }))).toBe('https://github.com/trending/python?since=weekly&spoken_language_code=en');
    expect(buildTrendingUpstreamUrl(new URLSearchParams({
      since: 'monthly', spoken_language_code: 'zh',
    }))).toBe('https://github.com/trending?since=monthly&spoken_language_code=zh');
  });

  it.each([
    { since: 'yearly' },
    { since: 'daily', language: '../../settings' },
    { since: 'daily', spoken_language_code: 'xx' },
    { since: 'daily', target: 'https://example.com' },
  ])('rejects unsupported proxy parameters: %o', (values) => {
    expect(() => buildTrendingUpstreamUrl(new URLSearchParams(values))).toThrow(/invalid|unsupported/i);
  });

  it('proxies only the validated GitHub Trending URL with safe headers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<article class="Box-row">Trending</article>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));

    await withServer(fetchImpl, async (origin) => {
      const response = await fetch(`${origin}/__scout/github-trending?since=monthly&language=python&spoken_language_code=zh`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(await response.text()).toContain('Box-row');
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://github.com/trending/python?since=monthly&spoken_language_code=zh');
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('rejects arbitrary targets and methods before contacting GitHub', async () => {
    const fetchImpl = vi.fn();

    await withServer(fetchImpl, async (origin) => {
      const invalid = await fetch(`${origin}/__scout/github-trending?since=daily&target=https://example.com`);
      const post = await fetch(`${origin}/__scout/github-trending?since=daily`, { method: 'POST' });
      expect(invalid.status).toBe(400);
      expect(post.status).toBe(405);
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('local arXiv proxy validation', () => {
  const valid = new URLSearchParams({
    search_query: 'cat:cs.AI AND submittedDate:[202608210000 TO 202608282359]',
    start: '0', max_results: '24', sortBy: 'submittedDate', sortOrder: 'descending',
  });

  it('builds only the fixed arXiv API target', () => {
    expect(buildArxivUpstreamUrl(valid)).toContain('https://export.arxiv.org/api/query?');
    expect(() => buildArxivUpstreamUrl(new URLSearchParams({ ...Object.fromEntries(valid), target: 'https://example.com' })))
      .toThrow(/unsupported/i);
  });

  it('proxies validated Atom XML and rejects mutation methods', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<feed xmlns="http://www.w3.org/2005/Atom"></feed>', { status: 200 }));
    await withServer(fetchImpl, async (origin) => {
      const response = await fetch(`${origin}/__scout/arxiv?${valid}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/atom+xml');
      expect(await response.text()).toContain('<feed');
      expect((await fetch(`${origin}/__scout/arxiv?${valid}`, { method: 'POST' })).status).toBe(405);
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });
});

describe('local Hugging Face datasets page proxy validation', () => {
  it('builds only allowlisted row-sort and facet requests', () => {
    const upstream = new URL(buildDatasetsPageUpstreamUrl(new URLSearchParams({
      sort: 'most_rows', modality: 'modality:image', format: 'format:parquet',
      task_categories: 'task_categories:text-retrieval',
    })));
    expect(upstream.origin + upstream.pathname).toBe('https://huggingface.co/datasets');
    expect(upstream.searchParams.get('sort')).toBe('most_rows');
    expect(() => buildDatasetsPageUpstreamUrl(new URLSearchParams({ sort: 'trending' }))).toThrow(/sort/i);
    expect(() => buildDatasetsPageUpstreamUrl(new URLSearchParams({ sort: 'most_rows', target: 'https://example.com' })))
      .toThrow(/unsupported/i);
  });

  it('proxies GET with safe headers and rejects mutation methods', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<div data-target="DatasetList"></div>', { status: 200 }));
    await withServer(fetchImpl, async (origin) => {
      const url = `${origin}/__scout/hf-datasets?sort=least_rows&modality=modality%3Atext`;
      expect((await fetch(url)).status).toBe(200);
      expect((await fetch(url, { method: 'POST' })).status).toBe(405);
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toContain('https://huggingface.co/datasets?');
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });
});
