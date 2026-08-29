const GITHUB_TOPIC_QUERY = {
  all: 'topic:artificial-intelligence',
  agents: 'topic:agents',
  llms: 'topic:llm',
  rag: 'topic:rag',
  evaluation: 'topic:evaluation',
  multimodal: 'topic:multimodal',
};

export const TOPIC_TERMS = {
  all: [],
  agents: ['agent', 'tool-use', 'workflow'],
  llms: ['llm', 'language model', 'transformer'],
  rag: ['rag', 'retrieval', 'embedding'],
  evaluation: ['evaluation', 'benchmark', 'eval'],
  multimodal: ['multimodal', 'vision language', 'diffusion'],
};

const MODEL_SORT = {
  trending: 'trendingScore',
  newest: 'createdAt',
  downloads: 'downloads',
  likes: 'likes',
};

const MODEL_SIZE = {
  'under-1b': 'max:1B',
  '1b-7b': 'min:1B,max:7B',
  '7b-30b': 'min:7B,max:30B',
  '30b-plus': 'min:30B',
};

const DATASET_SIZE = {
  'under-10k': 'n<10K',
  '10k-1m': '10K<n<1M',
  '1m-100m': '1M<n<100M',
  '100m-plus': 'n>100M',
};

const SOURCE_HOSTS = {
  github: new Set(['github.com']),
  huggingface: new Set(['huggingface.co']),
  arxiv: new Set(['arxiv.org', 'export.arxiv.org']),
  learn: new Set(['huggingface.co', 'developers.google.com']),
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
  );
};

export const stableSerialize = (value) => JSON.stringify(stableValue(value));

const pad = (value) => `${value}`.padStart(2, '0');

const dateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const arxivDateKey = (date) => dateKey(date).replaceAll('-', '');

const subtractDays = (now, days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const periodStart = (time, now) => subtractDays(now, time === 'day' ? 1 : time === 'month' ? 30 : 7);

const isoWeek = (input) => {
  const date = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
};

const githubLanguage = (value) => ({
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  'jupyter-notebook': 'Jupyter Notebook',
  rust: 'Rust',
  go: 'Go',
  'c++': 'C++',
  java: 'Java',
}[value] || '');

const githubSearchUrl = (filters, now) => {
  const query = [GITHUB_TOPIC_QUERY[filters.topic] || GITHUB_TOPIC_QUERY.all, 'archived:false'];
  const language = githubLanguage(filters.language);
  if (language) query.push(`language:${language}`);
  query.push(`created:>=${dateKey(periodStart(filters.time, now))}`);

  const params = new URLSearchParams({
    q: query.join(' '),
    sort: 'stars',
    order: 'desc',
    per_page: '24',
  });
  return `https://api.github.com/search/repositories?${params}`;
};

export const buildGithubRequest = (filters, now = new Date()) => {
  const language = filters.language === 'all' ? '' : encodeURIComponent(filters.language);
  const since = { day: 'daily', week: 'weekly', month: 'monthly' }[filters.time] || 'weekly';
  return {
    kind: 'trending',
    url: `https://github.com/trending/${language}?since=${since}`,
    fallbackUrl: githubSearchUrl(filters, now),
  };
};

const appendExpand = (params, fields) => fields.forEach((field) => params.append('expand[]', field));

export const buildModelsUrl = (filters) => {
  const params = new URLSearchParams({
    sort: MODEL_SORT[filters.rank] || MODEL_SORT.trending,
    direction: '-1',
    limit: '24',
  });
  if (filters.task !== 'all') params.set('pipeline_tag', filters.task);
  if (MODEL_SIZE[filters.size]) params.set('num_parameters', MODEL_SIZE[filters.size]);
  if (filters.access !== 'all') params.set('gated', `${filters.access === 'gated'}`);
  appendExpand(params, ['downloads', 'likes', 'tags', 'pipeline_tag', 'trendingScore', 'gated', 'createdAt', 'lastModified']);
  return `https://huggingface.co/api/models?${params}`;
};

export const buildDatasetsUrl = (filters) => {
  const params = new URLSearchParams({
    sort: MODEL_SORT[filters.rank] || MODEL_SORT.trending,
    direction: '-1',
    limit: '24',
  });
  if (filters.task !== 'all') params.append('filter', `task_categories:${filters.task}`);
  if (DATASET_SIZE[filters.size]) params.append('filter', `size_categories:${DATASET_SIZE[filters.size]}`);
  if (filters.extra.startsWith('language-')) params.append('filter', `language:${filters.extra.replace('language-', '')}`);
  if (filters.extra.startsWith('license-')) params.append('filter', filters.extra.replace('license-', 'license:'));
  if (filters.extra === 'official') params.append('filter', 'benchmark:official');
  appendExpand(params, ['downloads', 'likes', 'tags', 'trendingScore', 'createdAt', 'lastModified', 'description']);
  return `https://huggingface.co/api/datasets?${params}`;
};

export const buildCommunityPapersUrl = (filters, now = new Date()) => {
  const params = new URLSearchParams({
    sort: filters.sort === 'recent' ? 'publishedAt' : 'trending',
    limit: '24',
  });
  if (filters.time === 'day') params.set('date', dateKey(now));
  if (filters.time === 'week') params.set('week', isoWeek(now));
  if (filters.time === 'month') params.set('month', dateKey(now).slice(0, 7));
  return `https://huggingface.co/api/daily_papers?${params}`;
};

const arxivCategory = (topic) => {
  if (topic === 'cs.AI' || topic === 'cs.LG') return `cat:${topic}`;
  return '(cat:cs.AI OR cat:cs.LG)';
};

export const buildArxivUrl = (filters, now = new Date()) => {
  const clauses = [arxivCategory(filters.category || filters.topic)];
  const topic = filters.topic;
  if (TOPIC_TERMS[topic]?.length) {
    clauses.push(`(${TOPIC_TERMS[topic].map((term) => `all:${term}`).join(' OR ')})`);
  }
  clauses.push(`submittedDate:[${arxivDateKey(periodStart(filters.time, now))}0000 TO ${arxivDateKey(now)}2359]`);
  const params = new URLSearchParams({
    search_query: clauses.join(' AND '),
    start: '0',
    max_results: '24',
    sortBy: filters.sort === 'relevance' ? 'relevance' : 'submittedDate',
    sortOrder: 'descending',
  });
  return `https://export.arxiv.org/api/query?${params}`;
};

export const matchesTopic = (card, topic) => {
  const terms = TOPIC_TERMS[topic] || [];
  if (!terms.length) return true;
  const haystack = `${card.title} ${card.summary} ${(card.tags || []).join(' ')}`.toLowerCase();
  return terms.some((term) => haystack.includes(term.toLowerCase()));
};

export const validateSourceUrl = (value, source) => {
  try {
    const url = new URL(value);
    const allowedHosts = SOURCE_HOSTS[source];
    if (url.protocol !== 'https:' || url.username || url.password || !allowedHosts?.has(url.hostname)) return '';
    return url.href.replace(/\/$/, '');
  } catch {
    return '';
  }
};
