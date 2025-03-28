import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserQuizzes, deleteQuiz } from '../utils/supabase';
import type { Video } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const [quizzes, setQuizzes] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const videos = await getUserQuizzes();
      setQuizzes(videos);
    } catch (error) {
      setError('Failed to load quizzes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (video_id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await deleteQuiz(video_id);
      setQuizzes(quizzes.filter((quiz) => quiz.video_id !== video_id));
    } catch (error) {
      setError('Failed to delete quiz');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/video/new')}
              className="btn-primary px-4 py-2 rounded-md"
            >
              Create New Quiz
            </button>
            <button
              onClick={() => signOut()}
              className="btn-danger px-4 py-2 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No quizzes yet. Create your first quiz!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.video_id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {quiz.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        quiz.status
                      )}`}
                    >
                      {quiz.status}
                    </span>
                  </div>

                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => navigate(`/video/${quiz.video_id}/segments`)}
                      className="btn-primary px-3 py-1 rounded-md text-sm"
                    >
                      Edit Questions
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.video_id)}
                      className="btn-danger px-3 py-1 rounded-md text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
