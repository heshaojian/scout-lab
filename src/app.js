import { connectArchiveFolder, getArchiveStatus, writeDailyArchive } from './services/archive.js';
import { buildDailyArchive } from './services/archiveFormat.js';
import { fetchSection } from './services/feeds.js';
import {
  getDailyNote,
  getLearnProgress,
  getSettings,
  getSnapshot,
  getUserState,
  setDailyNote,
  setLearnProgress,
  setSettings,
  setSnapshot,
  setUserItemState,
  setWorkbenchFilters,
} from './services/storage.js';
import {
  escapeHtml,
  renderCard,
  renderEmptyState,
  renderFilters,
  updateSearchResults,
} from './ui/render.js?v=0.2.1';
import { getWorkbench, SECTION_ORDER, TOPICS, WORKBENCHES } from './workbenches.js';

const todayKey = () => new Date().toISOString().slice(0, 10);
const app = document.querySelector('#app');
const settings = getSettings();

let state = {
  selectedSection: settings.selectedSection,
  filters: settings.filters,
  cards: [],
  userState: getUserState(),
  learnProgress: getLearnProgress(),
  archive: { connected: false, name: '' },
  loading: true,
  status: { label: 'Loading sources', stale: false },
  search: '',
  commentingId: null,
  notice: '',
  requestId: 0,
};

const setState = (patch) => {
  state = { ...state, ...patch };
  return state;
};

const activeWorkbench = () => {
  const workbench = getWorkbench(state.selectedSection);
  if (workbench.id !== 'papers') return workbench;

  const filters = state.filters.papers;
  const controls = workbench.controls.map((control) => {
    if (control.id === 'sort') {
      const options = filters.source === 'arxiv'
        ? control.options.filter(({ value }) => ['newest', 'relevance'].includes(value))
        : control.options.filter(({ value }) => ['trending', 'recent'].includes(value));
      return { ...control, options };
    }
    if (control.id === 'topic') {
      return {
        ...control,
        options: filters.source === 'arxiv'
          ? control.options
          : TOPICS,
      };
    }
    return control;
  });
  return { ...workbench, controls };
};

const applyUserState = (cards) => cards
  .map((card) => ({ ...card, user: state.userState[card.id] || {} }))
  .filter((card) => !card.user.hidden);

const visibleCards = () => {
  const cards = applyUserState(state.cards);
  const query = state.search.trim().toLowerCase();
  if (!query) return cards;
  return cards.filter((card) => `${card.title} ${card.summary} ${(card.tags || []).join(' ')} ${card.owner || ''}`
    .toLowerCase().includes(query));
};

const navHtml = () => SECTION_ORDER.map((id) => {
  const workbench = WORKBENCHES[id];
  const active = state.selectedSection === id;
  return `
    <button type="button" class="${active ? 'active' : ''}" data-section="${id}" aria-current="${active ? 'page' : 'false'}">
      <span class="nav-dot"></span>
      <span>${escapeHtml(workbench.label)}</span>
      <span class="count">${active && !state.loading ? visibleCards().length : ''}</span>
    </button>
  `;
}).join('');

const loadingCardsHtml = () => Array.from({ length: 8 }, (_, index) => `
  <article class="card skeleton-card" aria-hidden="true" data-skeleton="${index}">
    <div class="skeleton short"></div><div class="skeleton title"></div><div class="skeleton body"></div><div class="skeleton body"></div>
  </article>
`).join('');

const archiveLabel = () => state.archive.connected ? state.archive.name : 'Not connected';

const statusMessage = () => {
  if (state.loading && state.cards.length) return `Refreshing ${state.status.label || 'saved results'}`;
  if (state.loading) return `Loading ${activeWorkbench().label.toLowerCase()}`;
  if (state.status.message) return state.status.message;
  return state.status.label || 'Ready';
};

const cardsHtml = (filters, cards) => {
  if (cards.length) {
    return cards.slice(0, 24).map((card) => renderCard(card, {
      user: state.userState,
      progress: state.learnProgress,
      commentingId: state.commentingId,
    })).join('');
  }
  return state.loading ? loadingCardsHtml() : renderEmptyState(filters);
};

const visibleCountLabel = (cards) => (
  `${cards.length} visible ${cards.length === 1 ? 'item' : 'items'}${state.status.stale ? ' · cached or fallback' : ''}`
);

const renderSearchView = () => {
  const filters = state.filters[state.selectedSection];
  const cards = visibleCards();

  updateSearchResults(app, {
    gridHtml: cardsHtml(filters, cards),
    countLabel: visibleCountLabel(cards),
    navCount: state.loading ? '' : `${cards.length}`,
  });
};

