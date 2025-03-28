import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../utils/database.types';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create admin client with service key for auth operations
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// Row types (for reading)
export type Video = Database['public']['Tables']['videos']['Row'];
export type Segment = Database['public']['Tables']['segments']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Response = Database['public']['Tables']['responses']['Row'];

// Insert types (for writing)
export type NewVideo = Database['public']['Tables']['videos']['Insert'];
export type NewSegment = Database['public']['Tables']['segments']['Insert'];
export type NewQuestion = Database['public']['Tables']['questions']['Insert'];
export type NewResponse = Database['public']['Tables']['responses']['Insert'];

// Video functions
export async function createVideo(data: NewVideo): Promise<Video> {
  const { data: video, error } = await supabase
    .from('videos')
    .insert([data])
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating video:', error);
    throw error;
  }

  if (!video) {
    throw new Error('Failed to create video');
  }

  return video;
}

export async function updateVideo(video_id: string, data: Partial<Video>): Promise<Video> {
  const { data: video, error } = await supabase
    .from('videos')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('video_id', video_id)
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating video:', error);
    throw error;
  }

  if (!video) {
    throw new Error('Video not found');
  }

  return video;
}

export async function getVideo(video_id: string): Promise<Video> {
  const { data: video, error } = await supabase
    .from('videos')
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .eq('video_id', video_id)
    .single();

  if (error) {
    console.error('Error getting video:', error);
    throw error;
  }

  if (!video) {
    throw new Error('Video not found');
  }

  return video;
}

// Segment functions
export async function createSegments(segments: NewSegment[]): Promise<Segment[]> {
  const { data, error } = await supabase
    .from('segments')
    .insert(segments)
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at');

  if (error) {
    console.error('Error creating segments:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create segments');
  }

  return data;
}

export async function getVideoSegments(video_id: string): Promise<Segment[]> {
  const { data: segments, error } = await supabase
    .from('segments')
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at')
    .eq('video_id', video_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting segments:', error);
    throw error;
  }

  return segments || [];
}

export async function updateSegment(segment_id: string, data: Partial<Segment>): Promise<Segment> {
  const { data: segment, error } = await supabase
    .from('segments')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('segment_id', segment_id)
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating segment:', error);
    throw error;
  }

  if (!segment) {
    throw new Error('Segment not found');
  }

  return segment;
}

// Question functions
export async function createQuestions(questions: NewQuestion[]): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at');

  if (error) {
    console.error('Error creating questions:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create questions');
  }

  return data;
}

export async function getSegmentQuestions(segment_id: string): Promise<Question[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at')
    .eq('segment_id', segment_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting questions:', error);
    throw error;
  }

  return questions || [];
}

export async function updateQuestion(question_id: string, data: Partial<Question>): Promise<Question> {
  const { data: question, error } = await supabase
    .from('questions')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('question_id', question_id)
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating question:', error);
    throw error;
  }

  if (!question) {
    throw new Error('Question not found');
  }

  return question;
}

// Response functions
export async function createResponse(response: NewResponse): Promise<Response> {
  const { data, error } = await supabase
    .from('responses')
    .insert([response])
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating response:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create response');
  }

  return data;
}

export async function getQuestionResponses(question_id: string): Promise<Response[]> {
  const { data: responses, error } = await supabase
    .from('responses')
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at, updated_at')
    .eq('question_id', question_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting responses:', error);
    throw error;
  }

  return responses || [];
}

export async function updateResponse(response_id: string, data: Partial<Response>): Promise<Response> {
  const { data: response, error } = await supabase
    .from('responses')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('response_id', response_id)
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating response:', error);
    throw error;
  }

  if (!response) {
    throw new Error('Response not found');
  }

  return response;
}

export async function deleteVideo(video_id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('video_id', video_id);

  if (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function deleteSegment(segment_id: string): Promise<void> {
  const { error } = await supabase
    .from('segments')
    .delete()
    .eq('segment_id', segment_id);

  if (error) {
    console.error('Error deleting segment:', error);
    throw error;
  }
}

export async function deleteQuestion(question_id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('question_id', question_id);

  if (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}

export async function deleteResponse(response_id: string): Promise<void> {
  const { error } = await supabase
    .from('responses')
    .delete()
    .eq('response_id', response_id);

  if (error) {
    console.error('Error deleting response:', error);
    throw error;
  }
}
