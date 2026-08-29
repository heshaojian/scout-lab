(() => {
  let theme = 'system';
  let density = 'comfortable';
  try {
    const stored = JSON.parse(localStorage.getItem('scout-lab:settings') || '{}');
    if (['system', 'light', 'dark'].includes(stored.preferences?.theme)) theme = stored.preferences.theme;
    if (['comfortable', 'compact'].includes(stored.preferences?.density)) density = stored.preferences.density;
  } catch {
    // Malformed preferences are normalized by the application after startup.
  }
  const resolved = theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeChoice = theme;
  document.documentElement.dataset.density = density;
  document.documentElement.style.colorScheme = resolved;
})();
