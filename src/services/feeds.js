import { getCache, setCache } from './storage.js';
import { getLearningCards } from './learnSources.js';

const TOPIC_TERMS = {
  all: ['ai', 'llm', 'agent', 'rag', 'evaluation', 'multimodal'],
  agents: ['agent', 'tool-use', 'workflow'],
  llms: ['llm', 'language-model', 'transformers'],
  rag: ['rag', 'retrieval', 'embedding'],
  eval: ['evaluation', 'benchmark', 'eval'],
  multimodal: ['multimodal', 'vision-language', 'diffusion'],
};

const TOPIC_QUERY = {
  all: 'topic:artificial-intelligence stars:>500',
  agents: 'topic:agents stars:>100',
  llms: 'topic:llm stars:>100',
  rag: 'topic:rag stars:>50',
  eval: 'topic:evaluation stars:>50',
  multimodal: 'topic:multimodal stars:>50',
};

const fallbackCards = {
  code: [
    {
      id: 'fallback:code:open-source-agents',
      source: 'github',
      section: 'code',
      type: 'Code',
      title: 'Open-source AI agent tools',
      url: 'https://github.com/topics/agents',
      summary: 'Explore public repositories around agents, tool use, orchestration, and automation.',
      tags: ['agents', 'tools', 'github'],
      metricLabel: 'Source',
      metricValue: 'GitHub',
    },
  ],
  models: [
    {
      id: 'fallback:hf:models',
      source: 'huggingface',
      section: 'models',
      type: 'Model',
      title: 'Hugging Face models',
      url: 'https://huggingface.co/models',
      summary: 'Browse open models by task, library, downloads, and community activity.',
      tags: ['models', 'weights', 'huggingface'],
      metricLabel: 'Source',
      metricValue: 'HF Hub',
    },
  ],
  datasets: [
    {
      id: 'fallback:hf:datasets',
      source: 'huggingface',
      section: 'datasets',
      type: 'Dataset',
      title: 'Hugging Face datasets',
      url: 'https://huggingface.co/datasets',
      summary: 'Browse datasets that reveal training tasks, eval styles, and real AI problem framing.',
      tags: ['datasets', 'eval', 'huggingface'],
      metricLabel: 'Source',
      metricValue: 'HF Hub',
    },
  ],
  papers: [
    {
      id: 'fallback:arxiv:ai',
      source: 'arxiv',
      section: 'papers',
      type: 'Paper',
      title: 'Recent arXiv AI and ML papers',
      url: 'https://arxiv.org/list/cs.AI/recent',
      summary: 'Scan raw research from cs.AI and cs.LG when the live API is not available.',
      tags: ['research', 'cs.AI', 'cs.LG'],
      metricLabel: 'Source',
      metricValue: 'arXiv',
    },
  ],
};

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();

const REQUEST_TIMEOUT = 8000;

const compactNumber = (value) => {
  if (!Number.isFinite(value)) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
};

const getTopicTerms = (topic) => TOPIC_TERMS[topic] || TOPIC_TERMS.all;

const matchesTopic = (card, topic) => {
  if (topic === 'all') return true;

  const terms = getTopicTerms(topic);
  const haystack = `${card.title} ${card.summary} ${card.tags.join(' ')}`.toLowerCase();

  return terms.some((term) => haystack.includes(term.toLowerCase()));
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const fetchJson = async (url) => {
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);

  return response.json();
};

const ensureCards = (section, cards) => {
  if (cards.length > 0) return cards;

  throw new Error(`No ${section} cards returned`);
};

const withCache = async (section, topic, fetcher) => {
  const cached = getCache(section, topic);

  if (cached) {
    return { cards: cached, stale: false, cached: true };
  }

  try {
    const cards = ensureCards(section, await fetcher());
    setCache(section, topic, cards);
    return { cards, stale: false, cached: false };
  } catch (error) {
    return {
      cards: fallbackCards[section] || [],
      stale: true,
      cached: false,
      error: error.message,
    };
  }
};

export const fetchCode = (topic) => withCache('code', topic, async () => {
  const query = TOPIC_QUERY[topic] || TOPIC_QUERY.all;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=24`;
  const data = await fetchJson(url);

  return (data.items || []).map((repo) => ({
    id: `github:${repo.full_name}`,
    source: 'github',
    section: 'code',
    type: 'Code',
    title: repo.full_name,
    url: repo.html_url,
    summary: repo.description || 'No description provided.',
    tags: [repo.language, ...(repo.topics || []).slice(0, 4)].filter(Boolean),
    metricLabel: 'Stars',
    metricValue: `★ ${compactNumber(repo.stargazers_count)}`,
    secondaryMetricLabel: 'Forks',
    secondaryMetricValue: compactNumber(repo.forks_count),
    owner: repo.owner?.login,
    publishedAt: repo.updated_at,
  }));
});

export const fetchModels = (topic) => withCache('models', topic, async () => {
  const terms = getTopicTerms(topic).slice(0, 2).join(' ');
  const url = `https://huggingface.co/api/models?${new URLSearchParams({
    search: terms,
    sort: 'downloads',
    direction: '-1',
    limit: '24',
  })}`;
  const data = await fetchJson(url);

  return data.map((model) => ({
    id: `hf-model:${model.modelId}`,
    source: 'huggingface',
    section: 'models',
    type: 'Model',
    title: model.modelId,
    url: `https://huggingface.co/${model.modelId}`,
    summary: clean(model.pipeline_tag || model.library_name || 'Open model on Hugging Face.'),
    tags: [...(model.tags || []).slice(0, 5)].filter(Boolean),
    metricLabel: 'Downloads',
    metricValue: compactNumber(model.downloads || 0),
    secondaryMetricLabel: 'Likes',
    secondaryMetricValue: compactNumber(model.likes || 0),
    owner: model.modelId?.split('/')[0],
    publishedAt: model.lastModified,
  })).filter((card) => matchesTopic(card, topic)).slice(0, 18);
});

