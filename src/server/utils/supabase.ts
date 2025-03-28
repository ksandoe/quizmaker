import { createClient } from '@supabase/supabase-js';
import { Database } from '../../utils/database.types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

// Create Supabase admin client
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Database Types
export type Video = Database['public']['Tables']['videos']['Row'];
export type Segment = Database['public']['Tables']['segments']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Response = Database['public']['Tables']['responses']['Row'];

export type NewVideo = Database['public']['Tables']['videos']['Insert'];
export type NewSegment = Database['public']['Tables']['segments']['Insert'];
export type NewQuestion = Database['public']['Tables']['questions']['Insert'];
export type NewResponse = Database['public']['Tables']['responses']['Insert'];

// Database Functions
export async function createVideo(video: NewVideo) {
  const { data, error } = await supabase
    .from('videos')
    .insert([video])
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

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
    throw new Error('No data returned from insert');
  }
  return (data || []).map(segment => ({
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id,
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  })) as Segment[];
}

export async function getVideo(video_id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .eq('video_id', video_id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideo(video_id: string, updates: Partial<Video>) {
  const { error } = await supabase
    .from('videos')
    .update(updates)
    .eq('video_id', video_id);

  if (error) throw error;
}

export async function getVideoSegments(video_id: string): Promise<Segment[]> {
  const { data, error } = await supabase
    .from('segments')
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at')
    .eq('video_id', video_id);

  if (error) {
    console.error('Error getting segments:', error);
    throw error;
  }
  return (data || []).map(segment => ({
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id,
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  })) as Segment[];
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
  return {
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id,
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  } as Segment;
}

export async function getSegment(segment_id: string): Promise<Segment> {
  const { data: segment, error } = await supabase
    .from('segments')
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at')
    .eq('segment_id', segment_id)
    .single();

  if (error) {
    console.error('Error getting segment:', error);
    throw error;
  }
  if (!segment) {
    throw new Error('Segment not found');
  }
  return {
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id,
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  } as Segment;
}

export async function createQuestions(questions: NewQuestion[]) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at');

  if (error) throw error;
  return (data || []).map(question => ({
    question_id: question.question_id.toString(),
    segment_id: question.segment_id.toString(),
    question_text: question.question_text,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    correct_answer: question.correct_answer,
    creator_id: question.creator_id,
    status: question.status,
    error_message: question.error_message,
    created_at: question.created_at,
    updated_at: question.updated_at
  })) as Question[];
}

export async function getQuestions(segment_id: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at')
    .eq('segment_id', segment_id);

  if (error) throw error;
  return (data || []).map(question => ({
    question_id: question.question_id.toString(),
    segment_id: question.segment_id.toString(),
    question_text: question.question_text,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    correct_answer: question.correct_answer,
    creator_id: question.creator_id,
    status: question.status,
    error_message: question.error_message,
    created_at: question.created_at,
    updated_at: question.updated_at
  })) as Question[];
}

export async function createResponses(responses: NewResponse[]): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .insert(responses)
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at');

  if (error) {
    console.error('Error creating responses:', error);
    throw error;
  }
  if (!data) {
    throw new Error('No data returned from insert');
  }
  return (data || []).map(response => ({
    response_id: response.response_id.toString(),
    question_id: response.question_id.toString(),
    user_id: response.user_id,
    selected_answer: response.selected_answer,
    is_correct: response.is_correct,
    creator_id: response.creator_id,
    status: response.status,
    error_message: response.error_message,
    created_at: response.created_at
  })) as Response[];
}

export async function getQuestionResponses(question_id: string): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at')
    .eq('question_id', question_id);

  if (error) {
    console.error('Error getting responses:', error);
    throw error;
  }
  return (data || []).map(response => ({
    response_id: response.response_id.toString(),
    question_id: response.question_id.toString(),
    user_id: response.user_id,
    selected_answer: response.selected_answer,
    is_correct: response.is_correct,
    creator_id: response.creator_id,
    status: response.status,
    error_message: response.error_message,
    created_at: response.created_at
  })) as Response[];
}