const render = () => {
  const workbench = activeWorkbench();
  const filters = state.filters[state.selectedSection];
  const cards = visibleCards();
  const note = getDailyNote(todayKey());
  const grid = cardsHtml(filters, cards);

  app.innerHTML = `
    <div class="shell">
      <aside class="rail">
        <div class="brand">
          <div class="mark" aria-hidden="true">SL</div>
          <div><h1>Scout Lab</h1><p>AI learning new tab</p></div>
        </div>

        <section class="intention">
          <span class="kicker">Today</span>
          <strong>Inspect one signal, save one idea, write one note.</strong>
        </section>

        <nav class="nav" aria-label="Scout Lab sections">${navHtml()}</nav>

        <div class="archive-controls">
          <div class="archive-status"><span>iCloud archive</span><span>${escapeHtml(archiveLabel())}</span></div>
          <button class="ghost-button" type="button" data-command="connect-archive">${state.archive.connected ? 'Reconnect folder' : 'Choose folder'}</button>
          <button class="ghost-button" type="button" data-command="save-today">Save today</button>
        </div>
      </aside>

      <main class="main">
        <header class="header">
          <div><h2>${escapeHtml(workbench.title)}</h2><p>${escapeHtml(workbench.subtitle)}</p></div>
          <div class="tools">
            <input class="search" value="${escapeHtml(state.search)}" placeholder="Search this tab" aria-label="Search this tab">
            <button class="primary" type="button" data-command="refresh">Refresh</button>
          </div>
        </header>

        <section class="filters" aria-label="${escapeHtml(workbench.label)} filters">
          ${renderFilters(workbench, filters)}
        </section>

        <div class="feed-status" aria-live="polite">
          <span>${escapeHtml(statusMessage())}</span>
          <span class="feed-count">${visibleCountLabel(cards)}</span>
        </div>

        ${state.notice ? `<div class="notice" role="status">${escapeHtml(state.notice)}</div>` : ''}

        <section class="grid" aria-label="${escapeHtml(workbench.label)} results">${grid}</section>

        <section class="note-strip">
          <label>
            <span class="sr-only">Daily learning note</span>
            <textarea data-daily-note placeholder="Write one thing you learned or want to try today.">${escapeHtml(note)}</textarea>
          </label>
          <div class="archive-preview">
            <strong>${state.archive.connected ? 'Archive ready' : 'Archive not connected'}</strong><br>
            ${state.archive.connected
              ? `${escapeHtml(state.archive.name)} / ${todayKey().slice(0, 4)} / ${todayKey().slice(5, 7)} / ${todayKey()}.md`
              : 'Choose an iCloud Drive folder to save daily Markdown files.'}<br>
            Includes the queue, filters, favorites, hidden items, comments, and learning progress.
          </div>
        </section>
      </main>
    </div>
  `;
};

const snapshotResult = (section, filters, result) => {
  const date = todayKey();
  const current = getSnapshot(date) || { date, sections: {} };
  setSnapshot(date, {
    ...current,
    sections: {
      ...(current.sections || {}),
      [section]: {
        cards: result.cards,
        filters,
        status: result.status,
        savedAt: new Date().toISOString(),
      },
    },
  });
};

const load = async ({ force = false, clear = false } = {}) => {
  const requestId = state.requestId + 1;
  const section = state.selectedSection;
  const filters = { ...state.filters[section] };
  setState({ requestId, loading: true, cards: clear ? [] : state.cards, notice: '' });
  render();

  const result = await fetchSection(section, filters, {
    force,
    allFilters: state.filters,
    learnProgress: state.learnProgress,
  });
  if (state.requestId !== requestId) return;

  snapshotResult(section, filters, result);
  setState({
    cards: result.cards,
    loading: false,
    status: result.status,
    userState: getUserState(),
    learnProgress: getLearnProgress(),
  });
  render();
};

const updateFilters = async (patch) => {
  const section = state.selectedSection;
  const current = state.filters[section];
  let nextPatch = { ...patch };

  if (section === 'papers' && patch.source === 'arxiv') {
    nextPatch = { ...nextPatch, sort: 'newest' };
  }
  if (section === 'papers' && patch.source === 'community') {
    nextPatch = { ...nextPatch, sort: 'trending', topic: ['cs.AI', 'cs.LG'].includes(current.topic) ? 'all' : current.topic };
  }

  const nextFilters = setWorkbenchFilters(section, { ...current, ...nextPatch });
  const allFilters = { ...state.filters, [section]: nextFilters };
  setSettings({ selectedSection: section, filters: allFilters });
  setState({ filters: allFilters, search: '', commentingId: null });
  await load({ clear: true });
};

