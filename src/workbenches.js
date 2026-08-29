export const TOPICS = [
  { value: 'all', label: 'All topics' },
  { value: 'agents', label: 'Agents' },
  { value: 'llms', label: 'LLMs' },
  { value: 'rag', label: 'RAG' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'multimodal', label: 'Multimodal' },
];

const control = (id, label, options, type = 'select') => ({ id, label, options, type });

const option = (value, label) => ({ value, label });

export const WORKBENCHES = {
  today: {
    id: 'today',
    label: 'Today',
    title: "Today's queue",
    subtitle: 'A small cross-source queue using one consistent card design.',
    defaults: { topic: 'all' },
    controls: [control('topic', 'Topic', TOPICS)],
    cacheTtl: 30 * 60 * 1000,
  },
  code: {
    id: 'code',
    label: 'Code',
    title: 'Code',
    subtitle: 'GitHub repositories worth reading, running, or learning from.',
    defaults: { time: 'week', language: 'all', topic: 'all' },
    controls: [
      control('time', 'Time range', [
        option('day', 'Today'),
        option('week', 'This week'),
        option('month', 'This month'),
      ]),
      control('language', 'Language', [
        option('all', 'All languages'),
        option('python', 'Python'),
        option('typescript', 'TypeScript'),
        option('javascript', 'JavaScript'),
        option('jupyter-notebook', 'Jupyter Notebook'),
        option('rust', 'Rust'),
        option('go', 'Go'),
        option('c++', 'C++'),
        option('java', 'Java'),
      ]),
      control('topic', 'AI topic', TOPICS),
    ],
    cacheTtl: 30 * 60 * 1000,
  },
  models: {
    id: 'models',
    label: 'Models',
    title: 'Models',
    subtitle: 'Compare releases using Hugging Face source signals.',
    defaults: { rank: 'trending', task: 'all', size: 'any', access: 'all', topic: 'all' },
    controls: [
      control('rank', 'Rank', [
        option('trending', 'Trending'),
        option('newest', 'Newest'),
        option('downloads', 'Downloads'),
        option('likes', 'Likes'),
      ]),
      control('task', 'Task', [
        option('all', 'All tasks'),
        option('text-generation', 'Text generation'),
        option('image-text-to-text', 'Image-text-to-text'),
        option('text-to-image', 'Text-to-image'),
        option('feature-extraction', 'Feature extraction'),
        option('automatic-speech-recognition', 'Speech recognition'),
      ]),
      control('size', 'Parameter size', [
        option('any', 'Any size'),
        option('under-1b', '<1B'),
        option('1b-7b', '1B-7B'),
        option('7b-30b', '7B-30B'),
        option('30b-plus', '30B+'),
      ]),
      control('access', 'Access', [
        option('all', 'All access'),
        option('open', 'Open'),
        option('gated', 'Gated'),
      ]),
    ],
    cacheTtl: 60 * 60 * 1000,
  },
  datasets: {
    id: 'datasets',
    label: 'Datasets',
    title: 'Datasets',
    subtitle: 'See what people are training and evaluating against.',
    defaults: { rank: 'trending', task: 'all', size: 'any', extra: 'none', topic: 'all' },
    controls: [
      control('rank', 'Rank', [
        option('trending', 'Trending'),
        option('newest', 'Newest'),
        option('downloads', 'Downloads'),
        option('likes', 'Likes'),
      ]),
      control('task', 'Task', [
        option('all', 'All tasks'),
        option('text-generation', 'Text generation'),
        option('retrieval', 'Retrieval'),
        option('question-answering', 'Question answering'),
        option('classification', 'Classification'),
        option('image', 'Image'),
        option('audio', 'Audio'),
      ]),
      control('size', 'Dataset size', [
        option('any', 'Any size'),
        option('under-10k', '<10K'),
        option('10k-1m', '10K-1M'),
        option('1m-100m', '1M-100M'),
        option('100m-plus', '100M+'),
      ]),
      control('extra', 'More filters', [
        option('none', 'More filters'),
        option('language-en', 'English'),
        option('language-zh', 'Chinese'),
        option('license-apache-2.0', 'Apache-2.0'),
        option('official', 'Official benchmarks'),
      ]),
    ],
    cacheTtl: 60 * 60 * 1000,
  },
  papers: {
    id: 'papers',
    label: 'Papers',
    title: 'Papers',
    subtitle: 'Community attention and raw arXiv research in one card grid.',
    defaults: { source: 'community', time: 'week', topic: 'all', sort: 'trending' },
    controls: [
      control('source', 'Source', [
        option('community', 'Community'),
        option('arxiv', 'Raw arXiv'),
      ], 'segment'),
      control('time', 'Time range', [
        option('day', 'Today'),
        option('week', 'This week'),
        option('month', 'This month'),
      ]),
      control('topic', 'Topic or category', [
        ...TOPICS,
        option('cs.AI', 'cs.AI'),
        option('cs.LG', 'cs.LG'),
      ]),
      control('sort', 'Sort', [
        option('trending', 'Trending'),
        option('recent', 'Recent'),
        option('newest', 'Newest'),
        option('relevance', 'Relevance'),
      ]),
    ],
    cacheTtl: 24 * 60 * 60 * 1000,
  },
  learn: {
    id: 'learn',
    label: 'Learn',
    title: 'Learn',
    subtitle: 'A maintained syllabus with progress and a clear next step.',
    defaults: { focus: 'all', format: 'all', progress: 'all', topic: 'all' },
    controls: [
      control('focus', 'Focus area', [option('all', 'All focus areas'), option('fundamentals', 'Fundamentals'), ...TOPICS.slice(1)]),
      control('format', 'Format', [
        option('all', 'All formats'),
        option('course', 'Course'),
        option('cookbook', 'Cookbook'),
        option('exercise', 'Exercise'),
      ]),
      control('progress', 'Progress', [
        option('all', 'All progress'),
        option('not-started', 'Not started'),
        option('in-progress', 'In progress'),
        option('done', 'Done'),
      ]),
    ],
    cacheTtl: Infinity,
  },
};

export const SECTION_ORDER = Object.keys(WORKBENCHES);

export const createDefaultFilters = () => Object.fromEntries(
  SECTION_ORDER.map((id) => [id, { ...WORKBENCHES[id].defaults }]),
);

export const getWorkbench = (id) => WORKBENCHES[id] || WORKBENCHES.today;

export const normalizeWorkbenchFilters = (id, values = {}) => {
  const workbench = getWorkbench(id);
  const allowedByControl = Object.fromEntries(workbench.controls.map((item) => [
    item.id,
    new Set(item.options.map(({ value }) => value)),
  ]));

  return Object.fromEntries(Object.entries(workbench.defaults).map(([key, fallback]) => {
    if (!allowedByControl[key]) return [key, values[key] || fallback];
    return [key, allowedByControl[key].has(values[key]) ? values[key] : fallback];
  }));
};