export async function updateResponse(response_id: string, data: Partial<Response>): Promise<Response> {
  const { data: response, error } = await supabase
    .from('responses')
    .update(data)
    .eq('response_id', response_id)
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at')
    .single();

  if (error) {
    console.error('Error updating response:', error);
    throw error;
  }
  if (!response) {
    throw new Error('Response not found');
  }
  return {
    response_id: response.response_id.toString(),
    question_id: response.question_id.toString(),
    user_id: response.user_id,
    selected_answer: response.selected_answer,
    is_correct: response.is_correct,
    creator_id: response.creator_id,
    status: response.status,
    error_message: response.error_message,
    created_at: response.created_at
  } as Response;
}

export async function getResponse(response_id: string): Promise<Response> {
  const { data: response, error } = await supabase
    .from('responses')
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at')
    .eq('response_id', response_id)
    .single();

  if (error) {
    console.error('Error getting response:', error);
    throw error;
  }
  if (!response) {
    throw new Error('Response not found');
  }
  return {
    response_id: response.response_id.toString(),
    question_id: response.question_id.toString(),
    user_id: response.user_id,
    selected_answer: response.selected_answer,
    is_correct: response.is_correct,
    creator_id: response.creator_id,
    status: response.status,
    error_message: response.error_message,
    created_at: response.created_at
  } as Response;
}

export async function getVideoWithQuestions(video_id: string): Promise<{
  video_id: string;
  title: string;
  url: string;
  transcript: string | null;
  word_count: number | null;
  duration_seconds: number | null;
  max_segments: number | null;
  creator_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  segments: {
    segment_id: string;
    video_id: string;
    content: string;
    word_count: number;
    creator_id: string;
    status: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    questions: Question[];
  }[];
} | null> {
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('video_id', video_id)
    .single();

  if (videoError) throw videoError;
  if (!video) return null;

  const { data: segments, error: segmentsError } = await supabase
    .from('segments')
    .select('segment_id, video_id, content, word_count, creator_id, status, error_message, created_at, updated_at')
    .eq('video_id', video_id);

  if (segmentsError) throw segmentsError;

  const segmentsWithQuestions = await Promise.all(
    (segments || []).map(async (segment) => {
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('segment_id', segment.segment_id);

      if (questionsError) throw questionsError;

      return {
        segment_id: segment.segment_id.toString(),
        video_id: segment.video_id,
        content: segment.content,
        word_count: segment.word_count,
        creator_id: segment.creator_id,
        status: segment.status,
        error_message: segment.error_message,
        created_at: segment.created_at,
        updated_at: segment.updated_at,
        questions: (questions || []).map(question => ({
          question_id: question.question_id.toString(),
          segment_id: question.segment_id.toString(),
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          creator_id: question.creator_id,
          status: question.status,
          error_message: question.error_message,
          created_at: question.created_at,
          updated_at: question.updated_at
        })) as Question[]
      };
    })
  );

  return {
    ...video,
    segments: segmentsWithQuestions
  };
}

export async function regenerateQuestion(question_id: string): Promise<Question> {
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*')
    .eq('question_id', question_id)
    .single();

  if (questionError) throw questionError;
  if (!question) throw new Error('Question not found');

  const { data: segment, error: segmentError } = await supabase
    .from('segments')
    .select('content')
    .eq('segment_id', question.segment_id)
    .single();

  if (segmentError) throw segmentError;
  if (!segment) throw new Error('Segment not found');

  // TODO: Call OpenAI API to generate new question
  const newQuestion = {
    ...question,
    question_text: 'Sample regenerated question?',
    option_a: 'New option A',
    option_b: 'New option B',
    option_c: 'New option C',
    option_d: 'New option D',
    correct_answer: 'A' as const,
  };

  const { data: updatedQuestion, error: updateError } = await supabase
    .from('questions')
    .update(newQuestion)
    .eq('question_id', question_id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedQuestion as Question;
}

export async function getResponses(question_id: string): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at')
    .eq('question_id', question_id);

  if (error) throw error;
  return (data || []).map(response => ({
    response_id: response.response_id.toString(),
    question_id: response.question_id.toString(),
    user_id: response.user_id,
    selected_answer: response.selected_answer,
    is_correct: response.is_correct,
    creator_id: response.creator_id,
    status: response.status,
    error_message: response.error_message,
    created_at: response.created_at
  })) as Response[];
}
