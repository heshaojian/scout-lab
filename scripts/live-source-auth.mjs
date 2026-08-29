const publicGithubHeaders = Object.freeze({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Scout-Lab-Contract-Test',
});

export const buildGithubHeaders = (token = '') => {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  return normalizedToken
    ? { ...publicGithubHeaders, Authorization: `Bearer ${normalizedToken}` }
    : { ...publicGithubHeaders };
};
