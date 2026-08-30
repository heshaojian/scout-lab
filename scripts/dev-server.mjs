import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  CODE_LANGUAGE_OPTIONS, DATASET_FORMAT_OPTIONS, DATASET_MODALITY_OPTIONS,
  DATASET_TASK_OPTIONS, SPOKEN_LANGUAGE_OPTIONS, WORKBENCHES,
} from '../src/workbenches.js';
import { DATASET_SIZE } from '../src/services/query.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TRENDING_PATH = '/__scout/github-trending';
const ARXIV_PATH = '/__scout/arxiv';
const DATASETS_PATH = '/__scout/hf-datasets';
const ALLOWED_PARAMETERS = new Set(['since', 'language', 'spoken_language_code']);
const ALLOWED_PERIODS = new Set(['daily', 'weekly', 'monthly']);
const ALLOWED_LANGUAGES = new Set(CODE_LANGUAGE_OPTIONS.map(({ value }) => value).filter((value) => value !== 'all'));
const ALLOWED_SPOKEN_LANGUAGES = new Set(SPOKEN_LANGUAGE_OPTIONS.map(({ value }) => value).filter((value) => value !== 'all'));
const ALLOWED_ARXIV_PARAMETERS = new Set(['search_query', 'start', 'max_results', 'sortBy', 'sortOrder']);
const ALLOWED_ARXIV_SORTS = new Set(['submittedDate', 'relevance']);
const ALLOWED_DATASET_PARAMETERS = new Set([
  'sort', 'task_categories', 'size_categories', 'modality', 'format', 'language',
  'license', 'gated', 'benchmark',
]);
const DATASET_PAGE_SORTS = new Set(['most_rows', 'least_rows']);
const prefixed = (options, prefix) => new Set(options.filter(({ value }) => !['all', 'any'].includes(value))
  .map(({ value }) => `${prefix}:${value}`));
const DATASET_PARAMETER_VALUES = {
  task_categories: prefixed(DATASET_TASK_OPTIONS, 'task_categories'),
  size_categories: new Set(Object.values(DATASET_SIZE).map((value) => `size_categories:${value}`)),
  modality: prefixed(DATASET_MODALITY_OPTIONS, 'modality'),
  format: new Set([...prefixed(DATASET_FORMAT_OPTIONS, 'format'), 'format:agent-traces']),
  language: prefixed(WORKBENCHES.datasets.controls.find(({ id }) => id === 'language').options, 'language'),
  license: prefixed(WORKBENCHES.datasets.controls.find(({ id }) => id === 'license').options, 'license'),
  gated: new Set(['true', 'false']),
  benchmark: new Set(['benchmark:official']),
};
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

const singleParameter = (params, key) => {
  const values = params.getAll(key);
  if (values.length > 1) throw new Error(`Invalid duplicate parameter: ${key}`);
  return values[0] || '';
};

export const buildTrendingUpstreamUrl = (params) => {
  for (const key of params.keys()) {
    if (!ALLOWED_PARAMETERS.has(key)) throw new Error(`Unsupported parameter: ${key}`);
  }

  const since = singleParameter(params, 'since');
  const language = singleParameter(params, 'language');
  const spokenLanguage = singleParameter(params, 'spoken_language_code');
  if (!ALLOWED_PERIODS.has(since)) throw new Error('Invalid Trending period');
  if (language && !ALLOWED_LANGUAGES.has(language)) throw new Error('Invalid programming language');
  if (spokenLanguage && !ALLOWED_SPOKEN_LANGUAGES.has(spokenLanguage)) throw new Error('Invalid spoken language');

  const upstream = new URL(language
    ? `https://github.com/trending/${encodeURIComponent(language)}`
    : 'https://github.com/trending');
  upstream.searchParams.set('since', since);
  if (spokenLanguage) upstream.searchParams.set('spoken_language_code', spokenLanguage);
  return upstream.toString();
};

export const buildArxivUpstreamUrl = (params) => {
  for (const key of params.keys()) {
    if (!ALLOWED_ARXIV_PARAMETERS.has(key)) throw new Error(`Unsupported parameter: ${key}`);
  }

  const query = singleParameter(params, 'search_query');
  const start = singleParameter(params, 'start');
  const maxResults = singleParameter(params, 'max_results');
  const sortBy = singleParameter(params, 'sortBy');
  const sortOrder = singleParameter(params, 'sortOrder');
  if (!query || query.length > 1_000 || /[\r\n]/.test(query)) throw new Error('Invalid arXiv query');
  if (start !== '0') throw new Error('Invalid arXiv start');
  if (!/^\d+$/.test(maxResults) || Number(maxResults) < 1 || Number(maxResults) > 100) throw new Error('Invalid arXiv result limit');
  if (!ALLOWED_ARXIV_SORTS.has(sortBy)) throw new Error('Invalid arXiv sort');
  if (sortOrder !== 'descending') throw new Error('Invalid arXiv sort order');

  const upstream = new URL('https://export.arxiv.org/api/query');
  ['search_query', 'start', 'max_results', 'sortBy', 'sortOrder']
    .forEach((key) => upstream.searchParams.set(key, singleParameter(params, key)));
  return upstream.toString();
};

