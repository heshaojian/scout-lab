import { beforeEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve(process.cwd(), 'src/theme-init.js'), 'utf8');

const runThemeInit = () => window.eval(source);

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.textSize;
});

describe('pre-render appearance', () => {
  it('uses Large text before application boot when no preference exists', () => {
    runThemeInit();
    expect(document.documentElement.dataset.textSize).toBe('large');
  });

  it('restores stored Standard text before application boot', () => {
    localStorage.setItem('scout-lab:settings', JSON.stringify({
      preferences: { textSize: 'standard' },
    }));
    runThemeInit();
    expect(document.documentElement.dataset.textSize).toBe('standard');
  });
});
