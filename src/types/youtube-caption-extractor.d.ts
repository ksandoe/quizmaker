declare module 'youtube-caption-extractor' {
  interface CaptionTrack {
    languageCode: string;
    name: string;
    url: string;
  }

  interface CaptionResponse {
    tracks: CaptionTrack[];
  }

  export function getAvailableCaptions(videoId: string): Promise<CaptionResponse>;
  export function getCaptionContent(url: string): Promise<string>;
}
