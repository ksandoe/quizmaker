declare module 'youtube-transcript-api' {
  interface TranscriptConfig {
    lang?: string;
  }

  interface TranscriptItem {
    text: string;
    offset: number;
    duration: number;
  }

  function getTranscript(videoId: string): Promise<TranscriptItem[]>;

  export default {
    getTranscript
  };
}
