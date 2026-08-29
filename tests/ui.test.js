import { describe, expect, it } from 'vitest';

import {
  renderCard,
  renderEmptyState,
  renderFilters,
  updateSearchResults,
} from '../src/ui/render.js';
import { WORKBENCHES } from '../src/workbenches.js';

const baseCard = {
  id: 'source:item',
  source: 'github',
  section: 'code',
  type: 'Code',
  title: 'Owner / repository',
  url: 'https://github.com/owner/repository',
  summary: 'A concise description.',
  tags: ['agents', 'tools'],
  metricValue: '+120 this week',
  secondary: { left: 'Python', right: '12.3k stars' },
  links: [],
};

describe('shared workbench renderer', () => {
  it('updates search results without replacing the focused search input', () => {
    document.body.innerHTML = `
      <main id="app">
        <input class="search" aria-label="Search this tab">
        <nav class="nav"><button aria-current="page"><span class="count">24</span></button></nav>
        <span class="feed-count">24 visible items</span>
        <section class="grid"><article>Old result</article></section>
      </main>
    `;
    const search = document.querySelector('.search');
    search.focus();

    updateSearchResults(document.querySelector('#app'), {
      gridHtml: '<article>Filtered result</article>',
      countLabel: '1 visible item',
      navCount: '1',
    });

    expect(document.activeElement).toBe(search);
    expect(document.querySelector('.grid').textContent).toContain('Filtered result');
    expect(document.querySelector('.feed-count').textContent).toBe('1 visible item');
    expect(document.querySelector('.nav .count').textContent).toBe('1');
  });

  it.each(['Code', 'Model', 'Dataset', 'Paper', 'Learn'])('uses identical card anatomy for %s', (type) => {
    const html = renderCard({ ...baseCard, type }, { user: {}, progress: {} });
    document.body.innerHTML = html;
    const card = document.querySelector('.card');

    expect(card.querySelector('.card-head')).toBeTruthy();
    expect(card.querySelector('h3')).toBeTruthy();
    expect(card.querySelector('.summary')).toBeTruthy();
    expect(card.querySelector('.tags')).toBeTruthy();
    expect(card.querySelector('.secondary')).toBeTruthy();
    expect(card.querySelector('.card-footer')).toBeTruthy();
    expect(card.querySelectorAll('[data-action]')).toHaveLength(3);
    expect(card.querySelector('a.open')?.href).toBe(baseCard.url);
  });

  it('escapes source content and rejects an unsafe open URL', () => {
    const html = renderCard({
      ...baseCard,
      title: '<img src=x onerror=alert(1)>',
      url: 'javascript:alert(1)',
    }, { user: {}, progress: {} });
    document.body.innerHTML = html;

    expect(document.querySelector('.card h3')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(document.querySelector('.card h3 img')).toBeNull();
    expect(document.querySelector('a.open')).toBeNull();
  });

  it('renders accessible source-specific filters without changing the grid', () => {
    const html = renderFilters(WORKBENCHES.code, WORKBENCHES.code.defaults);
    document.body.innerHTML = html;

    expect(document.querySelectorAll('.segment, .control')).toHaveLength(4);
    expect(document.querySelector('[aria-label="Mode"]')).toBeTruthy();
    expect(document.querySelector('[data-command="reset-filters"]')).toBeTruthy();
  });

  it('renders paper PDF links, comments, favorites, and learning progress in shared slots', () => {
    const paper = renderCard({
      ...baseCard,
      source: 'arxiv',
      type: 'Paper',
      url: 'https://arxiv.org/abs/2608.12345',
      links: [{ id: 'pdf', label: 'PDF', url: 'https://arxiv.org/pdf/2608.12345' }],
    }, { user: { 'source:item': { favorite: true, comment: 'Read methods.' } } });
    document.body.innerHTML = paper;
    expect(document.querySelector('.secondary-link')?.textContent).toBe('PDF');
    expect(document.querySelector('[data-action="favorite"]')?.classList.contains('active')).toBe(true);
    expect(document.querySelector('.comment-preview')?.textContent).toBe('Read methods.');

    document.body.innerHTML = renderCard({ ...baseCard, type: 'Learn', source: 'learn', url: 'https://huggingface.co/learn' }, {
      progress: { 'source:item': { status: 'done' } },
      commentingId: 'source:item',
    });
    expect(document.querySelector('[data-progress]')?.value).toBe('done');
    expect(document.querySelector('[data-comment-draft]')).toBeTruthy();
  });

  it('renders a resettable empty state with active restrictions', () => {
    document.body.innerHTML = renderEmptyState({ language: 'python', topic: 'agents' });
    expect(document.body.textContent).toContain('language: python');
    expect(document.querySelector('[data-command="reset-filters"]')).toBeTruthy();
  });
});
