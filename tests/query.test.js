import { describe, expect, it } from 'vitest';

import { createDefaultFilters } from '../src/workbenches.js';
import {
  buildArxivUrl,
  buildCommunityPapersUrl,
  buildDatasetsUrl,
  buildGithubRequest,
  buildModelsUrl,
  matchesTopic,
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
    expect(Object.keys(second)).toEqual(['today', 'code', 'models', 'datasets', 'papers', 'learn']);
  });

  it('serializes query state with stable key ordering', () => {
    expect(stableSerialize({ b: 2, a: { d: 4, c: 3 } }))
      .toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(stableSerialize({ values: [{ z: 1, a: 2 }] })).toBe('{"values":[{"a":2,"z":1}]}');
  });

  it('builds GitHub Trending and official search requests honestly', () => {
    const trending = buildGithubRequest({
      mode: 'trending',
      time: 'week',
      language: 'python',
      topic: 'agents',
    }, now);
    const rising = buildGithubRequest({
      mode: 'rising',
      time: 'week',
      language: 'typescript',
      topic: 'rag',
    }, now);

    expect(trending.kind).toBe('trending');
    expect(trending.url).toBe('https://github.com/trending/python?since=weekly');
    expect(rising.kind).toBe('search');
    expect(decodeURIComponent(new URL(rising.url).searchParams.get('q'))).toContain('created:>=2026-08-21');
    expect(decodeURIComponent(new URL(rising.url).searchParams.get('q'))).toContain('language:TypeScript');
    expect(new URL(rising.url).searchParams.get('sort')).toBe('stars');

    const active = new URL(buildGithubRequest({
      mode: 'active', time: 'day', language: 'all', topic: 'all',
    }, now).url);
    expect(decodeURIComponent(active.searchParams.get('q'))).toContain('pushed:>=2026-08-27');
    expect(active.searchParams.get('sort')).toBe('updated');
  });

  it('maps Hugging Face model controls to supported parameters', () => {
    const url = new URL(buildModelsUrl({
      rank: 'trending',
      task: 'text-generation',
      size: '1b-7b',
      access: 'open',
    }));

    expect(url.searchParams.get('sort')).toBe('trendingScore');
    expect(url.searchParams.get('pipeline_tag')).toBe('text-generation');
    expect(url.searchParams.get('num_parameters')).toBe('min:1B,max:7B');
    expect(url.searchParams.get('gated')).toBe('false');

    const newest = new URL(buildModelsUrl({ rank: 'newest', task: 'all', size: '30b-plus', access: 'gated' }));
    expect(newest.searchParams.get('sort')).toBe('createdAt');
    expect(newest.searchParams.get('pipeline_tag')).toBeNull();
    expect(newest.searchParams.get('num_parameters')).toBe('min:30B');
    expect(newest.searchParams.get('gated')).toBe('true');
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
