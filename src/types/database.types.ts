export interface Video {
  video_id: string;
  title: string;
  url: string;
  transcript: string | null;
  creator_id: string;
  status: string;
  error_message: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  max_segments: number | null;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  segment_id: string;
  video_id: string;
  content: string;
  word_count: number;
  creator_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  question_id: string;
  segment_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  creator_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Response {
  response_id: string;
  question_id: string;
  user_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  creator_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewVideo extends Omit<Video, 'video_id' | 'created_at' | 'updated_at'> {
  video_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewSegment extends Omit<Segment, 'segment_id' | 'created_at' | 'updated_at'> {
  segment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewQuestion extends Omit<Question, 'question_id' | 'created_at' | 'updated_at'> {
  question_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewResponse extends Omit<Response, 'response_id' | 'created_at' | 'updated_at'> {
  response_id?: string;
  created_at?: string;
  updated_at?: string;
}
