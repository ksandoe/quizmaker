import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getVideoWithQuestions, regenerateQuestion } from '../utils/supabase';
import type { Question } from '../utils/database.types';

interface SegmentWithQuestions {
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
}

interface VideoWithQuestions {
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
  segments: SegmentWithQuestions[];
}

export default function QuizEdit() {
  const { video_id } = useParams<{ video_id: string }>();
  const [quiz, setQuiz] = useState<VideoWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      if (!video_id) return;

      try {
        const data = await getVideoWithQuestions(video_id);
        if (!data) {
          setError('Quiz not found');
          return;
        }
        setQuiz(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
        setLoading(false);
      }
    }

    loadQuiz();
  }, [video_id]);

  const handleRegenerateQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      await regenerateQuestion(questionId);
      if (video_id) {
        const data = await getVideoWithQuestions(video_id);
        if (data) {
          setQuiz(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate question');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Quiz not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{quiz.title}</h1>
      
      <div className="space-y-8">
        {quiz.segments.map((segment, index) => (
          <div key={segment.segment_id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Segment {index + 1}</h2>
            <p className="text-gray-700 mb-6">{segment.content}</p>
            
            <div className="space-y-6">
              {segment.questions.map((question) => (
                <div key={question.question_id} className="border-t pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium mb-2">{question.question_text}</h3>
                      <ul className="space-y-2">
                        {['A', 'B', 'C', 'D'].map((option) => (
                          <li
                            key={option}
                            className={`${
                              question.correct_answer === option
                                ? 'text-green-600 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {option}. {question[`option_${option.toLowerCase()}` as keyof Question]}
                            {question.correct_answer === option && (
                              <span className="ml-2 text-sm text-green-600">(Correct)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleRegenerateQuestion(question.question_id)}
                      disabled={loading}
                      className="text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
