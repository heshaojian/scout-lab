import { createDefaultFilters, normalizeWorkbenchFilters, SECTION_ORDER } from '../workbenches.js';
import { stableSerialize } from './query.js';

const STORE_PREFIX = 'scout-lab';
const ONE_HOUR = 60 * 60 * 1000;

const safeParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const read = (key, fallback = null) => safeParse(localStorage.getItem(`${STORE_PREFIX}:${key}`), fallback);

const write = (key, value) => {
  localStorage.setItem(`${STORE_PREFIX}:${key}`, JSON.stringify(value));
  return value;
};

const remove = (key) => localStorage.removeItem(`${STORE_PREFIX}:${key}`);

const queryCacheKey = (query) => `cache:v4:${stableSerialize(query)}`;

const mergeFilters = (stored = {}, legacyTopic = 'all') => {
  const defaults = createDefaultFilters();
  return Object.fromEntries(SECTION_ORDER.map((id) => {
    const legacy = Object.hasOwn(defaults[id], 'topic') ? { topic: legacyTopic } : {};
    return [id, normalizeWorkbenchFilters(id, { ...defaults[id], ...legacy, ...(stored[id] || {}) })];
  }));
};

export const getCache = (query) => {
  const entry = read(queryCacheKey(query));
  if (!entry || !entry.expiresAt || Date.now() > entry.expiresAt) return null;
  return entry;
};

export const getStaleCache = (query) => read(queryCacheKey(query));

export const setCache = (query, cards, ttl = ONE_HOUR, metadata = {}) => write(queryCacheKey(query), {
  cards,
  ...metadata,
  expiresAt: Number.isFinite(ttl) ? Date.now() + ttl : Number.MAX_SAFE_INTEGER,
  savedAt: new Date().toISOString(),
});

export const removeCache = (query) => remove(queryCacheKey(query));

export const getUserState = () => read('user-state', {});

export const setUserItemState = (itemId, patch) => {
  const current = getUserState();
  const next = {
    ...current,
    [itemId]: {
      ...(current[itemId] || {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
  return write('user-state', next);
};

export const getLearnProgress = () => read('learn-progress', {});

export const setLearnProgress = (itemId, status) => {
  const current = getLearnProgress();
  return write('learn-progress', {
    ...current,
    [itemId]: { status, updatedAt: new Date().toISOString() },
  });
};

export const getDailyNote = (dateKey) => read(`note:${dateKey}`, '');
export const setDailyNote = (dateKey, note) => write(`note:${dateKey}`, note);
export const getSnapshot = (dateKey) => read(`snapshot:${dateKey}`, null);
export const setSnapshot = (dateKey, snapshot) => write(`snapshot:${dateKey}`, snapshot);

export const getSettings = () => {
  const stored = read('settings', {});
  return {
    ...stored,
    selectedSection: SECTION_ORDER.includes(stored.selectedSection) ? stored.selectedSection : 'today',
    filters: mergeFilters(stored.filters, stored.selectedTopic || 'all'),
  };
};

export const setSettings = (patch) => {
  const current = getSettings();
  return write('settings', {
    ...current,
    ...patch,
    filters: patch.filters ? mergeFilters({ ...current.filters, ...patch.filters }) : current.filters,
  });
};

export const getWorkbenchFilters = (section) => ({ ...getSettings().filters[section] });

export const setWorkbenchFilters = (section, patch) => {
  const settings = getSettings();
  const next = normalizeWorkbenchFilters(section, { ...settings.filters[section], ...patch });
  setSettings({ filters: { ...settings.filters, [section]: next } });
  return { ...next };
};
