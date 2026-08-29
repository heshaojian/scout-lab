import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'manifest.json',
  'newtab.html',
  'src/app.js',
  'src/services/feeds.js',
  'src/services/storage.js',
  'src/services/archive.js',
  'src/services/learnSources.js',
  'src/styles/app.css',
  'docs/product-design.md',
  'docs/ui-design.md',
];

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    fail(`Missing required file: ${file}`);
  }
}

const manifest = await readJson('manifest.json');

if (manifest.manifest_version !== 3) {
  fail('manifest.json must use Manifest V3');
}

if (manifest.name !== 'Scout Lab') {
  fail('manifest.json name must be Scout Lab');
}

if (manifest.chrome_url_overrides?.newtab !== 'newtab.html') {
  fail('manifest.json must override the new tab with newtab.html');
}

const html = await readFile('newtab.html', 'utf8');

if (!html.includes('src/styles/app.css') || !html.includes('src/app.js')) {
  fail('newtab.html must load the app CSS and JavaScript entrypoint');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Scout Lab extension check passed.');
