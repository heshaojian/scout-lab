import { getWorkbench } from '../workbenches.js';
import {
  buildArxivUrl,
  buildCommunityPapersUrl,
  buildDatasetsUrl,
  buildGithubRequest,
  buildModelsUrl,
  matchesTopic,
  stableSerialize,
} from './query.js';
import {
  normalizeCommunityPaper,
  normalizeDataset,
  normalizeGithubRepository,
  normalizeModel,
  parseArxivFeed,
  parseGithubTrending,
} from './normalizers.js';
import { getLearningCards } from './learnSources.js';
import { getCache, getStaleCache, setCache } from './storage.js';

const REQUEST_TIMEOUT = 10_000;
const pendingRequests = new Map();

const fallbackCards = {
  code: [{
    id: 'fallback:code:agents', source: 'github', section: 'code', type: 'Code',
    title: 'Explore AI agent repositories', url: 'https://github.com/topics/agents',
    summary: 'Browse public repositories around agents, tool use, orchestration, and automation.',
    tags: ['agents', 'tools', 'github'], metricLabel: 'Source', metricValue: 'GitHub',
    metrics: [], links: [], secondary: { left: 'GitHub topic', right: 'Live feed unavailable' }, details: {},
  }],
  models: [{
    id: 'fallback:hf:models', source: 'huggingface', section: 'models', type: 'Model',
    title: 'Hugging Face models', url: 'https://huggingface.co/models',
    summary: 'Browse open models by task, library, downloads, and community activity.',
    tags: ['models', 'weights', 'huggingface'], metricLabel: 'Source', metricValue: 'HF Hub',
    metrics: [], links: [], secondary: { left: 'Model catalog', right: 'Live feed unavailable' }, details: {},
  }],
  datasets: [{
    id: 'fallback:hf:datasets', source: 'huggingface', section: 'datasets', type: 'Dataset',
    title: 'Hugging Face datasets', url: 'https://huggingface.co/datasets',
    summary: 'Browse datasets that reveal training tasks, evaluation styles, and problem framing.',
    tags: ['datasets', 'evaluation', 'huggingface'], metricLabel: 'Source', metricValue: 'HF Hub',
    metrics: [], links: [], secondary: { left: 'Dataset catalog', right: 'Live feed unavailable' }, details: {},
  }],
  papers: [{
    id: 'fallback:arxiv:ai', source: 'arxiv', section: 'papers', type: 'Paper',
    title: 'Recent arXiv AI and ML papers', url: 'https://arxiv.org/list/cs.AI/recent',
    summary: 'Scan recent cs.AI and cs.LG research while the selected live feed is unavailable.',
    tags: ['research', 'cs.AI', 'cs.LG'], metricLabel: 'Source', metricValue: 'arXiv',
    metrics: [], links: [], secondary: { left: 'Raw research', right: 'Live feed unavailable' }, details: {},
  }],
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async (url, options = {}) => (await fetchWithTimeout(url, {
  ...options,
  headers: { Accept: 'application/json', ...(options.headers || {}) },
})).json();

const fetchText = async (url, options = {}) => (await fetchWithTimeout(url, options)).text();

const ensureTrendingCards = (cards) => {
  if (cards.length) return cards;
  throw new Error('GitHub Trending markup did not contain repository cards');
};

const deduplicate = (key, task) => {
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const request = task().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
};

const fetchCode = async (filters) => {
  const request = buildGithubRequest(filters);
  const headers = { Accept: 'application/vnd.github+json' };

  if (request.kind === 'trending') {
    try {
      const html = await fetchText(request.url, { headers: { Accept: 'text/html' } });
      const cards = ensureTrendingCards(
        parseGithubTrending(html, filters.time).filter((card) => matchesTopic(card, filters.topic)),
      );
      return { cards, status: { label: 'GitHub Trending', stale: false } };
    } catch (error) {
      const data = await fetchJson(request.fallbackUrl, { headers });
      const cards = (data.items || []).map((item) => normalizeGithubRepository(item, 'rising'));
      return {
        cards,
        status: {
          label: 'GitHub search fallback',
          stale: true,
          message: `Trending format changed or was unavailable; showing GitHub search fallback. ${error.message}`,
        },
      };
    }
  }

  const data = await fetchJson(request.url, { headers });
  return {
    cards: (data.items || []).map((item) => normalizeGithubRepository(item, filters.mode)),
    status: { label: filters.mode === 'active' ? 'GitHub active search' : 'GitHub new repository search', stale: false },
  };
};

const fetchModels = async (filters) => {
  const data = await fetchJson(buildModelsUrl(filters));
  if (!Array.isArray(data)) throw new Error('Hugging Face models returned an unexpected response');
  const cards = data.map((item) => normalizeModel(item, filters.rank)).filter((card) => matchesTopic(card, filters.topic));
  return { cards, status: { label: 'Hugging Face models', stale: false } };
};

const fetchDatasets = async (filters) => {
  const data = await fetchJson(buildDatasetsUrl(filters));
  if (!Array.isArray(data)) throw new Error('Hugging Face datasets returned an unexpected response');
  const cards = data.map((item) => normalizeDataset(item, filters.rank)).filter((card) => matchesTopic(card, filters.topic));
  return { cards, status: { label: 'Hugging Face datasets', stale: false } };
};

const fetchPapers = async (filters) => {
  if (filters.source === 'arxiv') {
    const xml = await fetchText(buildArxivUrl(filters), { headers: { Accept: 'application/atom+xml' } });
    return {
      cards: parseArxivFeed(xml),
      status: { label: 'Raw arXiv', stale: false },
    };
  }

  const data = await fetchJson(buildCommunityPapersUrl(filters));
  if (!Array.isArray(data)) throw new Error('Hugging Face Daily Papers returned an unexpected response');
  const cards = data.map(normalizeCommunityPaper).filter((card) => matchesTopic(card, filters.topic));
  return { cards, status: { label: 'Hugging Face Daily Papers', stale: false } };
};

const liveFetcher = (section, filters, options) => {
  if (section === 'code') return fetchCode(filters);
  if (section === 'models') return fetchModels(filters);
  if (section === 'datasets') return fetchDatasets(filters);
  if (section === 'papers') return fetchPapers(filters);
  if (section === 'learn') {
    return Promise.resolve({
      cards: getLearningCards(filters, options.learnProgress),
      status: { label: 'Curated learning catalog', stale: false },
    });
  }
  throw new Error(`Unknown workbench: ${section}`);
};

const fetchToday = async (filters, options) => {
  const allFilters = options.allFilters || {};
  const sourceFilters = {
    code: { ...getWorkbench('code').defaults, ...allFilters.code, topic: filters.topic },
    models: { ...getWorkbench('models').defaults, ...allFilters.models, topic: filters.topic },
    datasets: { ...getWorkbench('datasets').defaults, ...allFilters.datasets, topic: filters.topic },
    community: { ...getWorkbench('papers').defaults, ...allFilters.papers, source: 'community', topic: filters.topic },
    arxiv: { ...getWorkbench('papers').defaults, ...allFilters.papers, source: 'arxiv', sort: 'newest', topic: filters.topic },
    learn: { ...getWorkbench('learn').defaults, ...allFilters.learn },
  };
  const sharedOptions = { ...options, force: false };
  const [code, models, datasets, community, arxiv, learn] = await Promise.all([
    fetchSection('code', sourceFilters.code, sharedOptions),
    fetchSection('models', sourceFilters.models, sharedOptions),
    fetchSection('datasets', sourceFilters.datasets, sharedOptions),
    fetchSection('papers', sourceFilters.community, sharedOptions),
    fetchSection('papers', sourceFilters.arxiv, sharedOptions),
    fetchSection('learn', sourceFilters.learn, sharedOptions),
  ]);
  const results = [code, models, datasets, community, arxiv, learn];

  return {
    cards: [
      ...code.cards.slice(0, 2),
      ...models.cards.slice(0, 1),
      ...datasets.cards.slice(0, 1),
      ...community.cards.slice(0, 1),
      ...arxiv.cards.slice(0, 1),
      ...learn.cards.slice(0, 1),
    ],
    status: {
      label: results.some((result) => result.status.stale) ? 'Mixed live and fallback sources' : 'All sources live',
      stale: results.some((result) => result.status.stale),
      sources: Object.fromEntries(['code', 'models', 'datasets', 'communityPapers', 'arxiv', 'learn']
        .map((id, index) => [id, results[index].status])),
    },
  };
};

export const fetchSection = async (section, filters, options = {}) => {
  const normalizedOptions = { force: false, learnProgress: {}, ...options };
  const query = { section, filters };
  const key = stableSerialize(query);

  if (!normalizedOptions.force) {
    const cached = getCache(query);
    if (cached) return { cards: cached.cards, status: cached.status, cached: true };
  }

  return deduplicate(key, async () => {
    try {
      const result = section === 'today'
        ? await fetchToday(filters, normalizedOptions)
        : await liveFetcher(section, filters, normalizedOptions);
      setCache(query, result.cards, getWorkbench(section).cacheTtl, { status: result.status });
      return { ...result, cached: false };
    } catch (error) {
      const stale = getStaleCache(query);
      if (stale?.cards?.length) {
        return {
          cards: stale.cards,
          status: { ...(stale.status || {}), stale: true, message: `Showing saved results. ${error.message}` },
          cached: true,
          error: error.message,
        };
      }
      return {
        cards: fallbackCards[section] || [],
        status: { label: `${getWorkbench(section).label} fallback`, stale: true, message: error.message },
        cached: false,
        error: error.message,
      };
    }
  });
};
