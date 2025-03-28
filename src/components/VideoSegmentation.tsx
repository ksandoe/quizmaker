import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideoWithQuestions, updateQuestion, regenerateQuestion } from '../utils/supabase';
import type { Question, Segment } from '../utils/database.types';

interface VideoWithSegments {
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
  segments: Array<Segment & { questions: Question[] }>;
}

export function VideoSegmentation() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoWithSegments | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!videoId) {
      navigate('/dashboard');
      return;
    }

    const fetchVideo = async () => {
      try {
        const data = await getVideoWithQuestions(videoId);
        if (!data) throw new Error('Video not found');
        setVideo(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load video');
      }
    };

    fetchVideo();
  }, [videoId, navigate]);

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleSaveQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingQuestion) return;

    try {
      setLoading(true);
      const formData = new FormData(event.currentTarget);
      const correct_answer = formData.get('correct_answer') as string;
      
      // Validate correct_answer is one of A, B, C, D
      if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
        throw new Error('Correct answer must be A, B, C, or D');
      }

      const updatedQuestion = {
        ...editingQuestion,
        question_text: formData.get('question_text') as string,
        option_a: formData.get('option_a') as string,
        option_b: formData.get('option_b') as string,
        option_c: formData.get('option_c') as string,
        option_d: formData.get('option_d') as string,
        correct_answer: correct_answer as 'A' | 'B' | 'C' | 'D',
      };

      await handleUpdateQuestion(editingQuestion.question_id, updatedQuestion);
      setEditingQuestion(null);
      refreshVideo();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (question_id: string, updatedQuestion: Partial<Question>) => {
    try {
      await updateQuestion(question_id, updatedQuestion);
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const handleRegenerateQuestion = async (question_id: string) => {
    try {
      setLoading(true);
      await regenerateQuestion(question_id);
      refreshVideo();
    } catch (error) {
      console.error('Error regenerating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshVideo = async () => {
    if (!videoId) return;
    try {
      const data = await getVideoWithQuestions(videoId);
      if (!data) throw new Error('Video not found');
      setVideo(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load video');
    }
  };

  if (error) {
    return (
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Error: {error}</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Loading Video</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-8">
        {video.segments.map((segment, index) => (
          <div key={segment.segment_id} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Segment {index + 1}</h3>
            <p className="mt-2 text-gray-600">{segment.content}</p>

            {segment.questions.map((question) => (
              <div key={question.question_id} className="mt-4 border-t pt-4">
                {editingQuestion?.question_id === question.question_id ? (
                  <form onSubmit={handleSaveQuestion} className="space-y-4">
                    <div>
                      <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">
                        Question Text
                      </label>
                      <textarea
                        id="question_text"
                        name="question_text"
                        defaultValue={question.question_text}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div key={option}>
                        <label htmlFor={`option_${option.toLowerCase()}`} className="block text-sm font-medium text-gray-700">
                          Option {option}
                        </label>
                        <input
                          type="text"
                          id={`option_${option.toLowerCase()}`}
                          name={`option_${option.toLowerCase()}`}
                          defaultValue={question[`option_${option.toLowerCase()}` as keyof Question] as string}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor="correct_answer" className="block text-sm font-medium text-gray-700">
                        Correct Answer
                      </label>
                      <select
                        id="correct_answer"
                        name="correct_answer"
                        defaultValue={question.correct_answer}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        {['A', 'B', 'C', 'D'].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(null)}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p className="font-medium">{question.question_text}</p>
                    <ul className="mt-2 space-y-2">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <li key={option} className={`flex items-center ${question.correct_answer === option ? 'text-green-600 font-medium' : ''}`}>
                          {option}. {question[`option_${option.toLowerCase()}` as keyof Question] as string}
                          {question.correct_answer === option && (
                            <span className="ml-2 text-xs text-green-600">(Correct)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerateQuestion(question.question_id)}
                        disabled={loading}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
