import { getCache, setCache } from './storage.js';

export const DESCRIPTION_REVISION = 'source-descriptions-v1';
export const DESCRIPTION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const DESCRIPTION_LIMIT = 420;
const GITHUB_REPOSITORY_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}\/[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
const HUGGING_FACE_REPOSITORY_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}(?:\/[A-Za-z0-9][A-Za-z0-9._-]{0,95})?$/;
const pendingDescriptions = new Map();

const cleanText = (value = '') => `${value}`.replace(/\s+/g, ' ').trim();

const truncate = (value) => {
  if (value.length <= DESCRIPTION_LIMIT) return value;
  const candidate = value.slice(0, DESCRIPTION_LIMIT - 1);
  const boundary = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, boundary > 300 ? boundary : candidate.length).trimEnd()}…`;
};

const stripInlineMarkdown = (value) => {
  const withoutUnsafeBlocks = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)]\[[^\]]*]/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]+/g, '')
    .replace(/^\s*>\s?/gm, '');
  const document = new DOMParser().parseFromString(`<body>${withoutUnsafeBlocks}</body>`, 'text/html');
  return cleanText(document.body?.textContent || withoutUnsafeBlocks);
};

const isUsefulBlock = (block, cleaned) => {
  if (!cleaned || cleaned.length < 24) return false;
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length || lines.every((line) => /^#{1,6}\s|^[-*+]\s|^\d+\.\s|^\|/.test(line))) return false;
  if (/^(installation|install|usage|quick start|getting started|requirements|license|table of contents|documentation)\b[:.!]?$/i.test(cleaned)) {
    return false;
  }
  return true;
};

const usefulExcerpt = (blocks) => {
  for (const block of blocks) {
    const cleaned = stripInlineMarkdown(block);
    if (isUsefulBlock(block, cleaned)) return truncate(cleaned);
  }
  return '';
};

export const extractMarkdownExcerpt = (markdown = '') => {
  const withoutFrontMatter = `${markdown}`.replace(/^\uFEFF?---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '');
  const withoutCode = withoutFrontMatter.replace(/^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$/gm, '');
  const blocks = withoutCode.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
    .filter((block) => !/^\[[^\]]+]:\s*\S+/m.test(block));
  return usefulExcerpt(blocks);
};

export const extractGithubReadmeExcerpt = (html = '') => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const readme = document.querySelector('article.markdown-body') || document.querySelector('.markdown-body');
  if (!readme) return '';
  return usefulExcerpt([...readme.querySelectorAll('p')].map((paragraph) => paragraph.textContent || ''));
};

const descriptionQuery = (card) => ({
  section: 'source-description',
  source: card.source,
  id: card.id,
  revision: DESCRIPTION_REVISION,
});

const descriptionUrl = (card) => {
  const isValidId = card.source === 'github'
    ? GITHUB_REPOSITORY_ID.test(card.title)
    : HUGGING_FACE_REPOSITORY_ID.test(card.title);
  if (!isValidId) return '';
  const path = card.title.split('/').map(encodeURIComponent).join('/');
  if (card.source === 'github' && card.section === 'code') return `https://github.com/${path}`;
  if (card.source === 'huggingface' && card.section === 'models') {
    return `https://huggingface.co/${path}/raw/main/README.md`;
  }
  return '';
};

const fetchText = async (url, { fetcher, timeoutMs, deadlineSignal }) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, timeoutMs);
  deadlineSignal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetcher(url, {
      headers: { Accept: url.endsWith('.md') ? 'text/markdown,text/plain' : 'text/html' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    deadlineSignal?.removeEventListener('abort', abort);
  }
};

const readDescription = async (card, options) => {
  const query = descriptionQuery(card);
  const cached = getCache(query);
  if (cached) return cached.cards?.[0]?.summary || '';

  const key = JSON.stringify(query);
  if (pendingDescriptions.has(key)) return pendingDescriptions.get(key);

  const request = (async () => {
    const url = descriptionUrl(card);
    if (!url || options.deadlineSignal?.aborted) return '';
    const text = await fetchText(url, options);
    if (text === null) return '';
    const summary = card.source === 'github'
      ? extractGithubReadmeExcerpt(text)
      : extractMarkdownExcerpt(text);
    setCache(query, [{ summary }], DESCRIPTION_CACHE_TTL);
    return summary;
  })().finally(() => pendingDescriptions.delete(key));

  pendingDescriptions.set(key, request);
  return request;
};

const enrichLane = async (cards, lane, laneCount, options) => {
  const values = [];
  for (let index = lane; index < cards.length; index += laneCount) {
    if (options.deadlineSignal.aborted) break;
    values.push([index, await readDescription(cards[index], options)]);
  }
  return values;
};

export const enrichCardDescriptions = async (cards, {
  fetcher = fetch,
  concurrency = 4,
  timeoutMs = 5_000,
  deadlineMs = 8_000,
} = {}) => {
  const copies = cards.map((card) => ({ ...card, details: { ...(card.details || {}) } }));
  const candidates = copies.filter((card) => card.details.descriptionSource !== 'source').slice(0, 24);
  if (!candidates.length) return copies;

  const deadlineController = new AbortController();
  const deadline = setTimeout(() => deadlineController.abort(), deadlineMs);
  const laneCount = Math.max(1, Math.min(concurrency, candidates.length));
  try {
    const lanes = await Promise.all(Array.from({ length: laneCount }, (_, lane) => enrichLane(candidates, lane, laneCount, {
      fetcher,
      timeoutMs,
      deadlineSignal: deadlineController.signal,
    })));
    const summaries = new Map(lanes.flat().map(([index, summary]) => [candidates[index].id, summary]));
    return copies.map((card) => {
      const summary = summaries.get(card.id);
      return summary
        ? { ...card, summary, details: { ...card.details, descriptionSource: 'readme' } }
        : card;
    });
  } finally {
    clearTimeout(deadline);
    deadlineController.abort();
  }
};
