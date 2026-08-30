import { getWorkbench } from '../workbenches.js';
import {
  buildArxivRequest,
  buildCommunityPapersUrl,
  buildDatasetsRequest,
  buildGithubRequest,
  buildModelsUrl,
  matchesTopic,
  resolveGithubRequestUrl,
  resolveArxivRequestUrl,
  resolveDatasetsRequestUrl,
  stableSerialize,
} from './query.js';
import {
  normalizeCommunityPaper,
  normalizeDataset,
  normalizeModel,
  filterModelsByUpdated,
  groupModelCards,
  parseArxivFeed,
  parseGithubTrending,
  parseHuggingFaceDatasetsPage,
} from './normalizers.js';
import { getLearningCards } from './learnSources.js';
import { getCache, getStaleCache, setCache } from './storage.js';

const REQUEST_TIMEOUT = 10_000;
const pendingRequests = new Map();
export const GITHUB_TRENDING_SOURCE_REVISION = 'github-trending-v2';

const fallbackCards = {
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
  const html = await fetchText(resolveGithubRequestUrl(request), { headers: { Accept: 'text/html' } });
  const sourceCards = ensureTrendingCards(parseGithubTrending(html, filters.time));
  const cards = sourceCards.filter((card) => matchesTopic(card, filters.topic));
  return {
    cards,
    status: {
      label: 'GitHub Trending',
      stale: false,
      unavailable: false,
      sourceRevision: GITHUB_TRENDING_SOURCE_REVISION,
      sourceUrl: request.url,
    },
  };
};

const fetchModels = async (filters) => {
  const data = await fetchJson(buildModelsUrl(filters));
  if (!Array.isArray(data)) throw new Error('Hugging Face models returned an unexpected response');
  const normalized = data.map((item) => normalizeModel(item, filters.rank));
  const cards = groupModelCards(filterModelsByUpdated(normalized, filters.updated)
    .filter((card) => matchesTopic(card, filters.topic))).slice(0, 24);
  return { cards, status: { label: 'Hugging Face models', stale: false } };
};

const fetchDatasets = async (filters) => {
  const request = buildDatasetsRequest(filters);
  const requestUrl = resolveDatasetsRequestUrl(request);
  const data = request.kind === 'page'
    ? parseHuggingFaceDatasetsPage(await fetchText(requestUrl, { headers: { Accept: 'text/html' } }))
    : await fetchJson(requestUrl);
  if (!Array.isArray(data)) throw new Error('Hugging Face datasets returned an unexpected response');
  const cards = data.map((item) => normalizeDataset(item, filters.rank))
    .filter((card) => matchesTopic(card, filters.topic)).slice(0, 24);
  return { cards, status: { label: 'Hugging Face datasets', stale: false } };
};

