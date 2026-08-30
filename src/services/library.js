import { validateSourceUrl } from './query.js';

const MAX_TAGS = 12;
const MAX_FACTS = 12;
const MAX_LINKS = 6;
const MAX_VARIANTS = 12;

const text = (value, max = 10_000) => typeof value === 'string' ? value.slice(0, max) : '';
const simpleRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value)
    .filter(([, entry]) => ['string', 'number', 'boolean'].includes(typeof entry))
    .map(([key, entry]) => [text(key, 100), typeof entry === 'string' ? text(entry, 2_000) : entry]))
  : {};

const safeLinks = (links, source, limit) => (Array.isArray(links) ? links : [])
  .slice(0, limit)
  .map((link) => {
    const linkSource = text(link?.source, 50) || source;
    const url = validateSourceUrl(link?.url, linkSource);
    return url ? {
      id: text(link?.id, 200),
      label: text(link?.label, 200),
      title: text(link?.title, 500),
      source: linkSource,
      url,
    } : null;
  })
  .filter(Boolean);

export const isLibraryMember = (entry = {}) => (
  entry.favorite === true || (typeof entry.comment === 'string' && entry.comment.trim().length > 0)
);

export const createLibraryCard = (card = {}) => {
  const source = text(card.source, 50);
  const url = validateSourceUrl(card.url, source);
  if (!text(card.id, 500) || !text(card.title, 1_000) || !url) return null;

  return {
    id: text(card.id, 500),
    source,
    section: text(card.section, 50),
    type: text(card.type, 100),
    title: text(card.title, 1_000),
    url,
    summary: text(card.summary, 10_000),
    tags: (Array.isArray(card.tags) ? card.tags : []).slice(0, MAX_TAGS).map((tag) => text(tag, 200)),
    metricLabel: text(card.metricLabel, 300),
    metricValue: text(card.metricValue, 300),
    metrics: (Array.isArray(card.metrics) ? card.metrics : []).slice(0, MAX_FACTS).map(simpleRecord),
    facts: (Array.isArray(card.facts) ? card.facts : []).slice(0, MAX_FACTS).map(simpleRecord),
    secondary: simpleRecord(card.secondary),
    owner: text(card.owner, 500),
    publishedAt: text(card.publishedAt, 200),
    openLabel: text(card.openLabel, 200),
    summaryLabel: text(card.summaryLabel, 200),
    links: safeLinks(card.links, source, MAX_LINKS),
    relatedVariants: safeLinks(card.relatedVariants, 'huggingface', MAX_VARIANTS),
  };
};

export const updateLibraryAnnotation = (current = {}, patch = {}, card, now = new Date()) => {
  const updatedAt = now.toISOString();
  const merged = { ...current, ...patch, updatedAt };
  if (!isLibraryMember(merged)) {
    const { libraryCard, savedAt, ...annotation } = merged;
    return annotation;
  }

  const libraryCard = card ? createLibraryCard(card) : current.libraryCard;
  return {
    ...merged,
    ...(libraryCard ? { libraryCard } : {}),
    savedAt: current.savedAt || updatedAt,
  };
};

const normalized = (value) => `${value || ''}`.toLowerCase();
const timestamp = (value) => Number.isNaN(Date.parse(value)) ? 0 : Date.parse(value);

export const getLibraryCards = (userState = {}, filters = {}) => Object.values(userState)
  .filter((entry) => isLibraryMember(entry) && entry.libraryCard)
  .filter((entry) => filters.view !== 'favorites' || entry.favorite === true)
  .filter((entry) => filters.view !== 'notes' || Boolean(entry.comment?.trim()))
  .filter((entry) => filters.type === 'all' || normalized(entry.libraryCard.type) === normalized(filters.type))
  .filter((entry) => filters.source === 'all' || entry.libraryCard.source === filters.source)
  .sort((left, right) => {
    if (filters.sort === 'title') return left.libraryCard.title.localeCompare(right.libraryCard.title);
    if (filters.sort === 'saved') return timestamp(right.savedAt) - timestamp(left.savedAt);
    return timestamp(right.updatedAt) - timestamp(left.updatedAt);
  })
  .map((entry) => ({ ...entry.libraryCard }));

export const backfillLibraryAnnotations = (userState = {}, snapshots = {}) => {
  const newestCards = Object.keys(snapshots).sort().reverse().flatMap((date) => (
    Object.values(snapshots[date]?.sections || {}).flatMap((section) => section?.cards || [])
  )).reduce((cards, card) => (
    card?.id && !cards.has(card.id) ? new Map([...cards, [card.id, card]]) : cards
  ), new Map());

  return Object.fromEntries(Object.entries(userState).map(([id, entry]) => {
    if (!isLibraryMember(entry) || entry.libraryCard || !newestCards.has(id)) return [id, { ...entry }];
    const libraryCard = createLibraryCard(newestCards.get(id));
    return [id, libraryCard ? {
      ...entry,
      savedAt: entry.savedAt || entry.updatedAt,
      libraryCard,
    } : { ...entry }];
  }));
};
