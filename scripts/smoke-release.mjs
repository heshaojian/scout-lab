import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

const root = process.cwd();
const archive = resolve(root, 'dist/scout-lab-1.0.1.zip');
const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'scout-lab-release-'));
const extensionPath = resolve(temporaryRoot, 'extension');
const profilePath = resolve(temporaryRoot, 'profile');

await mkdir(extensionPath, { recursive: true });
execFileSync('unzip', ['-q', archive, '-d', extensionPath]);

let context;
try {
  context = await chromium.launchPersistentContext(profilePath, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  const page = context.pages()[0] || await context.newPage();
  await page.goto('chrome://newtab/');
  await page.getByRole('heading', { name: 'Scout Lab' }).waitFor({ state: 'visible' });
  const url = page.url();
  if (!url.startsWith('chrome-extension://') || !url.endsWith('/newtab.html')) {
    throw new Error(`Packaged new-tab override did not load: ${url}`);
  }
  const icon = page.locator('img.mark');
  await icon.waitFor({ state: 'visible' });
  if (!(await icon.getAttribute('src'))?.includes('assets/icons/icon-48.png')) {
    throw new Error('Packaged release icon did not load.');
  }
  console.log(`Packaged extension smoke test passed: ${url}`);
} finally {
  await context?.close();
  await rm(temporaryRoot, { recursive: true, force: true });
}
