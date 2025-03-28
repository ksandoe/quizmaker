declare module 'youtube-caption-scraper' {
  interface SubtitleItem {
    text: string;
    duration: number;
    start: number;
  }

  class CaptionScraper {
    scrap(videoId: string, languageCode?: string, format?: string): Promise<SubtitleItem[]>;
  }

  export = CaptionScraper;
}