export const fetchDatasets = (topic) => withCache('datasets', topic, async () => {
  const terms = getTopicTerms(topic).slice(0, 2).join(' ');
  const url = `https://huggingface.co/api/datasets?${new URLSearchParams({
    search: terms,
    sort: 'downloads',
    direction: '-1',
    limit: '24',
  })}`;
  const data = await fetchJson(url);

  return data.map((dataset) => ({
    id: `hf-dataset:${dataset.id}`,
    source: 'huggingface',
    section: 'datasets',
    type: 'Dataset',
    title: dataset.id,
    url: `https://huggingface.co/datasets/${dataset.id}`,
    summary: clean(dataset.description || 'Open dataset on Hugging Face.'),
    tags: [...(dataset.tags || []).slice(0, 5)].filter(Boolean),
    metricLabel: 'Downloads',
    metricValue: compactNumber(dataset.downloads || 0),
    secondaryMetricLabel: 'Likes',
    secondaryMetricValue: compactNumber(dataset.likes || 0),
    owner: dataset.id?.split('/')[0],
    publishedAt: dataset.lastModified,
  })).filter((card) => matchesTopic(card, topic)).slice(0, 18);
});

export const fetchPapers = (topic) => withCache('papers', topic, async () => {
  const topicClause = getTopicTerms(topic).slice(0, 4).map((term) => `all:${term}`).join(' OR ');
  const searchQuery = topic === 'all'
    ? 'cat:cs.AI OR cat:cs.LG'
    : `(cat:cs.AI OR cat:cs.LG) AND (${topicClause})`;
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: '24',
    sort_by: 'submittedDate',
    sort_order: 'descending',
  });
  const url = `https://export.arxiv.org/api/query?${params}`;
  const response = await fetchWithTimeout(url, { headers: { Accept: 'application/atom+xml' } });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);

  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  return [...doc.querySelectorAll('entry')].map((entry) => {
    const id = clean(entry.querySelector('id')?.textContent || '');
    const categories = [...entry.querySelectorAll('category')].map((node) => node.getAttribute('term')).filter(Boolean);
    const authors = [...entry.querySelectorAll('author name')].map((node) => clean(node.textContent || '')).slice(0, 3);
    const pdf = [...entry.querySelectorAll('link')].find((node) => node.getAttribute('title') === 'pdf')?.getAttribute('href');

    return {
      id: `arxiv:${id}`,
      source: 'arxiv',
      section: 'papers',
      type: 'Paper',
      title: clean(entry.querySelector('title')?.textContent || 'Untitled paper'),
      url: id,
      summary: clean(entry.querySelector('summary')?.textContent || ''),
      tags: categories.slice(0, 4),
      metricLabel: 'Category',
      metricValue: categories[0] || 'arXiv',
      secondaryMetricLabel: 'PDF',
      secondaryMetricValue: pdf ? 'Available' : '',
      owner: authors.join(', '),
      publishedAt: entry.querySelector('published')?.textContent || '',
    };
  }).filter((card) => matchesTopic(card, topic)).slice(0, 18);
});

export const fetchSection = async (section, topic) => {
  if (section === 'code') return fetchCode(topic);
  if (section === 'models') return fetchModels(topic);
  if (section === 'datasets') return fetchDatasets(topic);
  if (section === 'papers') return fetchPapers(topic);
  if (section === 'learn') return { cards: getLearningCards(), stale: false, cached: true };

  const [code, models, datasets, papers] = await Promise.all([
    fetchCode(topic),
    fetchModels(topic),
    fetchDatasets(topic),
    fetchPapers(topic),
  ]);

  return {
    cards: [
      ...code.cards.slice(0, 2),
      ...models.cards.slice(0, 2),
      ...datasets.cards.slice(0, 1),
      ...papers.cards.slice(0, 2),
      ...getLearningCards().slice(0, 1),
    ],
    stale: [code, models, datasets, papers].some((result) => result.stale),
    cached: [code, models, datasets, papers].every((result) => result.cached),
  };
};
