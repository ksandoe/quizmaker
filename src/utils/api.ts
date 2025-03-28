const API_URL = import.meta.env.VITE_API_URL;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

if (!API_URL) {
  throw new Error('API_URL environment variable is not set');
}

export interface VideoDetails {
  video_id: string;
  title: string;
  transcript: string;
}

export interface JobStatus {
  job_id: string;
  status: 'downloading' | 'transcribing' | 'calculating' | 'waiting' | 'segmenting' | 'generating' | 'completed' | 'failed';
  error?: string;
  video_id?: string;
  max_segments?: number;
}

export async function startTranscription(url: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/transcript/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start transcription');
  }

  const { data } = await response.json();
  if (!data || !data.job_id) {
    throw new Error('Invalid response from server');
  }

  return data;
}

export async function getTranscriptionStatus(job_id: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/transcript/status/${job_id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get transcription status');
  }

  const { data } = await response.json();
  if (!data) {
    throw new Error('Invalid response from server');
  }

  return data;
}

export async function setSegmentCount(job_id: string, num_segments: number): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/transcript/segments/${job_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ num_segments }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set segment count');
  }

  const { data } = await response.json();
  if (!data) {
    throw new Error('Invalid response from server');
  }

  return data;
}

export function extractVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (!match) {
    throw new Error('Invalid YouTube URL');
  }
  return match[1];
}

export async function getVideoDetails(url: string, access_token: string | null = null): Promise<VideoDetails> {
  const video_id = extractVideoId(url);
  
  const params = new URLSearchParams({
    part: 'snippet',
    id: video_id,
    key: YOUTUBE_API_KEY,
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (access_token) {
    headers.Authorization = `Bearer ${access_token}`;
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video details');
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  return {
    video_id: video.id,
    title: video.snippet.title,
    transcript: '',
  };
}
