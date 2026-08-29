import { validateSourceUrl } from './query.js';

export const cleanText = (value = '') => `${value}`.replace(/\s+/g, ' ').trim();

export const compactNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not specified';
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace('.0', '')}m`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1).replace('.0', '')}k`;
  return `${number}`;
};

const numericText = (value = '') => Number(`${value}`.replace(/[^0-9]/g, '')) || 0;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not specified';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const metric = (id, label, value, meaning) => ({ id, label, value, meaning });

const baseCard = ({ id, source, section, type, title, url, summary, tags = [], owner = '', publishedAt = '' }) => ({
  id,
  source,
  section,
  type,
  title: cleanText(title),
  url: validateSourceUrl(url, source),
  summary: cleanText(summary) || 'No description provided.',
  tags: tags.map(cleanText).filter(Boolean).slice(0, 4),
  owner: cleanText(owner),
  publishedAt,
  metrics: [],
  links: [],
  details: {},
});

export const parseGithubTrending = (html, time = 'week') => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const timeLabel = { day: 'today', week: 'this week', month: 'this month' }[time] || 'this week';

  return [...document.querySelectorAll('article.Box-row')].map((article) => {
    const repositoryLink = [...article.querySelectorAll('h2 a')]
      .find((link) => /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(link.getAttribute('href') || ''));
    if (!repositoryLink) return null;

    const path = repositoryLink.getAttribute('href').replace(/^\//, '').replace(/\/$/, '');
    const description = article.querySelector('p')?.textContent || 'No description provided.';
    const language = cleanText(article.querySelector('[itemprop="programmingLanguage"]')?.textContent || 'Not specified');
    const starLink = article.querySelector(`a[href="/${path}/stargazers"]`);
    const forkLink = article.querySelector(`a[href="/${path}/forks"]`);
    const periodNode = [...article.querySelectorAll('span')].find((node) => /stars?\s+(today|this week|this month)/i.test(node.textContent || ''));
    const periodStars = numericText(periodNode?.textContent);
    const totalStars = numericText(starLink?.textContent);
    const forks = numericText(forkLink?.textContent);
    const card = baseCard({
      id: `github:${path}`,
      source: 'github',
      section: 'code',
      type: 'Code',
      title: path,
      url: `https://github.com/${path}`,
      summary: description,
      tags: [language, 'GitHub Trending'],
      owner: path.split('/')[0],
    });

    return {
      ...card,
      metricLabel: `Stars ${timeLabel}`,
      metricValue: `+${periodStars}`,
      metrics: [
        metric('period-stars', `Stars ${timeLabel}`, periodStars, `Stars shown by GitHub Trending for ${timeLabel}`),
        metric('total-stars', 'Total stars', totalStars, 'Cumulative GitHub stars'),
        metric('forks', 'Forks', forks, 'Cumulative GitHub forks'),
      ],
      secondary: { left: language, right: `${compactNumber(totalStars)} stars · ${compactNumber(forks)} forks` },
      details: { language, totalStars, forks, periodStars, time },
    };
  }).filter(Boolean);
};

export const normalizeGithubRepository = (repository, mode = 'rising') => {
  const title = cleanText(repository.full_name);
  const language = repository.language || 'Not specified';
  const totalStars = Number(repository.stargazers_count) || 0;
  const forks = Number(repository.forks_count) || 0;
  const date = mode === 'active' ? repository.pushed_at : repository.created_at;
  const card = baseCard({
    id: `github:${title}`,
    source: 'github',
    section: 'code',
    type: 'Code',
    title,
    url: repository.html_url,
    summary: repository.description,
    tags: [language, ...(repository.topics || [])],
    owner: repository.owner?.login,
    publishedAt: date,
  });

  return {
    ...card,
    metricLabel: 'Total stars',
    metricValue: `${compactNumber(totalStars)} stars`,
    metrics: [
      metric('total-stars', 'Total stars', totalStars, 'Cumulative GitHub stars'),
      metric('forks', 'Forks', forks, 'Cumulative GitHub forks'),
    ],
    secondary: { left: language, right: `${mode === 'active' ? 'Pushed' : 'Created'} ${formatDate(date)}` },
    details: { language, totalStars, forks, mode, createdAt: repository.created_at, pushedAt: repository.pushed_at },
  };
};

