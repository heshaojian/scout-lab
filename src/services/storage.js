const STORE_PREFIX = 'scout-lab';
const ONE_HOUR = 60 * 60 * 1000;

const safeParse = (value, fallback = null) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const read = (key, fallback = null) => safeParse(localStorage.getItem(`${STORE_PREFIX}:${key}`), fallback);

const write = (key, value) => {
  localStorage.setItem(`${STORE_PREFIX}:${key}`, JSON.stringify(value));
  return value;
};

const cacheKey = (section, topic) => `cache:${section}:${topic}`;

export const getCache = (section, topic) => {
  const entry = read(cacheKey(section, topic));

  if (!entry || !entry.expiresAt || Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.cards;
};

export const setCache = (section, topic, cards, ttl = ONE_HOUR) => write(cacheKey(section, topic), {
  cards,
  expiresAt: Date.now() + ttl,
  savedAt: new Date().toISOString(),
});

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

export const getDailyNote = (dateKey) => read(`note:${dateKey}`, '');

export const setDailyNote = (dateKey, note) => write(`note:${dateKey}`, note);

export const getSnapshot = (dateKey) => read(`snapshot:${dateKey}`, null);

export const setSnapshot = (dateKey, snapshot) => write(`snapshot:${dateKey}`, snapshot);

export const getSettings = () => read('settings', {
  selectedSection: 'today',
  selectedTopic: 'all',
});

export const setSettings = (settings) => write('settings', {
  ...getSettings(),
  ...settings,
});

