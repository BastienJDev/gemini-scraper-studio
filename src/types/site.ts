export interface Site {
  CATEGORIES: string;
  NAME: string;
  URL: string;
}

export interface ScrapedData {
  title: string;
  description: string;
  content: string;
  url: string;
  siteName?: string;
}
