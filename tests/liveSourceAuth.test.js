import { describe, expect, it } from 'vitest';

import { buildGithubHeaders } from '../scripts/live-source-auth.mjs';

describe('buildGithubHeaders', () => {
  it('uses public GitHub API headers when no token is available', () => {
    expect(buildGithubHeaders()).toEqual({
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Scout-Lab-Contract-Test',
    });
  });

  it('adds a bearer token without changing the public headers', () => {
    expect(buildGithubHeaders('workflow-token')).toEqual({
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Scout-Lab-Contract-Test',
      Authorization: 'Bearer workflow-token',
    });
  });

  it('ignores blank token values', () => {
    expect(buildGithubHeaders('   ')).not.toHaveProperty('Authorization');
  });
});
