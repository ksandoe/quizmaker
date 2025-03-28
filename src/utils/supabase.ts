import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

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

// Export database type
export type { Database };

// Create Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'quiz-maker-auth',
    }
  }
);

// Video functions
export async function updateVideo(video_id: string, data: Partial<Video>) {
  const { error } = await supabase
    .from('videos')
    .update(data)
    .eq('video_id', video_id);

  if (error) throw error;
}

export async function createVideo(data: NewVideo): Promise<Video | null> {
  const response = await fetch('/api/transcript/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ url: data.url })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create video');
  }

  return result.video;
}

export async function getVideo(video_id: string): Promise<Video> {
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('video_id', video_id)
    .single();

  if (error) throw error;
  if (!video) throw new Error('Video not found');
  return video;
}

export async function getUserVideos(): Promise<Video[]> {
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return videos || [];
}

// Auth helpers
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Quiz management helpers
export async function createQuiz(url: string) {
  const { data, error } = await supabase.functions.invoke('create-quiz', {
    body: { url },
  });

  if (error) throw error;
  return data;
}

export async function getUserQuizzes(): Promise<Video[]> {
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return videos || [];
}

export async function getVideoWithQuestions(video_id: string) {
  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      segments:segments(
        *,
        questions:questions(*)
      )
    `)
    .eq('video_id', video_id)
    .single();

  if (error) throw error;
  if (!video) throw new Error('Quiz not found');
  return video;
}

export async function updateQuestion(question_id: string, updates: Partial<Question>): Promise<Question> {
  const { data: question, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('question_id', question_id)
    .select()
    .single();

  if (error) throw error;
  if (!question) throw new Error('Question not found');
  return question;
}

export async function regenerateQuestion(question_id: string): Promise<Question> {
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .update({ status: 'pending' })
    .eq('question_id', question_id)
    .select()
    .single();

  if (questionError) throw questionError;
  if (!question) throw new Error('Question not found');

  // Call the edge function to regenerate the question
  const { data: updatedQuestion, error: regenerateError } = await supabase
    .functions.invoke('regenerate-question', {
      body: { question_id },
    });

  if (regenerateError) throw regenerateError;
  return updatedQuestion;
}

export async function deleteQuiz(video_id: string) {
  // First, get all segments for this video
  const { data: segments } = await supabase
    .from('segments')
    .select('segment_id')
    .eq('video_id', video_id);

  if (segments) {
    // Delete all questions for these segments
    for (const segment of segments) {
      await supabase
        .from('questions')
        .delete()
        .eq('segment_id', segment.segment_id);
    }

    // Delete all segments
    await supabase
      .from('segments')
      .delete()
      .eq('video_id', video_id);
  }

  // Finally, delete the video
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('video_id', video_id);

  if (error) throw error;
}

export async function createSegments(segments: NewSegment[]) {
  const { data, error } = await supabase
    .from('segments')
    .insert(segments)
    .select();

  if (error) throw error;
  return data;
}

export async function getVideoSegments(video_id: string) {
  const { data: segments, error } = await supabase
    .from('segments')
    .select('*')
    .eq('video_id', video_id)
    .order('created_at');

  if (error) throw error;
  return segments || [];
}

export async function updateSegment(segment_id: string, data: Partial<Segment>) {
  const { error } = await supabase
    .from('segments')
    .update(data)
    .eq('segment_id', segment_id);

  if (error) throw error;
}

export async function getSegments(video_id: string): Promise<Segment[]> {
  const { data: segments, error } = await supabase
    .from('segments')
    .select('*')
    .eq('video_id', video_id)
    .order('created_at');

  if (error) throw error;
  return segments || [];
}

export async function getQuestions(segment_id: string): Promise<Question[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('segment_id', segment_id)
    .order('created_at');

  if (error) throw error;
  return questions || [];
}

export async function getResponses(question_id: string): Promise<Response[]> {
  const { data: responses, error } = await supabase
    .from('responses')
    .select('*')
    .eq('question_id', question_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return responses || [];
}
