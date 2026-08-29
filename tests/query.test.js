import { describe, expect, it } from 'vitest';

import { createDefaultFilters, normalizeWorkbenchFilters } from '../src/workbenches.js';
import {
  buildArxivUrl,
  buildCommunityPapersUrl,
  buildDatasetsUrl,
  buildGithubRequest,
  buildModelsUrl,
  matchesTopic,
  resolveGithubRequestUrl,
  stableSerialize,
  validateSourceUrl,
} from '../src/services/query.js';

const now = new Date('2026-08-28T12:00:00.000Z');

describe('workbench query builders', () => {
  it('creates independent defaults for every workbench', () => {
    const first = createDefaultFilters();
    const second = createDefaultFilters();

    first.code.language = 'python';

    expect(second.code.language).toBe('all');
    expect(second.code).toEqual({ time: 'week', spokenLanguage: 'all', language: 'all', topic: 'all' });
    expect(Object.keys(second)).toEqual(['today', 'code', 'models', 'datasets', 'papers', 'learn']);
  });

  it('drops legacy Code modes while preserving supported filters', () => {
    expect(normalizeWorkbenchFilters('code', {
      mode: 'active',
      time: 'month',
      language: 'python',
      topic: 'agents',
    })).toEqual({ time: 'month', spokenLanguage: 'all', language: 'python', topic: 'agents' });

    expect(normalizeWorkbenchFilters('code', {
      spokenLanguage: 'unsupported',
      time: 'day',
    })).toEqual({ time: 'day', spokenLanguage: 'all', language: 'all', topic: 'all' });
  });

  it('serializes query state with stable key ordering', () => {
    expect(stableSerialize({ b: 2, a: { d: 4, c: 3 } }))
      .toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(stableSerialize({ values: [{ z: 1, a: 2 }] })).toBe('{"values":[{"a":2,"z":1}]}');
  });

  it('builds exact GitHub Trending URLs for Any, English, and Chinese', () => {
    const english = buildGithubRequest({
      time: 'week',
      spokenLanguage: 'en',
      language: 'python',
      topic: 'agents',
    }, now);
    const chinese = buildGithubRequest({
      time: 'month',
      spokenLanguage: 'zh',
      language: 'all',
      topic: 'all',
    }, now);
    const any = buildGithubRequest({
      time: 'day',
      spokenLanguage: 'all',
      language: 'all',
      topic: 'all',
    }, now);

    expect(english).toEqual(expect.objectContaining({
      kind: 'trending',
      url: 'https://github.com/trending/python?since=weekly&spoken_language_code=en',
    }));
    expect(chinese.url).toBe('https://github.com/trending?since=monthly&spoken_language_code=zh');
    expect(any.url).toBe('https://github.com/trending?since=daily');
    expect(english).not.toHaveProperty('fallbackUrl');

    const preview = new URL(english.previewUrl, 'http://127.0.0.1:5179');
    expect(preview.pathname).toBe('/__scout/github-trending');
    expect(preview.searchParams.get('since')).toBe('weekly');
    expect(preview.searchParams.get('language')).toBe('python');
    expect(preview.searchParams.get('spoken_language_code')).toBe('en');
  });

  it('uses the local proxy only for loopback HTTP previews', () => {
    const request = buildGithubRequest({
      time: 'week', spokenLanguage: 'zh', language: 'all', topic: 'all',
    }, now);

    expect(resolveGithubRequestUrl(request, { protocol: 'http:', hostname: '127.0.0.1' })).toBe(request.previewUrl);
    expect(resolveGithubRequestUrl(request, { protocol: 'https:', hostname: 'localhost' })).toBe(request.previewUrl);
    expect(resolveGithubRequestUrl(request, { protocol: 'chrome-extension:', hostname: 'extension-id' })).toBe(request.url);
    expect(resolveGithubRequestUrl(request, { protocol: 'https:', hostname: 'example.com' })).toBe(request.url);
  });

  it('maps every Hugging Face model sort to the source field and direction', () => {
    const expected = [
      ['trending', 'trendingScore', '-1'],
      ['likes', 'likes', '-1'],
      ['downloads', 'downloads', '-1'],
      ['created', 'createdAt', '-1'],
      ['updated', 'lastModified', '-1'],
      ['most-parameters', 'num_parameters', '-1'],
      ['least-parameters', 'num_parameters', '1'],
    ];

    expect(expected.map(([rank, sort, direction]) => {
      const url = new URL(buildModelsUrl({
        rank, task: 'all', size: 'any', baseOnly: 'off', inference: 'off',
        library: 'all', license: 'all', access: 'all', app: 'all', updated: 'all',
      }));
      return [url.searchParams.get('sort'), url.searchParams.get('direction')];
    })).toEqual(expected.map(([, sort, direction]) => [sort, direction]));
  });

  it('maps Hugging Face discovery and runtime filters to supported parameters', () => {
    const url = new URL(buildModelsUrl({
      rank: 'trending',
      task: 'text-generation',
      size: '1b-7b',
      baseOnly: 'on',
      inference: 'on',
      library: 'transformers',
      license: 'apache-2.0',
      access: 'open',
      app: 'ollama',
      updated: 'week',
    }));

    expect(url.searchParams.get('sort')).toBe('trendingScore');
    expect(url.searchParams.get('pipeline_tag')).toBe('text-generation');
    expect(url.searchParams.get('num_parameters')).toBe('min:1B,max:7B');
    expect(url.searchParams.get('base_model_relation')).toBe('base');
    expect(url.searchParams.get('inference_provider')).toBe('all');
    expect(url.searchParams.getAll('filter')).toEqual(['transformers', 'license:apache-2.0']);
    expect(url.searchParams.get('gated')).toBe('false');
    expect(url.searchParams.get('apps')).toBe('ollama');
    expect(url.searchParams.has('updated')).toBe(false);
    expect(url.searchParams.getAll('expand[]')).toEqual(expect.arrayContaining([
      'safetensors', 'gguf', 'inferenceProviderMapping', 'createdAt', 'lastModified',
    ]));

    const minimal = new URL(buildModelsUrl({
      rank: 'created', task: 'all', size: '30b-plus', baseOnly: 'off', inference: 'off',
      library: 'all', license: 'all', access: 'gated', app: 'all', updated: 'all',
    }));
    expect(minimal.searchParams.get('sort')).toBe('createdAt');
    expect(minimal.searchParams.get('pipeline_tag')).toBeNull();
    expect(minimal.searchParams.get('num_parameters')).toBe('min:30B');
    expect(minimal.searchParams.get('gated')).toBe('true');
    expect(minimal.searchParams.get('base_model_relation')).toBeNull();
    expect(minimal.searchParams.get('inference_provider')).toBeNull();
    expect(minimal.searchParams.getAll('filter')).toEqual([]);
    expect(minimal.searchParams.get('apps')).toBeNull();
  });

  it('maps dataset rank, task, size, and extra filters', () => {
    const url = new URL(buildDatasetsUrl({
      rank: 'downloads',
      task: 'retrieval',
      size: '10k-1m',
      extra: 'official',
    }));

    expect(url.searchParams.get('sort')).toBe('downloads');
    expect(url.searchParams.getAll('filter')).toEqual([
      'task_categories:retrieval',
      'size_categories:10K<n<1M',
      'benchmark:official',
    ]);

    const language = new URL(buildDatasetsUrl({ rank: 'newest', task: 'all', size: 'under-10k', extra: 'language-en' }));
    const license = new URL(buildDatasetsUrl({ rank: 'likes', task: 'all', size: 'any', extra: 'license-apache-2.0' }));
    expect(language.searchParams.getAll('filter')).toEqual(['size_categories:n<10K', 'language:en']);
    expect(license.searchParams.get('filter')).toBe('license:apache-2.0');
  });

  it('builds community and raw paper time ranges', () => {
    const community = new URL(buildCommunityPapersUrl({ time: 'week', sort: 'trending' }, now));
    const arxiv = new URL(buildArxivUrl({
      time: 'month',
      category: 'cs.LG',
      topic: 'evaluation',
      sort: 'newest',
    }, now)).searchParams.get('search_query');

    expect(community.searchParams.get('week')).toBe('2026-W35');
    expect(community.searchParams.get('sort')).toBe('trending');
    expect(arxiv).toContain('cat:cs.LG');
    expect(arxiv).toContain('submittedDate:[202607290000 TO 202608282359]');
    expect(arxiv).toContain('all:evaluation');

    const daily = new URL(buildCommunityPapersUrl({ time: 'day', sort: 'recent' }, now));
    const monthly = new URL(buildCommunityPapersUrl({ time: 'month', sort: 'trending' }, now));
    expect(daily.searchParams.get('date')).toBe('2026-08-28');
    expect(daily.searchParams.get('sort')).toBe('publishedAt');
    expect(monthly.searchParams.get('month')).toBe('2026-08');
  });

  it('matches source cards using the selected topic vocabulary', () => {
    const card = { title: 'Agent evaluation', summary: 'Tool workflow benchmark', tags: ['agents'] };
    expect(matchesTopic(card, 'all')).toBe(true);
    expect(matchesTopic(card, 'agents')).toBe(true);
    expect(matchesTopic(card, 'rag')).toBe(false);
  });
});

