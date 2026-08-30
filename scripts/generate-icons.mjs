import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

const root = process.cwd();
const sourcePath = resolve(root, 'store/assets/scout-lab-icon-master.svg');
const outputDirectory = resolve(root, 'assets/icons');
const source = await readFile(sourcePath, 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const size of [16, 32, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`
      <style>html,body,img{display:block;width:100%;height:100%;margin:0}</style>
      <img src="${dataUrl}" alt="">
    `);
    await page.locator('img').screenshot({
      path: resolve(outputDirectory, `icon-${size}.png`),
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log('Generated Beacon Circle icons at 16, 32, 48, and 128 pixels.');
