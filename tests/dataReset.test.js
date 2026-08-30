import { describe, expect, it, vi } from 'vitest';

import {
  DATA_SCHEMA_KEY,
  DATA_SCHEMA_VERSION,
  ensureCurrentDataSchema,
} from '../src/services/dataReset.js';

const storage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] || null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, `${value}`),
    removeItem: (key) => values.delete(key),
    values,
  };
};

describe('Learn-free development schema reset', () => {
  it('wipes every Scout Lab browser record and archive handle once', async () => {
    const local = storage({
      'scout-lab:settings': '{"selectedSection":"learn"}',
      'scout-lab:user-state': '{"learn:one":{"favorite":true}}',
      'scout-lab:note:2026-08-29': 'old note',
      'another-app:key': 'preserve',
    });
    const deleteArchiveDatabase = vi.fn().mockResolvedValue(undefined);

    await expect(ensureCurrentDataSchema({ storage: local, deleteArchiveDatabase })).resolves.toBe(true);

    expect(deleteArchiveDatabase).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(local.values)).toEqual({
      'another-app:key': 'preserve',
      [DATA_SCHEMA_KEY]: DATA_SCHEMA_VERSION,
    });

    await expect(ensureCurrentDataSchema({ storage: local, deleteArchiveDatabase })).resolves.toBe(false);
    expect(deleteArchiveDatabase).toHaveBeenCalledTimes(1);
  });

  it('does not mark a failed reset complete', async () => {
    const local = storage({ 'scout-lab:settings': '{}' });
    const deleteArchiveDatabase = vi.fn().mockRejectedValue(new Error('blocked'));

    await expect(ensureCurrentDataSchema({ storage: local, deleteArchiveDatabase })).rejects.toThrow('blocked');
    expect(local.getItem(DATA_SCHEMA_KEY)).toBeNull();
  });
});
