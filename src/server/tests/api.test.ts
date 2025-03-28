import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../utils/database';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3015';
let testVideoId: string;
let testSegmentId: string;
let testQuestionId: string;

// Test video URL - using a short Creative Commons video
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=EngW7tLk6R8';

describe('QuizMaker API Tests', () => {
  beforeAll(async () => {
    // Ensure we're using the test database
    if (!process.env.SUPABASE_URL?.includes('test')) {
      throw new Error('Tests must be run against test database');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testVideoId) {
      await supabase.from('videos').delete().eq('video_id', testVideoId);
    }
  });

  describe('Video Processing', () => {
    it('should create a video and start processing', async () => {
      const response = await fetch(`${API_URL}/api/transcript/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: TEST_VIDEO_URL }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('video_id');
      testVideoId = data.video_id;

      // Verify video record in database
      const { data: video } = await supabase
        .from('videos')
        .select('*')
        .eq('video_id', testVideoId)
        .single();

      expect(video).toBeDefined();
      expect(video?.status).toBe('pending');
    });

    it('should return video status', async () => {
      const response = await fetch(`${API_URL}/api/transcript/status/${testVideoId}`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('data.status');
      expect(['pending', 'downloading', 'transcribing', 'transcribed', 'error']).toContain(data.data.status);
    });

    it('should eventually complete transcription', async () => {
      let status = 'pending';
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals

      while (status !== 'transcribed' && status !== 'error' && attempts < maxAttempts) {
        const response = await fetch(`${API_URL}/api/transcript/status/${testVideoId}`);
        const data = await response.json();
        status = data.data.status;
        
        if (status === 'error') {
          throw new Error(`Transcription failed: ${data.data.error_message}`);
        }
        
        if (status !== 'transcribed') {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        }
      }

      expect(status).toBe('transcribed');
    });
  });

  describe('Segment Creation', () => {
    it('should create segments from transcript', async () => {
      const response = await fetch(`${API_URL}/api/transcript/segment/${testVideoId}`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      testSegmentId = data.data[0].segment_id;

      // Verify segments in database
      const { data: segments } = await supabase
        .from('segments')
        .select('*')
        .eq('video_id', testVideoId);

      expect(segments).toBeDefined();
      expect(segments!.length).toBeGreaterThan(0);
      expect(segments![0]).toHaveProperty('content');
      expect(segments![0]).toHaveProperty('word_count');
    });
  });

  describe('Question Generation', () => {
    it('should generate questions for a segment', async () => {
      const response = await fetch(`${API_URL}/api/transcript/questions/${testSegmentId}`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      testQuestionId = data.data[0].question_id;

      // Verify questions in database
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('segment_id', testSegmentId);

      expect(questions).toBeDefined();
      expect(questions!.length).toBeGreaterThan(0);
      expect(questions![0]).toHaveProperty('question_text');
      expect(questions![0]).toHaveProperty('option_a');
      expect(questions![0]).toHaveProperty('option_b');
      expect(questions![0]).toHaveProperty('option_c');
      expect(questions![0]).toHaveProperty('option_d');
      expect(questions![0]).toHaveProperty('correct_answer');
    });
  });

  describe('Response Handling', () => {
    it('should create a response to a question', async () => {
      const response = await fetch(`${API_URL}/api/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: testQuestionId,
          selected_answer: 'A',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('response_id');

      // Verify response in database
      const { data: savedResponse } = await supabase
        .from('responses')
        .select('*')
        .eq('response_id', data.response_id)
        .single();

      expect(savedResponse).toBeDefined();
      expect(savedResponse?.selected_answer).toBe('A');
      expect(savedResponse).toHaveProperty('is_correct');
    });
  });

  describe('Quiz Retrieval', () => {
    it('should get complete quiz with segments and questions', async () => {
      const response = await fetch(`${API_URL}/api/quiz/${testVideoId}`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('video_id');
      expect(data).toHaveProperty('segments');
      expect(data.segments).toBeInstanceOf(Array);
      expect(data.segments.length).toBeGreaterThan(0);
      expect(data.segments[0]).toHaveProperty('questions');
      expect(data.segments[0].questions).toBeInstanceOf(Array);
      expect(data.segments[0].questions.length).toBeGreaterThan(0);
    });
  });
});
