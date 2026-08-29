# Scout Lab Product Design

## Principle

Scout Lab should feel like a compact research bench, not a feed addiction machine. The interface should make it easy to pick one thing to learn, one thing to inspect, and one thing to save for later.

## First Screen

The first screen is the working product:

- a source switcher for Build, Models, Datasets, Papers, Research, and Learn
- a dense card grid optimized for scanning
- each card has a title, source, short summary, tags, and one signal metric
- no generic web search, image search, video search, maps, or bookmark sidebar

## Feed Shape

All feeds normalize into one card contract:

```ts
type FeedCard = {
  id: string;
  source: "github" | "huggingface" | "arxiv" | "learn";
  section: "build" | "models" | "datasets" | "papers" | "research" | "learn";
  title: string;
  url: string;
  summary: string;
  tags: string[];
  metricLabel?: string;
  metricValue?: string;
  publishedAt?: string;
};
```

## Sources

- GitHub: trending AI, LLM, agent, RAG, model, and tooling repositories
- Hugging Face: trending models, datasets, and papers
- arXiv: recent cs.AI and cs.LG entries, filtered by AI-learning keywords
- Learn: curated links from Hugging Face Learn, Hugging Face Cookbook, and foundational ML resources

## Removal Scope

Do not port unrelated legacy functionality:

- generic search engine tabs
- bookmark management
- image upload
- remote server sync
- Qiniu upload/token flows
- admin/login/server routes

## Verification

The extension should be verified by:

- building the Chrome extension bundle
- opening the new-tab surface locally
- confirming at least one live GitHub card with a nonzero signal metric
- confirming Hugging Face and arXiv fallback/error states do not break the page

