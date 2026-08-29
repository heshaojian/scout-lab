export const shouldOpenInBackground = (event, preference) => (
  preference === 'background'
  && event.button === 0
  && !event.metaKey
  && !event.ctrlKey
  && !event.shiftKey
  && !event.altKey
);

export const openInBackground = async (url, {
  tabsApi = globalThis.chrome?.tabs,
  fallback = (value) => globalThis.open?.(value, '_blank', 'noopener,noreferrer'),
} = {}) => {
  try {
    if (!tabsApi?.create) throw new Error('Chrome tabs API unavailable');
    await tabsApi.create({ url, active: false });
  } catch {
    fallback(url);
  }
};
