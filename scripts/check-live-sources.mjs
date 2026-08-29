import {
  buildArxivUrl,
  buildCommunityPapersUrl,
  buildDatasetsUrl,
  buildGithubRequest,
  buildModelsUrl,
} from '../src/services/query.js';
import { learningLinks } from '../src/services/learnSources.js';
import { createDefaultFilters } from '../src/workbenches.js';
import { buildGithubHeaders } from './live-source-auth.mjs';

const TIMEOUT = 15_000;
const checks = [];

const fetchChecked = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response;
};

const record = async (name, task) => {
  try {
    const detail = await task();
    checks.push({ name, ok: true, detail });
    return detail;
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
    return null;
  }
};

const defaults = createDefaultFilters();

const trending = await record('GitHub Trending contract', async () => {
  const response = await fetchChecked(buildGithubRequest(defaults.code).url);
  const html = await response.text();
  const repositoryPaths = [...html.matchAll(/<h2[\s\S]*?<a[^>]+href="(\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)"/g)]
    .map((match) => match[1]);
  const periodLabels = (html.match(/stars this week/g) || []).length;
  if (!repositoryPaths.length || !periodLabels) throw new Error('No parseable repositories or weekly star labels');
  return { entries: repositoryPaths.length, periodLabels, links: repositoryPaths.map((path) => `https://github.com${path}`) };
});

const github = await record('GitHub search contract', async () => {
  const request = buildGithubRequest({ ...defaults.code, time: 'month', language: 'python', topic: 'agents' });
  const response = await fetchChecked(request.fallbackUrl, {
    headers: buildGithubHeaders(process.env.GITHUB_TOKEN),
  });
  const data = await response.json();
  if (!data.items?.length || !Number.isFinite(data.items[0].stargazers_count)) throw new Error('Missing repository star data');
  return { entries: data.items.length, links: data.items.slice(0, 8).map((item) => item.html_url) };
});

const models = await record('Hugging Face models contract', async () => {
  const response = await fetchChecked(buildModelsUrl(defaults.models));
  const data = await response.json();
  if (!data.length || !Number.isFinite(data[0].trendingScore) || !Number.isFinite(data[0].downloads)) {
    throw new Error('Missing trending or download metrics');
  }
  return { entries: data.length, links: data.map((item) => `https://huggingface.co/${item.id}`) };
});

const datasets = await record('Hugging Face datasets contract', async () => {
  const response = await fetchChecked(buildDatasetsUrl(defaults.datasets));
  const data = await response.json();
  if (!data.length || !Number.isFinite(data[0].trendingScore) || !Number.isFinite(data[0].downloads)) {
    throw new Error('Missing trending or download metrics');
  }
  return { entries: data.length, links: data.map((item) => `https://huggingface.co/datasets/${item.id}`) };
});

const papers = await record('Hugging Face Daily Papers contract', async () => {
  const response = await fetchChecked(buildCommunityPapersUrl(defaults.papers));
  const data = await response.json();
  const first = data[0];
  if (!first?.paper?.id || !Number.isFinite(first.paper.upvotes) || !Number.isFinite(first.numComments)) {
    throw new Error('Missing paper, upvote, or comment fields');
  }
  return { entries: data.length, links: data.map((item) => `https://huggingface.co/papers/${item.paper.id}`) };
});

const arxiv = await record('arXiv Atom contract', async () => {
  const response = await fetchChecked(buildArxivUrl({ ...defaults.papers, source: 'arxiv', sort: 'newest' }));
  const xml = await response.text();
  const ids = [...xml.matchAll(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/g)].map((match) => match[1]);
  if (!ids.length || !xml.includes('<author>') || !xml.includes('<category') || !xml.includes('title="pdf"')) {
    throw new Error('Missing entry, author, category, or PDF fields');
  }
  return { entries: ids.length, links: ids.map((id) => `https://arxiv.org/abs/${id}`) };
});

const linkGroups = [trending, github, models, datasets, papers, arxiv].filter(Boolean);
const links = [...new Set([
  ...linkGroups.flatMap((group) => group.links),
  ...learningLinks.map((item) => item.url),
])];

const rateLimitedHosts = new Set();

const verifyLink = async (url) => {
  const host = new URL(url).hostname;
  if (rateLimitedHosts.has(host)) return { url, status: 429, rateLimited: true };
  let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
  if ([405, 501].includes(response.status)) {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
    await response.body?.cancel();
  }
  if (response.status === 429) {
    rateLimitedHosts.add(host);
    return { url, status: 429, rateLimited: true };
  }
  if (response.status < 200 || response.status >= 400) throw new Error(`${response.status} ${response.statusText}`);
  return { url, status: response.status, finalUrl: response.url };
};

await record('Rendered destination links', async () => {
  const results = [];
  const failures = [];
  const queue = [...links];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        results.push(await verifyLink(url));
      } catch (error) {
        failures.push({ url, error: error.message });
      }
    }
  };
  await worker();
  if (failures.length) throw new Error(`${failures.length} failed: ${JSON.stringify(failures.slice(0, 5))}`);
  return {
    checked: results.length,
    reachable: results.filter((result) => !result.rateLimited).length,
    rateLimited: results.filter((result) => result.rateLimited).length,
  };
});

for (const check of checks) {
  const detail = check.detail?.links ? { ...check.detail, links: check.detail.links.length } : check.detail;
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${JSON.stringify(detail)}`);
}

if (checks.some((check) => !check.ok)) process.exitCode = 1;
