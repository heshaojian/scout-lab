export const learningLinks = [
  {
    id: 'learn:hf-context-course',
    title: 'Hugging Face Context Course',
    url: 'https://huggingface.co/learn/context-course/en/unit0/introduction',
    summary: 'Build portable agent skills, MCP integrations, plugins, sub-agents, and a minimal agent loop.',
    tags: ['agents', 'context', 'hands-on'],
    format: 'course',
    level: 'Intermediate',
    effort: '6 units',
  },
  {
    id: 'learn:hf-agents-course',
    title: 'Hugging Face Agents Course',
    url: 'https://huggingface.co/learn/agents-course/en/unit0/introduction',
    summary: 'Study agent fundamentals, frameworks, agentic RAG, evaluation, and a final project.',
    tags: ['agents', 'rag', 'evaluation'],
    format: 'course',
    level: 'Intermediate',
    effort: '4 core units',
  },
  {
    id: 'learn:hf-llm-course',
    title: 'Hugging Face LLM Course',
    url: 'https://huggingface.co/learn/llm-course/en/chapter1/1',
    summary: 'A structured path through transformers, datasets, tokenizers, fine-tuning, and agents.',
    tags: ['llms', 'transformers', 'fine-tuning'],
    format: 'course',
    level: 'Foundational',
    effort: '12 chapters',
  },
  {
    id: 'learn:hf-cookbook',
    title: 'Hugging Face Open-Source AI Cookbook',
    url: 'https://huggingface.co/learn/cookbook/index',
    summary: 'Hands-on recipes for models, agents, datasets, evaluation, and deployment.',
    tags: ['agents', 'rag', 'evaluation', 'multimodal'],
    format: 'cookbook',
    level: 'Practical',
    effort: 'Recipe based',
  },
  {
    id: 'learn:google-ml-crash-course',
    title: 'Google Machine Learning Crash Course',
    url: 'https://developers.google.com/machine-learning/crash-course',
    summary: 'Foundational machine learning concepts with short lessons and practical exercises.',
    tags: ['fundamentals', 'ml', 'exercise'],
    format: 'exercise',
    level: 'Foundational',
    effort: '15 hours',
  },
];

const label = (value) => value.split('-').map((part) => `${part[0]?.toUpperCase() || ''}${part.slice(1)}`).join(' ');

export const getDailyLearningLink = (progress = {}) => (
  learningLinks.find((item) => progress[item.id]?.status === 'in-progress')
  || learningLinks.find((item) => progress[item.id]?.status !== 'done')
  || learningLinks[0]
);

export const getLearningCards = (filters = {}, progress = {}) => learningLinks
  .map((item) => {
    const status = progress[item.id]?.status || 'not-started';
    return {
      ...item,
      source: 'learn',
      section: 'learn',
      type: 'Learn',
      owner: item.url.includes('huggingface.co') ? 'Hugging Face' : 'Google',
      publishedAt: '',
      metricLabel: 'Progress',
      metricValue: label(status),
      metrics: [{ id: 'progress', label: 'Progress', value: status, meaning: 'Local learning progress' }],
      links: [],
      secondary: { left: label(item.format), right: `${item.level} · ${item.effort}` },
      details: { format: item.format, level: item.level, effort: item.effort, progress: status },
    };
  })
  .filter((card) => filters.focus === 'all' || card.tags.includes(filters.focus))
  .filter((card) => filters.format === 'all' || card.details.format === filters.format)
  .filter((card) => filters.progress === 'all' || card.details.progress === filters.progress)
  .sort((a, b) => {
    const order = { 'in-progress': 0, 'not-started': 1, done: 2 };
    return order[a.details.progress] - order[b.details.progress];
  });
