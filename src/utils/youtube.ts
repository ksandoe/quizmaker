export function extractVideoId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[7].length === 11) {
    return match[7];
  }
  throw new Error('Invalid YouTube URL');
}

export function validateVideoLength(durationSeconds: number): void {
  const minDuration = 5 * 60; // 5 minutes
  const maxDuration = 45 * 60; // 45 minutes

  if (durationSeconds < minDuration) {
    throw new Error('Video must be at least 5 minutes long');
  }
  if (durationSeconds > maxDuration) {
    throw new Error('Video must be less than 45 minutes long');
  }
}

export function calculateSegmentLimits(durationSeconds: number): { min: number; max: number } {
  const minSegmentDuration = 180; // 3 minutes
  const maxSegments = Math.floor(durationSeconds / minSegmentDuration);
  return {
    min: 1,
    max: Math.max(1, maxSegments)
  };
}
