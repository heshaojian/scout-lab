export const learningLinks = [
  {
    id: 'learn:hf-cookbook',
    title: 'Hugging Face Cookbook',
    url: 'https://huggingface.co/learn/cookbook/index',
    summary: 'Hands-on recipes for models, agents, datasets, evaluation, and deployment.',
    tags: ['hands-on', 'huggingface', 'recipes'],
    metricLabel: 'Format',
    metricValue: 'Cookbook',
  },
  {
    id: 'learn:hf-llm-course',
    title: 'Hugging Face LLM Course',
    url: 'https://huggingface.co/learn/llm-course/en/chapter1/1',
    summary: 'A structured path through transformers, datasets, tokenizers, fine-tuning, and agents.',
    tags: ['llm', 'course', 'transformers'],
    metricLabel: 'Format',
    metricValue: 'Course',
  },
  {
    id: 'learn:google-ml-crash-course',
    title: 'Google Machine Learning Crash Course',
    url: 'https://developers.google.com/machine-learning/crash-course',
    summary: 'Foundational machine learning concepts with short lessons and practical exercises.',
    tags: ['fundamentals', 'ml', 'course'],
    metricLabel: 'Format',
    metricValue: 'Course',
  },
];

export const getDailyLearningLink = () => {
  const day = Math.floor(Date.now() / 86400000);
  return learningLinks[day % learningLinks.length];
};

export const getLearningCards = () => learningLinks.map((item) => ({
  ...item,
  source: 'learn',
  section: 'learn',
  type: 'Learn',
}));

