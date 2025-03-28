declare module 'youtube-dl-exec' {
  interface SubtitleInfo {
    url: string;
    ext: string;
  }

  interface YoutubeDlOutput {
    subtitles?: {
      en?: SubtitleInfo[];
    };
    automatic_captions?: {
      en?: SubtitleInfo[];
    };
  }

  type YoutubeDlOptions = {
    dumpSingleJson?: boolean;
    skipDownload?: boolean;
    writeSub?: boolean;
    writeAutoSub?: boolean;
    subLang?: string;
    subFormat?: string;
  };

  function youtubeDl(url: string, options?: YoutubeDlOptions): Promise<YoutubeDlOutput>;
  export = youtubeDl;
}
