import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const arxivXml = await readFile(resolve(process.cwd(), 'tests', 'fixtures', 'arxiv.xml'), 'utf8');
const datasetsHtml = await readFile(resolve(process.cwd(), 'tests', 'fixtures', 'huggingface-datasets.html'), 'utf8');

const datasets = [{
  id: 'scout/reading-data',
  description: 'A&nbsp;carefully documented <strong>retrieval dataset</strong>.',
  tags: [
    'task_categories:text-retrieval', 'size_categories:10K<n<100K', 'modality:image',
    'format:parquet', 'language:zh', 'license:apache-2.0', 'benchmark:official',
  ],
  downloads: 4200,
  likes: 120,
  trendingScore: 80,
  createdAt: '2026-08-20T00:00:00Z',
  lastModified: '2026-08-28T00:00:00Z',
  mainSize: 987654321,
}];

const papers = [
  { paper: { id: '2608.00002', title: 'Lower vote, newer', summary: 'Recent paper.', upvotes: 5, submittedOnDailyAt: '2026-08-28T00:00:00Z', authors: [] } },
  { paper: { id: '2608.00001', title: 'Higher vote, older', summary: 'Trending paper.', upvotes: 40, submittedOnDailyAt: '2026-08-27T00:00:00Z', githubRepo: 'https://github.com/scout/paper-code', authors: [] } },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('scout-lab:test-initialized')) return;
    localStorage.clear();
    localStorage.setItem('scout-lab:settings', JSON.stringify({
      selectedSection: 'datasets',
      preferences: { startupSection: 'last-used', density: 'comfortable', theme: 'dark' },
    }));
    sessionStorage.setItem('scout-lab:test-initialized', 'true');
  });
});

test('Datasets sends exact, independently combinable source filters', async ({ page }) => {
  const requests = [];
  await page.route('https://huggingface.co/api/datasets**', (route) => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datasets) });
  });

  await page.goto('/newtab.html');
  await expect(page.getByText('A carefully documented retrieval dataset.')).toBeVisible();
  await page.getByLabel('Task').selectOption('text-retrieval');
  await page.getByLabel('Rows').selectOption('10k-100k');
  await page.getByLabel('Modality').selectOption('image');
  await page.locator('.more-filters summary').click();
  await page.getByLabel('Format').selectOption('parquet');
  await page.getByLabel('Type').selectOption('benchmark');
  await page.getByLabel('Language').selectOption('zh');
  await page.getByLabel('License').selectOption('apache-2.0');
  await page.getByLabel('Access').selectOption('open');

  const request = requests.at(-1);
  expect(request.searchParams.getAll('filter')).toEqual(expect.arrayContaining([
    'task_categories:text-retrieval', 'size_categories:10K<n<100K',
    'modality:image', 'format:parquet', 'language:zh', 'license:apache-2.0',
    'benchmark:official',
  ]));
  expect(request.searchParams.get('gated')).toBe('false');
  await expect(page.locator('.card').first()).toContainText('image');
  await expect(page.locator('.card').first()).toContainText('parquet');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Datasets keeps all nine sorts aligned with valid Hugging Face requests', async ({ page }) => {
  const requests = [];
  await page.route('https://huggingface.co/api/datasets**', (route) => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datasets) });
  });
  await page.route('**/__scout/hf-datasets**', (route) => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, contentType: 'text/html', body: datasetsHtml });
  });

  await page.goto('/newtab.html');
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(requests[0].searchParams.get('sort')).toBe('trendingScore');
  const expected = [
    ['likes', 'likes'], ['downloads', 'downloads'], ['created', 'createdAt'],
    ['updated', 'lastModified'], ['most-rows', 'most_rows'], ['least-rows', 'least_rows'],
    ['largest-size', 'mainSize'], ['smallest-size', 'mainSize'],
  ];
  for (const [value, sourceSort] of expected) {
    const count = requests.length;
    await page.getByLabel('Sort').selectOption(value);
    await expect.poll(() => requests.length).toBeGreaterThan(count);
    expect(requests.at(-1).searchParams.get('sort')).toBe(sourceSort);
    await expect(page.locator('.card').first()).toBeVisible();
  }
});

test('Papers keeps period semantics, switches to local arXiv, and opens direct resources', async ({ page }) => {
  const communityRequests = [];
  await page.route('https://huggingface.co/api/datasets**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('https://huggingface.co/api/daily_papers**', (route) => {
    communityRequests.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(papers) });
  });
  await page.route('**/__scout/arxiv**', (route) => route.fulfill({ status: 200, contentType: 'application/atom+xml', body: arxivXml }));
  await page.context().route('https://arxiv.org/pdf/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Paper PDF</title>' }));

  await page.goto('/newtab.html');
  await page.getByRole('button', { name: 'Papers' }).click();
  await expect(page.locator('.card h3').first()).toHaveText('Higher vote, older');
  expect(communityRequests.at(-1).searchParams.get('week')).toBeTruthy();
  expect(communityRequests.at(-1).searchParams.has('sort')).toBe(false);

  await page.getByLabel('Sort').selectOption('recent');
  await expect(page.locator('.card h3').first()).toHaveText('Lower vote, newer');
  expect(communityRequests.at(-1).searchParams.has('sort')).toBe(false);

  await page.getByRole('button', { name: 'Raw arXiv' }).click();
  await expect(page.getByLabel('Sort')).toHaveValue('newest');
  await expect(page.getByRole('heading', { name: 'Persistent Memory for Tool-Using Agents' })).toBeVisible();
  const pdf = page.getByRole('link', { name: 'PDF' });
  await expect(pdf).toHaveAttribute('href', 'https://arxiv.org/pdf/2608.12345v1');
  const popupPromise = page.waitForEvent('popup');
  await pdf.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://arxiv.org/pdf/2608.12345v1');
  await popup.close();
});

test('Learn exposes level and effort and persists Start to Resume', async ({ page }) => {
  await page.route('https://huggingface.co/api/datasets**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('https://huggingface.co/learn/llm-course/en/chapter1/1', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>LLM Course</title>' }));

  await page.goto('/newtab.html');
  await page.getByRole('button', { name: 'Learn' }).click();
  await page.getByLabel('Level').selectOption('foundational');
  const card = page.locator('.card[data-id="learn:hf-llm-course"]');
  await expect(card).toContainText('Foundational');
  await expect(card).toContainText('12 chapters');
  await expect(card.getByRole('link', { name: /Start/ })).toBeVisible();

  await card.getByLabel('Progress for Hugging Face LLM Course').selectOption('in-progress');
  await expect(card.getByRole('link', { name: /Resume/ })).toBeVisible();
  await page.reload();
  await expect(page.locator('.card[data-id="learn:hf-llm-course"]').getByRole('link', { name: /Resume/ })).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  await page.locator('.card[data-id="learn:hf-llm-course"]').getByRole('link', { name: /Resume/ }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://huggingface.co/learn/llm-course/en/chapter1/1');
  await popup.close();
});