describe('source URL validation', () => {
  it('accepts expected HTTPS source links', () => {
    expect(validateSourceUrl('https://github.com/openai/evals', 'github')).toBe('https://github.com/openai/evals');
    expect(validateSourceUrl('https://huggingface.co/openai/gpt-oss-20b', 'huggingface')).toBe('https://huggingface.co/openai/gpt-oss-20b');
    expect(validateSourceUrl('https://arxiv.org/abs/2608.12345', 'arxiv')).toBe('https://arxiv.org/abs/2608.12345');
    expect(validateSourceUrl('https://developers.google.com/machine-learning/crash-course', 'learn')).toContain('developers.google.com');
  });

  it('rejects scripts, HTTP, credentials, and unexpected hosts', () => {
    expect(validateSourceUrl('javascript:alert(1)', 'github')).toBe('');
    expect(validateSourceUrl('http://github.com/openai/evals', 'github')).toBe('');
    expect(validateSourceUrl('https://user:pass@github.com/openai/evals', 'github')).toBe('');
    expect(validateSourceUrl('https://github.example.com/openai/evals', 'github')).toBe('');
    expect(validateSourceUrl('not a URL', 'github')).toBe('');
    expect(validateSourceUrl('https://github.com/openai/evals', 'unknown')).toBe('');
  });
});
