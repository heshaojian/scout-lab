import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  normalizeCommunityPaper,
  compactNumber,
  normalizeDataset,
  normalizeModel,
  parseArxivFeed,
  parseGithubTrending,
} from '../src/services/normalizers.js';

const fixture = (name) => readFile(resolve(process.cwd(), 'tests', 'fixtures', name), 'utf8');

describe('source normalizers', () => {
  it('formats small, large, and missing source metrics', () => {
    expect(compactNumber(99)).toBe('99');
    expect(compactNumber(1_200_000)).toBe('1.2m');
    expect(compactNumber(undefined)).toBe('Not specified');
  });

  it('parses GitHub Trending totals and period stars separately', async () => {
    const cards = parseGithubTrending(await fixture('github-trending.html'), 'week');

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      id: 'github:example-labs/agent-kit',
      title: 'example-labs/agent-kit',
      url: 'https://github.com/example-labs/agent-kit',
      metricLabel: 'Stars this week',
      metricValue: '+373',
    });
    expect(cards[0].metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'period-stars', value: 373 }),
      expect.objectContaining({ id: 'total-stars', value: 12345 }),
      expect.objectContaining({ id: 'forks', value: 789 }),
    ]));
  });

  it('normalizes model and dataset source metadata', () => {
    const model = normalizeModel({
      id: 'Qwen/Qwen3.8-Flash-Next',
      pipeline_tag: 'image-text-to-text',
      downloads: 4810,
      likes: 4181,
      trendingScore: 4050,
      gated: false,
      tags: ['transformers', 'license:other'],
      createdAt: '2026-08-24T08:24:59Z',
      lastModified: '2026-08-27T05:03:36Z',
    }, 'trending');
    const dataset = normalizeDataset({
      id: 'markov-ai/cad-1000-hours',
      downloads: 56917,
      likes: 201,
      trendingScore: 157,
      tags: ['task_categories:computer-vision', 'size_categories:1K<n<10K', 'language:en', 'license:apache-2.0'],
      lastModified: '2026-08-21T12:26:29Z',
    }, 'downloads');

    expect(model.metricValue).toBe('4k trending');
    expect(model.details.access).toBe('Open');
    expect(dataset.metricValue).toBe('56.9k downloads');
    expect(dataset.details).toMatchObject({ size: '1K<n<10K', language: 'en', license: 'apache-2.0' });

    expect(normalizeModel({ id: 'owner/new', tags: [], createdAt: '2026-08-28T00:00:00Z' }, 'newest').metricValue)
      .toBe('Created Aug 28');
    expect(normalizeModel({ id: 'owner/liked', tags: [], likes: 12 }, 'likes').metricValue).toBe('12 likes');
    expect(normalizeDataset({ id: 'owner/new-data', tags: [], lastModified: '2026-08-28T00:00:00Z' }, 'newest').details)
      .toMatchObject({ size: 'Not specified', language: 'Not specified', license: 'Not specified' });
  });

  it('normalizes Hugging Face community papers with source-provided summaries', () => {
    const card = normalizeCommunityPaper({
      paper: {
        id: '2608.09888',
        title: 'Latent Reasoning',
        authors: [{ name: 'Ada Researcher' }],
        ai_summary: 'A source-provided summary.',
        ai_keywords: ['reasoning', 'agents'],
        upvotes: 761,
        publishedAt: '2026-08-10T00:00:00Z',
      },
      numComments: 5,
    });

    expect(card.url).toBe('https://huggingface.co/papers/2608.09888');
    expect(card.summaryLabel).toBe('HF summary');
    expect(card.metricValue).toBe('761 upvotes');
    expect(card.secondary.right).toBe('5 comments');

    const plain = normalizeCommunityPaper({
      id: '2608.00001', title: 'Plain summary', summary: 'Human summary.', authors: [], upvotes: 0,
    });
    expect(plain.summaryLabel).toBe('');
    expect(plain.summary).toBe('Human summary.');
  });

  it('parses arXiv Atom links, authors, categories, and dates', async () => {
    const cards = parseArxivFeed(await fixture('arxiv.xml'));

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'arxiv:2608.12345v1',
      owner: 'Ada Researcher, Lin Scientist',
      url: 'https://arxiv.org/abs/2608.12345v1',
      metricValue: 'cs.AI',
    });
    expect(cards[0].links).toEqual(expect.arrayContaining([
      { id: 'pdf', label: 'PDF', url: 'https://arxiv.org/pdf/2608.12345v1' },
    ]));
  });

  it('rejects invalid arXiv XML', () => {
    expect(() => parseArxivFeed('<feed><entry>')).toThrow('invalid XML');
  });
});
