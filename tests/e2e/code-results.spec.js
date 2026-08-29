import { expect, test } from '@playwright/test';

const githubRepository = {
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
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('scout-lab:settings', JSON.stringify({
      selectedSection: 'code',
      preferences: { startupSection: 'code' },
    }));
  });
  await page.route(/^https:\/\/github\.com\/trending\//, (route) => route.abort('failed'));
});

test('Code stays useful when Trending is blocked and Search is empty', async ({ page }) => {
  await page.route(/^https:\/\/api\.github\.com\/search\/repositories\?/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ total_count: 0, items: [] }),
  }));

  await page.goto('/newtab.html');

  await expect(page.getByRole('heading', { name: 'Code' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Mode' })).toHaveCount(0);
  await expect(page.locator('.grid .card')).toHaveCount(1);
  await expect(page.locator('.empty-state')).toHaveCount(0);
  await expect(page.locator('.feed-status')).toContainText('no repositories');
  await expect(page.getByRole('heading', { name: 'Explore AI agent repositories' })).toBeVisible();
  await expect(page.locator('.card a.open')).toHaveAttribute('href', /^https:\/\/github\.com\//);
});

test('Code renders a valid Search repository after Trending is blocked', async ({ page }) => {
  await page.route(/^https:\/\/api\.github\.com\/search\/repositories\?/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ total_count: 1, items: [githubRepository] }),
  }));

  await page.goto('/newtab.html');

  const card = page.locator('.grid .card');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('heading', { name: 'openai/evals' })).toBeVisible();
  await expect(card.locator('.metric')).toContainText('18k stars');
  await expect(card.locator('a.open')).toHaveAttribute('href', 'https://github.com/openai/evals');
});

test('Code ignores a legacy cached empty result', async ({ page }) => {
  await page.addInitScript(() => {
    const query = '{"filters":{"language":"all","mode":"trending","time":"week","topic":"all"},"section":"code"}';
    localStorage.setItem(`scout-lab:cache:v4:${query}`, JSON.stringify({
      cards: [],
      status: { label: 'Old empty result', stale: true },
      expiresAt: Date.now() + 60_000,
      savedAt: new Date().toISOString(),
    }));
  });
  await page.route(/^https:\/\/api\.github\.com\/search\/repositories\?/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ total_count: 1, items: [githubRepository] }),
  }));

  await page.goto('/newtab.html');

  await expect(page.locator('.grid .card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'openai/evals' })).toBeVisible();
  await expect(page.locator('.feed-status')).not.toContainText('Old empty result');
});
