export type Category =
  | "ia"
  | "programacion"
  | "arquitectura"
  | "herramientas"
  | "hardware"
  | "general";

export interface Source {
  name: string;
  url: string;
  category: Category;
  maxItems?: number;
}

export const SOURCES: Source[] = [
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage?points=150",
    category: "general",
    maxItems: 15,
  },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", category: "ia" },
  {
    name: "Google AI",
    url: "https://blog.google/technology/ai/rss/",
    category: "ia",
  },
  {
    name: "Hugging Face",
    url: "https://huggingface.co/blog/feed.xml",
    category: "ia",
  },
  {
    name: "Simon Willison",
    url: "https://simonwillison.net/atom/everything/",
    category: "ia",
    maxItems: 6,
  },
  {
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    category: "programacion",
  },
  {
    name: "Node.js",
    url: "https://nodejs.org/en/feed/blog.xml",
    category: "programacion",
  },
  {
    name: "TypeScript",
    url: "https://devblogs.microsoft.com/typescript/feed/",
    category: "programacion",
  },
  {
    name: "Laravel News",
    url: "https://feed.laravel-news.com/",
    category: "programacion",
    maxItems: 5,
  },
  {
    name: "InfoQ",
    url: "https://feed.infoq.com/",
    category: "arquitectura",
    maxItems: 8,
  },
  {
    name: "Martin Fowler",
    url: "https://martinfowler.com/feed.atom",
    category: "arquitectura",
  },
  {
    name: "The Changelog",
    url: "https://changelog.com/feed",
    category: "herramientas",
    maxItems: 5,
  },
  {
    name: "Tom's Hardware",
    url: "https://www.tomshardware.com/feeds/all",
    category: "hardware",
    maxItems: 8,
  },
  {
    name: "Xataka",
    url: "https://www.xataka.com/index.xml",
    category: "general",
    maxItems: 8,
  },
];
