import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

import { createDevServer } from './dev-server.mjs';

const root = process.cwd();
const githubHtml = Array.from({ length: 9 }, (_, index) => `
  <article class="Box-row">
    <h2><a href="/scout-labs/${['agent-workbench', 'model-router', 'eval-studio', 'rag-index', 'vision-kit', 'prompt-check', 'inference-box', 'data-canvas', 'paper-tools'][index]}">scout-labs / ${['agent-workbench', 'model-router', 'eval-studio', 'rag-index', 'vision-kit', 'prompt-check', 'inference-box', 'data-canvas', 'paper-tools'][index]}</a></h2>
    <p class="col-9 color-fg-muted my-1 pr-4">${['Reliable building blocks for production AI agents.', 'Route requests across local and hosted language models.', 'Evaluation workflows for language-model applications.', 'A practical retrieval and indexing toolkit.', 'Multimodal utilities for image and text models.', 'Test and compare prompts with reproducible cases.', 'Run efficient model inference on developer hardware.', 'Inspect and validate machine-learning datasets.', 'Connect research papers with working implementations.'][index]}</p>
    <span itemprop="programmingLanguage">${['Python', 'TypeScript', 'Python', 'Rust', 'Python', 'TypeScript', 'Go', 'Python', 'Rust'][index]}</span>
    <a href="/scout-labs/${['agent-workbench', 'model-router', 'eval-studio', 'rag-index', 'vision-kit', 'prompt-check', 'inference-box', 'data-canvas', 'paper-tools'][index]}/stargazers">${(14320 - index * 713).toLocaleString('en-US')}</a>
    <a href="/scout-labs/${['agent-workbench', 'model-router', 'eval-studio', 'rag-index', 'vision-kit', 'prompt-check', 'inference-box', 'data-canvas', 'paper-tools'][index]}/forks">${930 - index * 47}</a>
    <span class="d-inline-block float-sm-right">${940 - index * 63} stars this week</span>
  </article>`).join('');

const models = Array.from({ length: 10 }, (_, index) => ({
  id: `${['open-lab', 'signal-ai', 'vector-team', 'reasoning-lab', 'vision-stack'][index % 5]}/${['Scout-8B', 'Compass-14B', 'Atlas-7B', 'Beacon-32B', 'Field-Vision'][index % 5]}${index > 4 ? '-GGUF' : ''}`,
  pipeline_tag: index % 4 === 3 ? 'image-text-to-text' : 'text-generation',
  tags: [index > 4 ? 'gguf' : 'transformers', `license:${index % 2 ? 'mit' : 'apache-2.0'}`],
  downloads: 284000 - index * 17300,
  likes: 4200 - index * 260,
  trendingScore: 95 - index * 4,
  gated: false,
  safetensors: { total: (7 + index * 2) * 1_000_000_000 },
  inferenceProviderMapping: index % 3 ? [{ provider: 'together', status: 'live' }] : [],
  createdAt: `2026-08-${String(20 - index).padStart(2, '0')}T00:00:00Z`,
  lastModified: `2026-08-${String(29 - index).padStart(2, '0')}T00:00:00Z`,
}));

const datasets = Array.from({ length: 8 }, (_, index) => ({
  id: `scout-data/${['agent-traces', 'multimodal-evals', 'reasoning-corpus', 'retrieval-bench'][index % 4]}-${index + 1}`,
  description: ['Documented agent trajectories for tool-use evaluation.', 'Image and text pairs for multimodal evaluation.', 'Reasoning examples with verified answer traces.', 'A retrieval benchmark with difficult negatives.'][index % 4],
  tags: ['task_categories:text-retrieval', 'size_categories:10K<n<100K', index % 2 ? 'modality:text' : 'modality:image', 'format:parquet', 'language:en', 'license:apache-2.0'],
  downloads: 62000 - index * 4200,
  likes: 820 - index * 51,
  trendingScore: 88 - index * 5,
  lastModified: `2026-08-${String(29 - index).padStart(2, '0')}T00:00:00Z`,
}));

const papers = Array.from({ length: 8 }, (_, index) => ({
  paper: {
    id: `2608.${String(12000 + index).padStart(5, '0')}`,
    title: ['Reliable Tool Use in Long-Horizon Agents', 'Evaluating Retrieval Under Distribution Shift', 'Efficient Multimodal Reasoning at Inference Time', 'Small Models as Research Assistants'][index % 4],
    ai_summary: ['A framework for measuring and improving tool-use reliability.', 'A benchmark for retrieval systems under changing data.', 'Methods for reducing multimodal inference cost.', 'An empirical study of compact research-oriented models.'][index % 4],
    authors: [{ name: 'Scout Research' }, { name: 'Open Systems Lab' }],
    upvotes: 210 - index * 17,
    publishedAt: `2026-08-${String(29 - index).padStart(2, '0')}T00:00:00Z`,
    ai_keywords: ['agents', 'evaluation', 'reasoning'],
  },
  numComments: 24 - index,
}));

const arxivXml = await readFile(resolve(root, 'tests/fixtures/arxiv.xml'), 'utf8');
const fetchImpl = async (url) => {
  const value = `${url}`;
  if (value.includes('github.com/trending')) return new Response(`<html><body>${githubHtml}</body></html>`, { status: 200 });
  if (value.includes('export.arxiv.org')) return new Response(arxivXml, { status: 200 });
  return new Response('', { status: 404 });
};

const server = createDevServer({ fetchImpl });
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('scout-lab:data-schema', '2');
    localStorage.setItem('scout-lab:settings', JSON.stringify({
      selectedSection: 'today',
      preferences: { startupSection: 'today', density: 'comfortable', theme: 'dark' },
    }));
  });
  await page.route('https://huggingface.co/api/models**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(models) }));
  await page.route('https://huggingface.co/api/datasets**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datasets) }));
  await page.route('https://huggingface.co/api/daily_papers**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(papers) }));

  await page.goto(`${baseUrl}/newtab.html`);
  await page.locator('.grid .card:not(.skeleton-card)').first().waitFor({ state: 'visible' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(root, 'store/assets/screenshot-today-dark.png') });

  await page.getByRole('button', { name: 'Code' }).click();
  await page.locator('.grid .card:not(.skeleton-card)').first().waitFor({ state: 'visible' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(root, 'store/assets/screenshot-code-trending.png') });

  await page.getByRole('button', { name: 'Models' }).click();
  await page.locator('.grid .card:not(.skeleton-card)').first().waitFor({ state: 'visible' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(root, 'store/assets/screenshot-models-discovery.png') });

  await page.setViewportSize({ width: 440, height: 280 });
  await page.goto(`${baseUrl}/store/promo.html`);
  await page.screenshot({ path: resolve(root, 'store/assets/promo-small.png') });
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
}

console.log('Captured three 1280x800 screenshots and one 440x280 promotional tile.');
