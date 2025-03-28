import { supabase } from './supabase';
import type { Video, NewVideo, Segment, NewSegment, Question, NewQuestion, Response, NewResponse } from './database.types';

// Video functions
export async function createVideo(video: NewVideo): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert([video])
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .single();
  
  if (error) {
    console.error('Error creating video:', error);
    throw error;
  }
  if (!data) {
    throw new Error('No data returned from insert');
  }
  return {
    video_id: data.video_id.toString(),
    title: data.title,
    url: data.url,
    transcript: data.transcript,
    creator_id: data.creator_id,
    status: data.status,
    error_message: data.error_message,
    duration_seconds: data.duration_seconds,
    word_count: data.word_count,
    max_segments: data.max_segments,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function getVideo(video_id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .eq('video_id', video_id)
    .maybeSingle();
  
  if (error) {
    console.error('Error getting video:', error);
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    video_id: data.video_id.toString(),
    title: data.title,
    url: data.url,
    transcript: data.transcript,
    creator_id: data.creator_id,
    status: data.status,
    error_message: data.error_message,
    duration_seconds: data.duration_seconds,
    word_count: data.word_count,
    max_segments: data.max_segments,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('video_id, title, url, transcript, creator_id, status, error_message, duration_seconds, word_count, max_segments, created_at, updated_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting videos:', error);
    throw error;
  }
  return (data || []).map(video => ({
    video_id: video.video_id.toString(),
    title: video.title,
    url: video.url,
    transcript: video.transcript,
    creator_id: video.creator_id,
    status: video.status,
    error_message: video.error_message,
    duration_seconds: video.duration_seconds,
    word_count: video.word_count,
    max_segments: video.max_segments,
    created_at: video.created_at,
    updated_at: video.updated_at
  }));
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
    throw new Error('No data returned from insert');
  }
  return data.map(segment => ({
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id.toString(),
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  }));
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
  return (segments || []).map(segment => ({
    segment_id: segment.segment_id.toString(),
    video_id: segment.video_id.toString(),
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  }));
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
    video_id: segment.video_id.toString(),
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  };
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
    video_id: segment.video_id.toString(),
    content: segment.content,
    word_count: segment.word_count,
    creator_id: segment.creator_id,
    status: segment.status,
    error_message: segment.error_message,
    created_at: segment.created_at,
    updated_at: segment.updated_at
  };
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
    throw new Error('No data returned from insert');
  }
  return data.map(question => ({
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
  }));
}

export async function getSegmentQuestions(segment_id: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('question_id, segment_id, question_text, option_a, option_b, option_c, option_d, correct_answer, creator_id, status, error_message, created_at, updated_at')
    .eq('segment_id', segment_id)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error getting questions:', error);
    throw error;
  }
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
  }));
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
    throw new Error('No data returned from insert');
  }
  return {
    response_id: data.response_id.toString(),
    question_id: data.question_id.toString(),
    user_id: data.user_id,
    selected_answer: data.selected_answer,
    is_correct: data.is_correct,
    creator_id: data.creator_id,
    status: data.status,
    error_message: data.error_message,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function getQuestionResponses(question_id: string): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('response_id, question_id, user_id, selected_answer, is_correct, creator_id, status, error_message, created_at, updated_at')
    .eq('question_id', question_id)
    .order('created_at', { ascending: false });
  
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
    created_at: response.created_at,
    updated_at: response.updated_at
  }));
}

export async function storeVideo(video: Video) {
  const { data, error } = await supabase
    .from('videos')
    .upsert(video)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function storeSegment(segment: Segment) {
  const { data, error } = await supabase
    .from('segments')
    .upsert(segment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function storeQuestion(question: Question) {
  const { data, error } = await supabase
    .from('questions')
    .upsert(question)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function storeResponse(response: Response) {
  const { data, error } = await supabase
    .from('responses')
    .upsert(response)
    .select()
    .single();

  if (error) throw error;
  return data;
}
