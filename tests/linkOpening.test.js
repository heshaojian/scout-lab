import { describe, expect, it, vi } from 'vitest';

import { openInBackground, shouldOpenInBackground } from '../src/services/linkOpening.js';

describe('link opening behavior', () => {
  it('intercepts only unmodified primary clicks in background mode', () => {
    expect(shouldOpenInBackground({ button: 0 }, 'background')).toBe(true);
    expect(shouldOpenInBackground({ button: 0, metaKey: true }, 'background')).toBe(false);
    expect(shouldOpenInBackground({ button: 1 }, 'background')).toBe(false);
    expect(shouldOpenInBackground({ button: 0 }, 'foreground')).toBe(false);
  });

  it('creates an inactive Chrome tab when the tabs API is available', async () => {
    const create = vi.fn().mockResolvedValue({ id: 10 });
    const fallback = vi.fn();

    await openInBackground('https://github.com/openai', { tabsApi: { create }, fallback });

    expect(create).toHaveBeenCalledWith({ url: 'https://github.com/openai', active: false });
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back to a normal new tab when the Chrome API fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Unavailable'));
    const fallback = vi.fn();

    await openInBackground('https://huggingface.co/models', { tabsApi: { create }, fallback });

    expect(fallback).toHaveBeenCalledWith('https://huggingface.co/models');
  });
});
