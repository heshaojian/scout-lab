import { connectArchiveFolder, getArchiveStatus, writeDailyArchive } from './services/archive.js';
import { fetchSection } from './services/feeds.js';
import { getDailyLearningLink } from './services/learnSources.js';
import {
  getDailyNote,
  getSettings,
  getSnapshot,
  getUserState,
  setDailyNote,
  setSettings,
  setSnapshot,
  setUserItemState,
} from './services/storage.js';

const sections = [
  { id: 'today', label: 'Today' },
  { id: 'code', label: 'Code' },
  { id: 'models', label: 'Models' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'papers', label: 'Papers' },
  { id: 'learn', label: 'Learn' },
];

const topics = [
  { id: 'all', label: 'All' },
  { id: 'agents', label: 'Agents' },
  { id: 'llms', label: 'LLMs' },
  { id: 'rag', label: 'RAG' },
  { id: 'eval', label: 'Eval' },
  { id: 'multimodal', label: 'Multimodal' },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const state = {
  ...getSettings(),
  cards: [],
  userState: getUserState(),
  archive: { connected: false, name: '' },
  loading: true,
  stale: false,
  filter: '',
  commentingId: null,
};

const app = document.querySelector('#app');

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const sourceClass = (type = '') => type.toLowerCase();

const applyUserState = (cards) => cards
  .map((card) => ({
    ...card,
    user: state.userState[card.id] || {},
  }))
  .filter((card) => !card.user.hidden);

const visibleCards = () => {
  const query = state.filter.trim().toLowerCase();
  const cards = applyUserState(state.cards);

  if (!query) return cards;

  return cards.filter((card) => `${card.title} ${card.summary} ${card.tags.join(' ')}`.toLowerCase().includes(query));
};

const featuredCard = () => visibleCards().find((card) => card.type !== 'Learn') || visibleCards()[0] || null;

const dailyPrompt = () => {
  const link = getDailyLearningLink();

  return {
    title: 'What can this teach me that I can reuse?',
    body: `Start with ${link.title}. Write one concrete pattern, failure mode, or question before you move on.`,
    url: link.url,
  };
};

const navHtml = () => sections.map((section) => `
  <button class="${state.selectedSection === section.id ? 'active' : ''}" data-section="${section.id}">
    <span class="dot"></span>
    <span>${section.label}</span>
    <span class="count">${section.id === state.selectedSection ? visibleCards().length : ''}</span>
  </button>
`).join('');

const topicHtml = () => topics.map((topic) => `
  <button class="${state.selectedTopic === topic.id ? 'selected' : ''}" data-topic="${topic.id}">${topic.label}</button>
`).join('');

const actionButton = (label, action, icon, active = false) => `
  <button class="icon-button ${active ? 'active' : ''}" title="${label}" aria-label="${label}" data-action="${action}">${icon}</button>
`;

const cardHtml = (card) => {
  const note = card.user?.comment || '';
  const isCommenting = state.commentingId === card.id;

  return `
    <article class="card" data-id="${escapeHtml(card.id)}">
      <div class="meta">
        <span class="badge ${sourceClass(card.type)}">${escapeHtml(card.type)}</span>
        <span class="metric">${escapeHtml(card.metricValue || card.metricLabel || '')}</span>
      </div>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.summary)}</p>
      <div class="tags">
        ${card.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ${isCommenting ? `
        <div class="comment-editor">
          <textarea data-comment-draft aria-label="Comment for ${escapeHtml(card.title)}">${escapeHtml(note)}</textarea>
          <div>
            <button class="mini-button" data-action="save-comment">Save note</button>
            <button class="mini-button quiet" data-action="cancel-comment">Cancel</button>
          </div>
        </div>
      ` : ''}
      ${note ? `<div class="comment-preview">${escapeHtml(note)}</div>` : ''}
      <div class="card-footer">
        <div class="small-actions">
          ${actionButton('Favorite', 'favorite', card.user?.favorite ? '★' : '☆', card.user?.favorite)}
          ${actionButton('Hide', 'hide', '−')}
          ${actionButton('Comment', 'comment', '✎', Boolean(note))}
        </div>
        <a class="open" href="${escapeHtml(card.url)}" target="_blank" rel="noreferrer">Open →</a>
      </div>
    </article>
  `;
};

const emptyHtml = () => `
  <section class="empty-state">
    <strong>No visible items here.</strong>
    <span>Try another topic lens or refresh the feed.</span>
  </section>
`;

const makeArchiveMarkdown = () => {
  const date = todayKey();
  const cards = visibleCards();
  const note = getDailyNote(date);
  const favoriteCards = applyUserState(state.cards).filter((card) => card.user.favorite);
  const hiddenCards = state.cards.filter((card) => state.userState[card.id]?.hidden);

  const cardLine = (card) => `- ${card.title}\n  - ${card.url}\n  - ${card.summary}`;
  const commentLine = (card) => state.userState[card.id]?.comment
    ? `- ${card.title}: ${state.userState[card.id].comment}`
    : '';

  return [
    `# Scout Lab - ${date}`,
    '',
    '## Daily Note',
    note || 'No note yet.',
    '',
    '## Today\'s Queue',
    ...cards.map(cardLine),
    '',
    '## Favorites',
    ...(favoriteCards.length ? favoriteCards.map(cardLine) : ['No favorites yet.']),
    '',
    '## Hidden Items',
    ...(hiddenCards.length ? hiddenCards.map(cardLine) : ['No hidden items.']),
    '',
    '## Comments',
    ...(state.cards.map(commentLine).filter(Boolean).length
      ? state.cards.map(commentLine).filter(Boolean)
      : ['No comments yet.']),
    '',
  ].join('\n');
};

const render = () => {
  const cards = visibleCards();
  const feature = featuredCard();
  const prompt = dailyPrompt();
  const date = todayKey();
  const note = getDailyNote(date);
  const archiveLabel = state.archive.connected ? state.archive.name : 'Not connected';

  app.innerHTML = `
    <div class="shell">
      <aside class="rail">
        <div class="brand">
          <div class="mark">SL</div>
          <div>
            <h1>Scout Lab</h1>
            <p>AI learning new tab</p>
          </div>
        </div>

        <section class="day">
          <div class="day-label">Today</div>
          <strong>Pick one item to inspect, one item to save, and one note to write.</strong>
        </section>

        <nav class="nav" aria-label="Sections">${navHtml()}</nav>

        <div class="icloud">
          <div class="status">
            <span>iCloud archive</span>
            <span>${escapeHtml(archiveLabel)}</span>
          </div>
          <button class="ghost-button" data-command="connect-archive">${state.archive.connected ? 'Reconnect folder' : 'Choose folder'}</button>
          <button class="ghost-button" data-command="save-today">Save today</button>
        </div>
      </aside>

      <main class="main">
        <div class="toolbar">
          <div class="topic-tabs" aria-label="Topic filters">${topicHtml()}</div>
          <div class="tools">
            <input class="search" value="${escapeHtml(state.filter)}" placeholder="Filter this page" aria-label="Filter this page">
            <button class="primary" data-command="refresh">Refresh</button>
          </div>
        </div>

        <section class="today-grid">
          <article class="feature">
            <div class="feature-head">
              <span class="eyebrow">Today's signal</span>
              <span class="signal">${feature ? `${escapeHtml(feature.type)} · ${escapeHtml(feature.metricValue || 'fresh')}` : 'Loading'}</span>
            </div>
            <div>
              <h2>${feature ? escapeHtml(feature.title) : 'Finding useful AI signals...'}</h2>
              <p>${feature ? escapeHtml(feature.summary) : 'Scout Lab is checking code, models, datasets, and papers.'}</p>
            </div>
            <div class="actions" ${feature ? `data-id="${escapeHtml(feature.id)}"` : ''}>
              ${feature ? actionButton('Favorite', 'favorite', feature.user?.favorite ? '★' : '☆', feature.user?.favorite) : ''}
              ${feature ? actionButton('Hide', 'hide', '−') : ''}
              ${feature ? actionButton('Comment', 'comment', '✎', Boolean(feature.user?.comment)) : ''}
              ${feature ? `<a class="open" href="${escapeHtml(feature.url)}" target="_blank" rel="noreferrer">Open source →</a>` : ''}
            </div>
          </article>

          <aside class="side-panel">
            <span class="eyebrow">Learning prompt</span>
            <div class="lesson-title">${escapeHtml(prompt.title)}</div>
            <p>${escapeHtml(prompt.body)}</p>
            <a class="ghost-button lesson-link" href="${escapeHtml(prompt.url)}" target="_blank" rel="noreferrer">Open lesson</a>
          </aside>
        </section>

        <section>
          <div class="content-head">
            <div>
              <h2>${state.selectedSection === 'today' ? 'Today\'s queue' : sections.find((section) => section.id === state.selectedSection)?.label}</h2>
              <p>${state.loading ? 'Loading fresh signals...' : `${cards.length} visible items across your current lens.`}</p>
            </div>
            <p>${state.stale ? 'Showing fallback or cached data' : 'Stored locally · ready for iCloud archive'}</p>
          </div>

          <div class="grid">
            ${cards.length ? cards.slice(0, 20).map(cardHtml).join('') : emptyHtml()}
          </div>
        </section>

        <section class="note-strip">
          <textarea aria-label="Daily learning note" placeholder="Write one thing you learned or want to try.">${escapeHtml(note)}</textarea>
          <div class="archive-preview">
            <strong>Archive preview</strong><br>
            ${state.archive.connected ? `${escapeHtml(state.archive.name)} / ${date.slice(0, 4)} / ${date.slice(5, 7)} / ${date}.md` : 'Choose an iCloud Drive folder to save daily Markdown files.'}<br>
            Includes favorites, hidden items, comments, and the daily queue.
          </div>
        </section>
      </main>
    </div>
  `;
};

const load = async (force = false) => {
  state.loading = true;
  state.cards = [];
  render();

  if (force) {
    localStorage.removeItem(`scout-lab:cache:${state.selectedSection}:${state.selectedTopic}`);
  }

  const result = await fetchSection(state.selectedSection, state.selectedTopic);
  state.cards = result.cards;
  state.loading = false;
  state.stale = result.stale;
  state.userState = getUserState();
  setSettings({
    selectedSection: state.selectedSection,
    selectedTopic: state.selectedTopic,
  });
  setSnapshot(todayKey(), {
    date: todayKey(),
    section: state.selectedSection,
    topic: state.selectedTopic,
    cards: state.cards,
    savedAt: new Date().toISOString(),
  });
  render();
};

const updateItem = (id, patch) => {
  setUserItemState(id, patch);
  state.userState = getUserState();
  render();
};

const onAction = async (event) => {
  const sectionButton = event.target.closest('[data-section]');
  const topicButton = event.target.closest('[data-topic]');
  const command = event.target.closest('[data-command]')?.dataset.command;
  const action = event.target.closest('[data-action]')?.dataset.action;

  if (sectionButton) {
    state.selectedSection = sectionButton.dataset.section;
    await load();
    return;
  }

  if (topicButton) {
    state.selectedTopic = topicButton.dataset.topic;
    await load();
    return;
  }

  if (command === 'refresh') {
    await load(true);
    return;
  }

  if (command === 'connect-archive') {
    try {
      await connectArchiveFolder();
      state.archive = await getArchiveStatus();
      render();
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }

  if (command === 'save-today') {
    try {
      const path = await writeDailyArchive(todayKey(), makeArchiveMarkdown());
      window.alert(`Saved ${path}`);
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }

  if (!action) return;

  const container = event.target.closest('[data-id]');
  const id = container?.dataset.id;
  if (!id) return;

  const current = state.userState[id] || {};

  if (action === 'favorite') {
    updateItem(id, { favorite: !current.favorite });
  }

  if (action === 'hide') {
    updateItem(id, { hidden: true });
  }

  if (action === 'comment') {
    state.commentingId = id;
    render();
  }

  if (action === 'save-comment') {
    const comment = container.querySelector('[data-comment-draft]')?.value || '';
    state.commentingId = null;
    updateItem(id, { comment: comment.trim() });
  }

  if (action === 'cancel-comment') {
    state.commentingId = null;
    render();
  }
};

const onInput = (event) => {
  if (event.target.matches('.search')) {
    state.filter = event.target.value;
    render();
  }

  if (event.target.matches('textarea')) {
    setDailyNote(todayKey(), event.target.value);
  }
};

const boot = async () => {
  app.addEventListener('click', onAction);
  app.addEventListener('input', onInput);
  state.archive = await getArchiveStatus();

  const snapshot = getSnapshot(todayKey());
  if (snapshot?.cards?.length) {
    state.cards = snapshot.cards;
    state.loading = false;
    render();
  }

  await load();
};

boot();
