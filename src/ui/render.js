import { validateSourceUrl } from '../services/query.js';

export const escapeHtml = (value = '') => `${value}`
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const actionButton = (label, action, icon, active = false) => `
  <button class="icon-button ${active ? 'active' : ''}" type="button" title="${label}" aria-label="${label}" data-action="${action}">${icon}</button>
`;

export const renderCard = (card, { user = {}, commentingId = null } = {}) => {
  const itemState = user[card.id] || card.user || {};
  const note = itemState.comment || '';
  const safeUrl = validateSourceUrl(card.url, card.source);
  const isCommenting = commentingId === card.id;
  const secondaryLinks = (card.links || []).map((link) => ({
    ...link,
    url: validateSourceUrl(link.url, link.source || card.source),
  })).filter(({ url }) => url).slice(0, 2);
  const relatedVariants = (card.relatedVariants || []).map((variant) => ({
    ...variant,
    url: validateSourceUrl(variant.url, 'huggingface'),
  })).filter(({ url }) => url);

  return `
    <article class="card" data-id="${escapeHtml(card.id)}" data-type="${escapeHtml(card.type)}">
      <div class="card-head">
        <span class="badge ${escapeHtml(card.type.toLowerCase())}">${escapeHtml(card.type)}</span>
        <span class="metric" title="${escapeHtml(card.metricLabel || '')}">${escapeHtml(card.metricValue || 'Not specified')}</span>
      </div>
      <h3>${escapeHtml(card.title)}</h3>
      <p class="summary">${card.summaryLabel ? `<span class="summary-label">${escapeHtml(card.summaryLabel)}</span> ` : ''}${escapeHtml(card.summary)}</p>
      <div class="tags">${(card.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      ${(card.facts || []).length ? `<div class="card-facts">${card.facts.map((fact) => `<span><strong>${escapeHtml(fact.value)}</strong> ${escapeHtml(fact.label)}</span>`).join('')}</div>` : ''}
      ${relatedVariants.length ? `
        <details class="model-variants">
          <summary>${relatedVariants.length} related ${relatedVariants.length === 1 ? 'variant' : 'variants'}</summary>
          <div>${relatedVariants.map((variant) => `<a data-open-link href="${escapeHtml(variant.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(variant.title)}</a>`).join('')}</div>
        </details>
      ` : ''}
      ${isCommenting ? `
        <div class="comment-editor">
          <textarea data-comment-draft aria-label="Comment for ${escapeHtml(card.title)}">${escapeHtml(note)}</textarea>
          <div>
            <button class="mini-button" type="button" data-action="save-comment">Save note</button>
            <button class="mini-button quiet" type="button" data-action="cancel-comment">Cancel</button>
          </div>
        </div>
      ` : ''}
      ${note && !isCommenting ? `<div class="comment-preview">${escapeHtml(note)}</div>` : ''}
      <div class="secondary">
        <span>${escapeHtml(card.secondary?.left || card.owner || 'Not specified')}</span>
        ${secondaryLinks.length
          ? `<span class="secondary-links">${secondaryLinks.map((link) => `<a class="secondary-link" data-open-link href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join('')}</span>`
          : `<span>${escapeHtml(card.secondary?.right || 'Not specified')}</span>`}
      </div>
      <div class="card-footer">
        <div class="card-actions">
          ${actionButton('Favorite', 'favorite', itemState.favorite ? '&#9733;' : '&#9734;', itemState.favorite)}
          ${actionButton(itemState.hidden ? 'Unhide' : 'Hide', 'hide', itemState.hidden ? '&#43;' : '&minus;')}
          ${actionButton('Comment', 'comment', '&#9998;', Boolean(note))}
        </div>
        ${safeUrl
          ? `<a class="open" data-open-link href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.openLabel || 'Open')} <span aria-hidden="true">&rarr;</span></a>`
          : '<span class="open disabled">Link unavailable</span>'}
      </div>
    </article>
  `;
};

const renderSegment = (control, value) => `
  <div class="segment" role="group" aria-label="${escapeHtml(control.label)}">
    ${control.options.map((item) => `
      <button type="button" data-filter="${escapeHtml(control.id)}" data-value="${escapeHtml(item.value)}" aria-pressed="${item.value === value}" class="${item.value === value ? 'selected' : ''}">${escapeHtml(item.label)}</button>
    `).join('')}
  </div>
`;

const renderSelectOptions = (options, value) => options.map((item, index) => {
  const optionHtml = `<option value="${escapeHtml(item.value)}" ${item.value === value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`;
  if (!item.group) return optionHtml;

  const opensGroup = options[index - 1]?.group !== item.group;
  const closesGroup = options[index + 1]?.group !== item.group;
  return `${opensGroup ? `<optgroup label="${escapeHtml(item.group)}">` : ''}${optionHtml}${closesGroup ? '</optgroup>' : ''}`;
}).join('');

const renderSelect = (control, value) => `
  <label class="control-wrap">
    <span class="sr-only">${escapeHtml(control.label)}</span>
    <select class="control" data-filter="${escapeHtml(control.id)}" aria-label="${escapeHtml(control.label)}">
      ${renderSelectOptions(control.options, value)}
    </select>
  </label>
`;

const renderToggle = (control, value) => {
  const active = value === 'on';
  return `
    <button class="filter-toggle ${active ? 'active' : ''}" type="button" role="switch"
      aria-label="${escapeHtml(control.label)}" aria-checked="${active}"
      data-filter="${escapeHtml(control.id)}" data-value="${active ? 'off' : 'on'}">
      <span class="toggle-track" aria-hidden="true"><span></span></span>
      <span>${escapeHtml(control.label)}</span>
    </button>
  `;
};

const renderControl = (control, filters) => {
  if (control.type === 'segment') return renderSegment(control, filters[control.id]);
  if (control.type === 'toggle') return renderToggle(control, filters[control.id]);
  return renderSelect(control, filters[control.id]);
};

export const renderFilters = (workbench, filters) => {
  if (!workbench.controls.length) return '';
  const visible = workbench.controls.filter(({ placement }) => placement !== 'advanced');
  const advanced = workbench.controls.filter(({ placement }) => placement === 'advanced');
  const activeAdvanced = advanced.filter(({ id }) => filters[id] !== workbench.defaults[id]).length;
  return `
    ${visible.map((item) => renderControl(item, filters)).join('')}
    ${advanced.length ? `
      <details class="more-filters" ${activeAdvanced ? 'open' : ''}>
        <summary>More filters${activeAdvanced ? ` <span>${activeAdvanced} active</span>` : ''}</summary>
        <div class="advanced-controls">${advanced.map((item) => renderControl(item, filters)).join('')}</div>
      </details>
    ` : ''}
    <span class="filter-spacer"></span>
    ${workbench.id === 'today' ? '' : '<button class="reset" type="button" data-command="save-filter-default">Save as default</button>'}
    <button class="reset" type="button" data-command="reset-filters">Reset filters</button>
  `;
};

export const renderEmptyState = (filters, { clearTopic = false } = {}) => `
  <section class="empty-state">
    <strong>No items match these filters.</strong>
    <span>${escapeHtml(Object.entries(filters).map(([key, value]) => `${key}: ${value}`).join(' · '))}</span>
    ${clearTopic
      ? '<button class="mini-button" type="button" data-filter="topic" data-value="all">Clear AI topic</button>'
      : '<button class="mini-button" type="button" data-command="reset-filters">Reset filters</button>'}
  </section>
`;

export const renderLibraryEmptyState = () => `
  <section class="empty-state library-empty">
    <strong>Your Library is ready.</strong>
    <span>Favorite an item or add a note anywhere in Scout Lab to keep it here automatically.</span>
  </section>
`;

export const renderSourceUnavailable = ({ url }) => {
  const sourceUrl = validateSourceUrl(url, 'github');
  return `
    <section class="empty-state source-unavailable">
      <strong>GitHub Trending is unavailable</strong>
      <span>Scout Lab could not load the selected Trending page.</span>
      <div class="empty-actions">
        <button class="mini-button" type="button" data-command="refresh">Retry</button>
        ${sourceUrl ? `<a class="mini-button quiet" data-open-link href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Open GitHub Trending</a>` : ''}
      </div>
    </section>
  `;
};

export const updateSearchResults = (root, {
  gridHtml,
  countLabel,
  navCount,
}) => {
  const grid = root.querySelector('.grid');
  const feedCount = root.querySelector('.feed-count');
  const activeNavCount = root.querySelector('.nav [aria-current="page"] .count');

  if (grid) grid.innerHTML = gridHtml;
  if (feedCount) feedCount.textContent = countLabel;
  if (activeNavCount) activeNavCount.textContent = navCount;
};
