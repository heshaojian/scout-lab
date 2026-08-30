import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DESCRIPTION_REVISION,
  enrichCardDescriptions,
  extractGithubReadmeExcerpt,
  extractMarkdownExcerpt,
} from '../src/services/descriptions.js';

const response = (body, ok = true) => ({ ok, text: async () => body });

beforeEach(() => {
  localStorage.clear();
});

describe('source description enrichment', () => {
  it('extracts the first useful model-card paragraph as safe plain text', () => {
    const markdown = `---
license: apache-2.0
pipeline_tag: text-generation
---

[![Build](https://img.shields.io/badge/build-passing.svg)](https://example.com)

# Example Model

![Logo](logo.png)

Example Model is a **small reasoning model** for [tool-using agents](https://example.com/agents)
with reliable structured output.

## Installation

\`\`\`bash
pip install example
\`\`\`
`;

    expect(extractMarkdownExcerpt(markdown)).toBe(
      'Example Model is a small reasoning model for tool-using agents with reliable structured output.',
    );
  });

  it('extracts a useful paragraph from the rendered GitHub README region only', () => {
    const html = `
      <main><p>Repository navigation should not be used.</p></main>
      <article class="markdown-body">
        <p><a href="badge"><img src="badge.svg" alt="Build"></a></p>
        <h1>Virtual Phone</h1>
        <p>Boot a virtual iPhone for reproducible mobile research.</p>
        <h2>Installation</h2><p>Run npm install.</p>
      </article>
    `;

    expect(extractGithubReadmeExcerpt(html)).toBe(
      'Boot a virtual iPhone for reproducible mobile research.',
    );
  });

  it('keeps a source description without requesting a README or mutating the card', async () => {
    const card = {
      id: 'github:owner/repo', source: 'github', section: 'code', title: 'owner/repo',
      summary: 'Exact GitHub Trending description.', details: { descriptionSource: 'source' },
    };
    const fetcher = vi.fn();

    const enriched = await enrichCardDescriptions([card], { fetcher });

    expect(enriched).toEqual([card]);
    expect(enriched[0]).not.toBe(card);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses and caches a Hugging Face README excerpt by model ID', async () => {
    const card = {
      id: 'hf-model:owner/model', source: 'huggingface', section: 'models', title: 'owner/model',
      summary: 'Text generation · 7B parameters · Transformers · Open.',
      details: { descriptionSource: 'fallback' },
    };
    const fetcher = vi.fn(async () => response(`---\nlicense: mit\n---\n\n# Model\n\nA compact model for reliable agent planning and tool use.`));

    const first = await enrichCardDescriptions([card], { fetcher });
    const second = await enrichCardDescriptions([card], { fetcher });

    expect(DESCRIPTION_REVISION).toBe('source-descriptions-v1');
    expect(first[0]).toMatchObject({
      summary: 'A compact model for reliable agent planning and tool use.',
      details: { descriptionSource: 'readme' },
    });
    expect(second[0].summary).toBe(first[0].summary);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('https://huggingface.co/owner/model/raw/main/README.md');
  });

  it('keeps the factual summary when README retrieval fails or has no useful prose', async () => {
    const cards = [{
      id: 'hf-model:owner/missing', source: 'huggingface', section: 'models', title: 'owner/missing',
      summary: 'Image to text · parameters not specified · Open.',
      details: { descriptionSource: 'fallback' },
    }, {
      id: 'github:owner/empty', source: 'github', section: 'code', title: 'owner/empty',
      summary: 'Python repository · 10 stars · 2 forks.',
      details: { descriptionSource: 'fallback' },
    }];
    const fetcher = vi.fn(async (url) => (
      url.includes('huggingface.co') ? response('not found', false) : response('<article class="markdown-body"><h1>Only a heading</h1></article>')
    ));

    const enriched = await enrichCardDescriptions(cards, { fetcher });

    expect(enriched.map(({ summary }) => summary)).toEqual(cards.map(({ summary }) => summary));
    expect(enriched.every(({ details }) => details.descriptionSource === 'fallback')).toBe(true);
  });

  it('rejects unsafe external repository IDs before constructing a README URL', async () => {
    const card = {
      id: 'hf-model:../settings', source: 'huggingface', section: 'models', title: '../settings',
      summary: 'Factual model metadata.', details: { descriptionSource: 'fallback' },
    };
    const fetcher = vi.fn();

    const enriched = await enrichCardDescriptions([card], { fetcher });

    expect(enriched[0].summary).toBe(card.summary);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('limits excerpts without breaking words and strips executable or visual Markdown', () => {
    const prose = `${'carefully documented model behavior '.repeat(20)}finished`;
    const excerpt = extractMarkdownExcerpt(`<script>alert(1)</script>\n\n${prose}`);

    expect(excerpt.length).toBeLessThanOrEqual(420);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt).not.toContain('<script>');
    expect(excerpt).not.toContain('alert');
  });
});