const tagValue = (tags, prefix) => tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length) || '';

export const normalizeModel = (model, rank = 'trending') => {
  const id = model.id || model.modelId;
  const tags = model.tags || [];
  const downloads = Number(model.downloads) || 0;
  const likes = Number(model.likes) || 0;
  const trending = Number(model.trendingScore) || 0;
  const primary = {
    trending: [`${compactNumber(trending)} trending`, 'Trending score', trending, 'Hugging Face trending signal'],
    newest: [`Created ${formatDate(model.createdAt)}`, 'Created', model.createdAt, 'Model creation date'],
    downloads: [`${compactNumber(downloads)} downloads`, 'Downloads', downloads, 'Cumulative Hugging Face downloads'],
    likes: [`${compactNumber(likes)} likes`, 'Likes', likes, 'Cumulative Hugging Face likes'],
  }[rank] || [`${compactNumber(trending)} trending`, 'Trending score', trending, 'Hugging Face trending signal'];
  const access = model.gated ? 'Gated' : 'Open';
  const pipeline = model.pipeline_tag || 'Task not specified';
  const card = baseCard({
    id: `hf-model:${id}`,
    source: 'huggingface',
    section: 'models',
    type: 'Model',
    title: id,
    url: `https://huggingface.co/${id}`,
    summary: `${pipeline.replaceAll('-', ' ')} model on Hugging Face.`,
    tags: [pipeline, tagValue(tags, 'license:'), ...tags.filter((tag) => !tag.includes(':'))],
    owner: id?.split('/')[0],
    publishedAt: model.createdAt || model.lastModified,
  });

  return {
    ...card,
    metricLabel: primary[1],
    metricValue: primary[0],
    metrics: [
      metric('trending', 'Trending score', trending, 'Hugging Face trending signal'),
      metric('downloads', 'Downloads', downloads, 'Cumulative Hugging Face downloads'),
      metric('likes', 'Likes', likes, 'Cumulative Hugging Face likes'),
    ],
    secondary: { left: pipeline.replaceAll('-', ' '), right: `${access} · ${compactNumber(downloads)} downloads` },
    details: { access, pipeline, license: tagValue(tags, 'license:'), createdAt: model.createdAt, lastModified: model.lastModified },
  };
};

export const normalizeDataset = (dataset, rank = 'trending') => {
  const tags = dataset.tags || [];
  const downloads = Number(dataset.downloads) || 0;
  const likes = Number(dataset.likes) || 0;
  const trending = Number(dataset.trendingScore) || 0;
  const primary = {
    trending: [`${compactNumber(trending)} trending`, 'Trending score', trending, 'Hugging Face trending signal'],
    newest: [`Updated ${formatDate(dataset.lastModified || dataset.createdAt)}`, 'Updated', dataset.lastModified, 'Dataset update date'],
    downloads: [`${compactNumber(downloads)} downloads`, 'Downloads', downloads, 'Cumulative Hugging Face downloads'],
    likes: [`${compactNumber(likes)} likes`, 'Likes', likes, 'Cumulative Hugging Face likes'],
  }[rank];
  const task = tagValue(tags, 'task_categories:') || tagValue(tags, 'task_ids:') || 'Task not specified';
  const size = tagValue(tags, 'size_categories:') || 'Not specified';
  const language = tagValue(tags, 'language:') || 'Not specified';
  const license = tagValue(tags, 'license:') || 'Not specified';
  const card = baseCard({
    id: `hf-dataset:${dataset.id}`,
    source: 'huggingface',
    section: 'datasets',
    type: 'Dataset',
    title: dataset.id,
    url: `https://huggingface.co/datasets/${dataset.id}`,
    summary: dataset.description || `${task.replaceAll('-', ' ')} dataset on Hugging Face.`,
    tags: [task, size, language, license],
    owner: dataset.id?.split('/')[0],
    publishedAt: dataset.lastModified || dataset.createdAt,
  });

  return {
    ...card,
    metricLabel: primary[1],
    metricValue: primary[0],
    metrics: [
      metric('trending', 'Trending score', trending, 'Hugging Face trending signal'),
      metric('downloads', 'Downloads', downloads, 'Cumulative Hugging Face downloads'),
      metric('likes', 'Likes', likes, 'Cumulative Hugging Face likes'),
    ],
    secondary: { left: task.replaceAll('-', ' '), right: `${size} · ${compactNumber(likes)} likes` },
    details: { task, size, language, license, createdAt: dataset.createdAt, lastModified: dataset.lastModified },
  };
};

