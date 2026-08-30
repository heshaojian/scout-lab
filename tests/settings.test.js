import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PREFERENCES,
  isValidTodayMix,
  normalizePreferences,
  normalizeSettings,
  resolveStartupSection,
} from '../src/settings.js';

describe('settings schema', () => {
  it('migrates version-one state without losing the selected section or current filters', () => {
    const settings = normalizeSettings({
      selectedSection: 'models',
      selectedTopic: 'rag',
      filters: { code: { language: 'python' } },
    });

    expect(settings.version).toBe(3);
    expect(settings.selectedSection).toBe('models');
    expect(settings.filters.code).toEqual({ time: 'day', spokenLanguage: 'all', language: 'python' });
    expect(settings.filters.models.topic).toBe('rag');
    expect(settings.filterDefaults.code.language).toBe('all');
    expect(settings.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it('migrates the former Models newest sort and adds balanced defaults', () => {
    const settings = normalizeSettings({
      selectedSection: 'models',
      filters: { models: { rank: 'newest', task: 'text-generation', access: 'gated' } },
    });

    expect(settings.filters.models).toMatchObject({
      rank: 'created', task: 'text-generation', size: 'any', baseOnly: 'off', inference: 'off',
      library: 'all', license: 'all', access: 'gated', app: 'all', updated: 'all', topic: 'all',
    });
  });

  it('falls back malformed preferences independently', () => {
    const preferences = normalizePreferences({
      theme: 'dark',
      density: 'tiny',
      startupSection: 'papers',
      openLinks: 'elsewhere',
      todayMix: { code: 4, models: 0, datasets: 0, papers: 0 },
    });

    expect(preferences).toEqual({
      theme: 'dark',
      density: 'comfortable',
      startupSection: 'papers',
      openLinks: 'foreground',
      todayMix: { code: 4, models: 0, datasets: 0, papers: 0 },
    });
  });

  it('validates Today lane ranges and combined totals', () => {
    expect(isValidTodayMix({ code: 4, models: 4, datasets: 0, papers: 4 })).toBe(true);
    expect(isValidTodayMix({ code: 0, models: 0, datasets: 0, papers: 0 })).toBe(false);
    expect(isValidTodayMix({ code: 5, models: 0, datasets: 0, papers: 0 })).toBe(false);
    expect(isValidTodayMix({ code: 4, models: 4, datasets: 4, papers: 1 })).toBe(false);
  });

  it('resolves Last used separately from fixed startup workbenches', () => {
    expect(resolveStartupSection(normalizeSettings({ selectedSection: 'datasets' }))).toBe('datasets');
    expect(resolveStartupSection(normalizeSettings({
      selectedSection: 'datasets',
      preferences: { startupSection: 'today' },
    }))).toBe('today');
  });
});
