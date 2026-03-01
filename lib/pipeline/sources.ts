export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "scrape";
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "mit-tech-review",
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    type: "rss",
  },
  {
    id: "arxiv-cs-ai",
    name: "ArXiv CS.AI",
    url: "https://rss.arxiv.org/rss/cs.AI",
    type: "rss",
  },
  {
    id: "the-verge-ai",
    name: "The Verge",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    type: "rss",
  },
  {
    id: "techcrunch-ai",
    name: "TechCrunch",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    type: "rss",
  },
  {
    id: "wired-ai",
    name: "Wired",
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
    type: "rss",
  },
  {
    id: "openai-blog",
    name: "OpenAI",
    url: "https://openai.com/blog/rss.xml",
    type: "rss",
  },
  {
    id: "ars-technica-ai",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    type: "rss",
  },
  {
    id: "huggingface-blog",
    name: "Hugging Face",
    url: "https://huggingface.co/blog/feed.xml",
    type: "rss",
  },
  {
    id: "deepmind-blog",
    name: "Google DeepMind",
    url: "https://deepmind.google/blog/rss.xml",
    type: "rss",
  },
  {
    id: "google-ai",
    name: "Google AI",
    url: "https://blog.google/technology/ai/rss/",
    type: "rss",
  },
  {
    id: "microsoft-research",
    name: "Microsoft Research",
    url: "https://www.microsoft.com/en-us/research/feed/",
    type: "rss",
  },
  {
    id: "nvidia-blog",
    name: "NVIDIA",
    url: "https://blogs.nvidia.com/feed/",
    type: "rss",
  },
];