export const buildDatasetsPageUpstreamUrl = (params) => {
  for (const key of params.keys()) {
    if (!ALLOWED_DATASET_PARAMETERS.has(key)) throw new Error(`Unsupported parameter: ${key}`);
  }
  const sort = singleParameter(params, 'sort');
  if (!DATASET_PAGE_SORTS.has(sort)) throw new Error('Invalid dataset row sort');
  const upstream = new URL('https://huggingface.co/datasets');
  upstream.searchParams.set('sort', sort);
  for (const [key, allowed] of Object.entries(DATASET_PARAMETER_VALUES)) {
    const value = singleParameter(params, key);
    if (!value) continue;
    if (!allowed.has(value)) throw new Error(`Invalid dataset ${key}`);
    upstream.searchParams.set(key, value);
  }
  return upstream.toString();
};

const send = (response, status, body, contentType = 'text/plain; charset=utf-8') => {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
};

const proxyTrending = async (request, response, url, fetchImpl) => {
  if (request.method !== 'GET') {
    send(response, 405, 'Method not allowed');
    return;
  }

  let upstreamUrl;
  try {
    upstreamUrl = buildTrendingUpstreamUrl(url.searchParams);
  } catch {
    send(response, 400, 'Invalid GitHub Trending request');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const upstream = await fetchImpl(upstreamUrl, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Scout-Lab-Local-Preview',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!upstream.ok) {
      send(response, 502, 'GitHub Trending unavailable');
      return;
    }
    send(response, 200, await upstream.text(), 'text/html; charset=utf-8');
  } catch {
    send(response, 502, 'GitHub Trending unavailable');
  } finally {
    clearTimeout(timeout);
  }
};

const proxyArxiv = async (request, response, url, fetchImpl) => {
  if (request.method !== 'GET') {
    send(response, 405, 'Method not allowed');
    return;
  }

  let upstreamUrl;
  try {
    upstreamUrl = buildArxivUpstreamUrl(url.searchParams);
  } catch {
    send(response, 400, 'Invalid arXiv request');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const upstream = await fetchImpl(upstreamUrl, {
      headers: { Accept: 'application/atom+xml', 'User-Agent': 'Scout-Lab-Local-Preview' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!upstream.ok) {
      send(response, 502, 'arXiv unavailable');
      return;
    }
    send(response, 200, await upstream.text(), 'application/atom+xml; charset=utf-8');
  } catch {
    send(response, 502, 'arXiv unavailable');
  } finally {
    clearTimeout(timeout);
  }
};

const proxyDatasetsPage = async (request, response, url, fetchImpl) => {
  if (request.method !== 'GET') {
    send(response, 405, 'Method not allowed');
    return;
  }
  let upstreamUrl;
  try {
    upstreamUrl = buildDatasetsPageUpstreamUrl(url.searchParams);
  } catch {
    send(response, 400, 'Invalid Hugging Face datasets request');
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const upstream = await fetchImpl(upstreamUrl, {
      headers: { Accept: 'text/html', 'User-Agent': 'Scout-Lab-Local-Preview' },
      redirect: 'follow', signal: controller.signal,
    });
    if (!upstream.ok) {
      send(response, 502, 'Hugging Face datasets unavailable');
      return;
    }
    send(response, 200, await upstream.text(), 'text/html; charset=utf-8');
  } catch {
    send(response, 502, 'Hugging Face datasets unavailable');
  } finally {
    clearTimeout(timeout);
  }
};

const staticPath = (root, pathname) => {
  const decoded = decodeURIComponent(pathname === '/' ? '/newtab.html' : pathname);
  const candidate = resolve(root, `.${decoded}`);
  const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (candidate !== root && !candidate.startsWith(prefix)) return '';
  return candidate;
};

export const createDevServer = ({ root = ROOT, fetchImpl = globalThis.fetch } = {}) => createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (url.pathname === TRENDING_PATH) {
    await proxyTrending(request, response, url, fetchImpl);
    return;
  }
  if (url.pathname === ARXIV_PATH) {
    await proxyArxiv(request, response, url, fetchImpl);
    return;
  }
  if (url.pathname === DATASETS_PATH) {
    await proxyDatasetsPage(request, response, url, fetchImpl);
    return;
  }
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    send(response, 405, 'Method not allowed');
    return;
  }

  let filePath;
  try {
    filePath = staticPath(root, url.pathname);
    if (!filePath || !(await stat(filePath)).isFile()) throw new Error('Not found');
    const body = request.method === 'HEAD' ? '' : await readFile(filePath);
    send(response, 200, body, MIME_TYPES.get(extname(filePath)) || 'application/octet-stream');
  } catch {
    send(response, 404, 'Not found');
  }
});

const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(argument('--port', process.env.PORT || 5179));
  const host = argument('--host', '127.0.0.1');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('Invalid port');
  createDevServer().listen(port, host, () => {
    console.log(`Scout Lab preview: http://${host}:${port}/newtab.html`);
  });
}
