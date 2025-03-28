export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
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
        };
        Insert: {
          video_id?: string;
          title: string;
          url: string;
          transcript?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          max_segments?: number | null;
          creator_id: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          video_id?: string;
          title?: string;
          url?: string;
          transcript?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          max_segments?: number | null;
          creator_id?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      segments: {
        Row: {
          segment_id: string;
          video_id: string;
          content: string;
          word_count: number;
          creator_id: string;
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          segment_id?: string;
          video_id: string;
          content: string;
          word_count: number;
          creator_id: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          segment_id?: string;
          video_id?: string;
          content?: string;
          word_count?: number;
          creator_id?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
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
        };
        Insert: {
          question_id?: string;
          segment_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          creator_id: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_id?: string;
          segment_id?: string;
          question_text?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_answer?: 'A' | 'B' | 'C' | 'D';
          creator_id?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      responses: {
        Row: {
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
        };
        Insert: {
          response_id?: string;
          question_id: string;
          user_id: string;
          selected_answer: 'A' | 'B' | 'C' | 'D';
          is_correct: boolean;
          creator_id: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          response_id?: string;
          question_id?: string;
          user_id?: string;
          selected_answer?: 'A' | 'B' | 'C' | 'D';
          is_correct?: boolean;
          creator_id?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Video = Database['public']['Tables']['videos']['Row'];
export type NewVideo = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export type Segment = Database['public']['Tables']['segments']['Row'];
export type NewSegment = Database['public']['Tables']['segments']['Insert'];
export type UpdateSegment = Database['public']['Tables']['segments']['Update'];

export type Question = Database['public']['Tables']['questions']['Row'];
export type NewQuestion = Database['public']['Tables']['questions']['Insert'];
export type UpdateQuestion = Database['public']['Tables']['questions']['Update'];

export type Response = Database['public']['Tables']['responses']['Row'];
export type NewResponse = Database['public']['Tables']['responses']['Insert'];
export type UpdateResponse = Database['public']['Tables']['responses']['Update'];