const updateItem = (id, patch) => {
  setUserItemState(id, patch);
  setState({ userState: getUserState() });
  render();
};

const archiveData = () => {
  const date = todayKey();
  const snapshot = getSnapshot(date) || { sections: {} };
  const sections = snapshot.sections || {};
  const allCards = Object.values(sections).flatMap((entry) => entry.cards || []);
  const uniqueCards = [...new Map(allCards.map((card) => [card.id, card])).values()];
  return buildDailyArchive({
    date,
    note: getDailyNote(date),
    todayCards: sections.today?.cards || (state.selectedSection === 'today' ? state.cards : []),
    allCards: uniqueCards.length ? uniqueCards : state.cards,
    userState: state.userState,
    filters: state.filters,
    learnProgress: state.learnProgress,
    sourceStatus: Object.fromEntries(Object.entries(sections).map(([section, entry]) => [section, entry.status || {}])),
  });
};

const handleCommand = async (command) => {
  if (command === 'refresh') {
    await load({ force: true });
    return;
  }
  if (command === 'reset-filters') {
    const defaults = getWorkbench(state.selectedSection).defaults;
    const next = setWorkbenchFilters(state.selectedSection, defaults);
    const filters = { ...state.filters, [state.selectedSection]: next };
    setState({ filters, search: '', commentingId: null });
    setSettings({ filters });
    await load({ clear: true });
    return;
  }
  if (command === 'connect-archive') {
    try {
      await connectArchiveFolder();
      setState({ archive: await getArchiveStatus(), notice: 'Archive folder connected.' });
    } catch (error) {
      setState({ notice: error.name === 'AbortError' ? 'Folder selection canceled.' : error.message });
    }
    render();
    return;
  }
  if (command === 'save-today') {
    try {
      const path = await writeDailyArchive(todayKey(), archiveData());
      setState({ notice: `Saved ${path}` });
    } catch (error) {
      setState({ notice: error.message });
    }
    render();
  }
};

const onClick = async (event) => {
  const sectionButton = event.target.closest('[data-section]');
  if (sectionButton) {
    const selectedSection = sectionButton.dataset.section;
    setSettings({ selectedSection });
    setState({ selectedSection, search: '', commentingId: null, cards: [], status: { label: 'Loading sources', stale: false } });
    await load({ clear: true });
    return;
  }

  const filterButton = event.target.closest('button[data-filter]');
  if (filterButton) {
    await updateFilters({ [filterButton.dataset.filter]: filterButton.dataset.value });
    return;
  }

  const command = event.target.closest('[data-command]')?.dataset.command;
  if (command) {
    await handleCommand(command);
    return;
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  const container = event.target.closest('[data-id]');
  const id = container?.dataset.id;
  if (!id) return;
  const current = state.userState[id] || {};

  if (action === 'favorite') updateItem(id, { favorite: !current.favorite });
  if (action === 'hide') updateItem(id, { hidden: true });
  if (action === 'comment') {
    setState({ commentingId: id });
    render();
    app.querySelector(`[data-id="${CSS.escape(id)}"] [data-comment-draft]`)?.focus();
  }
  if (action === 'save-comment') {
    const comment = container.querySelector('[data-comment-draft]')?.value.trim() || '';
    setState({ commentingId: null });
    updateItem(id, { comment });
  }
  if (action === 'cancel-comment') {
    setState({ commentingId: null });
    render();
  }
};

const onChange = async (event) => {
  if (event.target.matches('select[data-filter]')) {
    await updateFilters({ [event.target.dataset.filter]: event.target.value });
    return;
  }

  if (event.target.matches('[data-progress]')) {
    const id = event.target.dataset.id;
    const progress = event.target.value;
    if (!['not-started', 'in-progress', 'done'].includes(progress)) return;
    setLearnProgress(id, progress);
    setState({ learnProgress: getLearnProgress() });
    await load({ force: true });
  }
};

const onInput = (event) => {
  if (event.target.matches('.search')) {
    setState({ search: event.target.value });
    renderSearchView();
  }
  if (event.target.matches('[data-daily-note]')) {
    setDailyNote(todayKey(), event.target.value);
  }
};

const boot = async () => {
  app.addEventListener('click', onClick);
  app.addEventListener('change', onChange);
  app.addEventListener('input', onInput);
  setState({ archive: await getArchiveStatus() });

  const snapshot = getSnapshot(todayKey())?.sections?.[state.selectedSection];
  if (snapshot?.cards?.length) {
    setState({ cards: snapshot.cards, loading: false, status: { ...snapshot.status, label: snapshot.status?.label || 'Saved daily snapshot' } });
    render();
  }

  await load();
};

render();
boot();
