const line = (value = '') => `${value}`.replace(/\r?\n/g, ' ').trim();

const cardLines = (card) => {
  const metrics = (card.metrics || []).map((item) => (
    `  - ${line(item.label)}: ${line(item.value)}${item.meaning ? ` (${line(item.meaning)})` : ''}`
  ));
  return [
    `- [${line(card.title)}](${card.url})`,
    `  - ${line(card.summary)}`,
    ...metrics,
  ];
};

const groupByType = (cards) => cards.reduce((groups, card) => ({
  ...groups,
  [card.type]: [...(groups[card.type] || []), card],
}), {});

const itemReference = (card) => `- [${line(card.title)}](${card.url})`;

export const buildDailyArchive = ({
  date,
  note = '',
  todayCards = [],
  allCards = [],
  userState = {},
  filters = {},
  sourceStatus = {},
}) => {
  const byType = groupByType(todayCards);
  const favorites = allCards.filter((card) => userState[card.id]?.favorite);
  const hidden = allCards.filter((card) => userState[card.id]?.hidden);
  const comments = allCards.filter((card) => userState[card.id]?.comment);

  const output = [
    `# Scout Lab - ${date}`,
    '',
    '## Daily Note',
    note || 'No note yet.',
    '',
    '## Today by Source',
  ];

  Object.entries(byType).forEach(([type, cards]) => {
    output.push('', `### ${type}`, ...cards.flatMap(cardLines));
  });
  if (!todayCards.length) output.push('No briefing items available.');

  output.push('', '## Favorites', ...(favorites.length ? favorites.map(itemReference) : ['No favorites yet.']));
  output.push('', '## Hidden Items', ...(hidden.length ? hidden.map(itemReference) : ['No hidden items.']));
  output.push('', '## Comments', ...(comments.length
    ? comments.map((card) => `- ${line(card.title)}: ${line(userState[card.id].comment)}`)
    : ['No comments yet.']));
  output.push('', '## Active Filters');
  Object.entries(filters).forEach(([section, values]) => {
    output.push(`### ${section}`);
    Object.entries(values).forEach(([key, value]) => output.push(`- ${line(key)}: ${line(value)}`));
  });
  output.push('', '## Source Status');
  Object.entries(sourceStatus).forEach(([section, status]) => {
    output.push(`- ${line(section)}: ${line(status.label || 'Unknown')}${status.stale ? ' (cached or fallback)' : ''}`);
  });
  if (!Object.keys(sourceStatus).length) output.push('No source status recorded.');

  return `${output.join('\n')}\n`;
};