const fetchPapers = async (filters) => {
  if (filters.source === 'arxiv') {
    const request = buildArxivRequest(filters);
    const xml = await fetchText(resolveArxivRequestUrl(request), { headers: { Accept: 'application/atom+xml' } });
    return {
      cards: parseArxivFeed(xml),
      status: { label: 'Raw arXiv', stale: false },
    };
  }

  const data = await fetchJson(buildCommunityPapersUrl(filters));
  if (!Array.isArray(data)) throw new Error('Hugging Face Daily Papers returned an unexpected response');
  const cards = data.map(normalizeCommunityPaper)
    .filter((card) => matchesTopic(card, filters.topic))
    .sort((left, right) => filters.sort === 'recent'
      ? new Date(right.details.featuredAt).getTime() - new Date(left.details.featuredAt).getTime()
      : right.details.upvotes - left.details.upvotes)
    .slice(0, 24);
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

const visibleLane = (cards = [], userState = {}) => cards.filter((card) => !userState[card.id]?.hidden);

const isUsableCache = (section, cached) => (
  cached && (section !== 'code' || (Array.isArray(cached.cards) && cached.cards.length > 0))
);

const alternatePapers = (community, arxiv, count) => {
  const cards = [];
  for (let index = 0; cards.length < count && (community[index] || arxiv[index]); index += 1) {
    if (community[index]) cards.push(community[index]);
    if (cards.length < count && arxiv[index]) cards.push(arxiv[index]);
  }
  return cards;
};

export const composeTodayCards = (lanes, mix, userState = {}) => {
  const selected = {
    code: visibleLane(lanes.code, userState).slice(0, mix.code),
    models: visibleLane(lanes.models, userState).slice(0, mix.models),
    datasets: visibleLane(lanes.datasets, userState).slice(0, mix.datasets),
    papers: alternatePapers(
      visibleLane(lanes.community, userState),
      visibleLane(lanes.arxiv, userState),
      mix.papers,
    ),
    learn: visibleLane(lanes.learn, userState).slice(0, mix.learn),
  };
  const shortfalls = Object.fromEntries(Object.entries(selected)
    .filter(([lane, cards]) => cards.length < mix[lane])
    .map(([lane, cards]) => [lane, mix[lane] - cards.length]));
  return {
    cards: ['code', 'models', 'datasets', 'papers', 'learn'].flatMap((lane) => selected[lane]),
    shortfalls,
  };
};

const fetchToday = async (_filters, options) => {
  const allFilters = options.allFilters || {};
  const sourceFilters = {
    code: { ...getWorkbench('code').defaults, ...allFilters.code },
    models: { ...getWorkbench('models').defaults, ...allFilters.models },
    datasets: { ...getWorkbench('datasets').defaults, ...allFilters.datasets },
    community: { ...getWorkbench('papers').defaults, ...allFilters.papers, source: 'community' },
    arxiv: { ...getWorkbench('papers').defaults, ...allFilters.papers, source: 'arxiv', sort: 'newest' },
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
  const composition = composeTodayCards({
    code: code.cards,
    models: models.cards,
    datasets: datasets.cards,
    community: community.cards,
    arxiv: arxiv.cards,
    learn: learn.cards,
  }, options.todayMix, options.userState);
  const missing = Object.entries(composition.shortfalls)
    .map(([lane, count]) => `${count} ${lane}`)
    .join(', ');

  const unavailable = results.some((result) => result.status.unavailable);
  const stale = results.some((result) => result.status.stale);

  return {
    cards: composition.cards,
    status: {
      label: unavailable ? 'Some sources unavailable' : stale ? 'Mixed live and fallback sources' : 'All sources live',
      stale,
      unavailable,
      ...(missing ? { message: `Today could not fill: ${missing}.` } : {}),
      sources: Object.fromEntries(['code', 'models', 'datasets', 'communityPapers', 'arxiv', 'learn']
        .map((id, index) => [id, results[index].status])),
    },
  };
};

export const fetchSection = async (section, filters, options = {}) => {
  const normalizedOptions = {
    force: false,
    learnProgress: {},
    todayMix: { code: 2, models: 1, datasets: 1, papers: 2, learn: 1 },
    userState: {},
    ...options,
  };
  const hiddenIds = section === 'today'
    ? Object.entries(normalizedOptions.userState).filter(([, value]) => value.hidden).map(([id]) => id).sort()
    : [];
  const query = {
    section,
    filters,
    ...(['code', 'today'].includes(section) ? { sourceRevision: GITHUB_TRENDING_SOURCE_REVISION } : {}),
    ...(section === 'today' ? { todayMix: normalizedOptions.todayMix, hiddenIds } : {}),
  };
  const key = stableSerialize(query);

  if (!normalizedOptions.force) {
    const cached = getCache(query);
    if (isUsableCache(section, cached)) {
      return { cards: cached.cards, status: cached.status, cached: true };
    }
  }

  return deduplicate(key, async () => {
    try {
      const result = section === 'today'
        ? await fetchToday(filters, normalizedOptions)
        : await liveFetcher(section, filters, normalizedOptions);
      setCache(query, result.cards, getWorkbench(section).cacheTtl, { status: result.status });
      return { ...result, cached: false };
    } catch (error) {
      if (section === 'code') {
        return {
          cards: [],
          status: {
            label: 'GitHub Trending is unavailable',
            message: 'GitHub Trending could not be loaded.',
            stale: false,
            unavailable: true,
            sourceRevision: GITHUB_TRENDING_SOURCE_REVISION,
            sourceUrl: buildGithubRequest(filters).url,
          },
          cached: false,
          error: error.message,
        };
      }
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