export const normalizeCommunityPaper = (entry) => {
  const paper = entry.paper || entry;
  const id = paper.id || entry.id;
  const authors = (paper.authors || []).map((author) => author.name).filter(Boolean);
  const summary = paper.ai_summary || entry.ai_summary || paper.summary || entry.summary;
  const upvotes = Number(paper.upvotes ?? entry.upvotes) || 0;
  const comments = Number(entry.numComments ?? paper.numComments) || 0;
  const publishedAt = paper.publishedAt || entry.publishedAt;
  const card = baseCard({
    id: `hf-paper:${id}`,
    source: 'huggingface',
    section: 'papers',
    type: 'Paper',
    title: paper.title || entry.title,
    url: `https://huggingface.co/papers/${id}`,
    summary,
    tags: paper.ai_keywords || entry.ai_keywords || [],
    owner: authors.join(', '),
    publishedAt,
  });

  return {
    ...card,
    summaryLabel: paper.ai_summary || entry.ai_summary ? 'HF summary' : '',
    metricLabel: 'Community upvotes',
    metricValue: `${compactNumber(upvotes)} upvotes`,
    metrics: [
      metric('upvotes', 'Community upvotes', upvotes, 'Hugging Face Daily Papers upvotes'),
      metric('comments', 'Comments', comments, 'Hugging Face Daily Papers comments'),
    ],
    secondary: { left: `Published ${formatDate(publishedAt)}`, right: `${compactNumber(comments)} comments` },
    details: { authors, organization: paper.organization?.name || entry.organization?.name || '' },
  };
};

export const parseArxivFeed = (xml) => {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('arXiv returned invalid XML');

  return [...document.querySelectorAll('entry')].map((entry) => {
    const sourceId = cleanText(entry.querySelector('id')?.textContent);
    const id = sourceId.split('/').pop();
    const categories = [...entry.querySelectorAll('category')].map((node) => node.getAttribute('term')).filter(Boolean);
    const authors = [...entry.querySelectorAll('author > name')].map((node) => cleanText(node.textContent)).filter(Boolean);
    const pdf = [...entry.querySelectorAll('link')].find((link) => link.getAttribute('title') === 'pdf')?.getAttribute('href');
    const abstractUrl = `https://arxiv.org/abs/${id}`;
    const card = baseCard({
      id: `arxiv:${id}`,
      source: 'arxiv',
      section: 'papers',
      type: 'Paper',
      title: entry.querySelector('title')?.textContent,
      url: abstractUrl,
      summary: entry.querySelector('summary')?.textContent,
      tags: categories,
      owner: authors.join(', '),
      publishedAt: entry.querySelector('published')?.textContent,
    });

    return {
      ...card,
      metricLabel: 'Primary category',
      metricValue: categories[0] || 'arXiv',
      metrics: [metric('submitted', 'Submitted', card.publishedAt, 'arXiv submission date')],
      links: pdf && validateSourceUrl(pdf, 'arxiv')
        ? [{ id: 'pdf', label: 'PDF', url: validateSourceUrl(pdf, 'arxiv') }]
        : [],
      secondary: { left: authors.slice(0, 2).join(', ') || 'Authors not specified', right: `Submitted ${formatDate(card.publishedAt)}` },
      details: { authors, categories, updatedAt: entry.querySelector('updated')?.textContent || '' },
    };
  });
};
