import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import bookImage from '../assets/images/book.jpg';

interface Story {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const MyStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}') as User;
        if (!user.id) {
          navigate('/login');
          return;
        }

        const response = await api.get(`/api/stories/user/${user.id}`);
        setStories(response.data);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [navigate]);

  const handleDelete = async (storyId: number) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await api.delete(`/api/stories/${storyId}`);
      setStories(stories.filter(story => story.id !== storyId));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 bg-base-200" style={{ backgroundImage: `url(${bookImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Overlay to soften the background image */}
      <div className="absolute inset-0 bg-white/60 pointer-events-none" />
      <div className="relative max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Stories
          </h1>
          <Link to="/create-story" className="btn btn-primary">
            Create New Story
          </Link>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No stories yet</h2>
            <p className="text-base-content/60 mb-6">
              Start writing your first story today!
            </p>
            <Link to="/create-story" className="btn btn-primary">
              Create Your First Story
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <h2 className="card-title text-2xl">{story.title}</h2>
                  <p className="text-base-content/60">
                    Created on {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  <p className="line-clamp-3">{story.content}</p>
                  <div className="card-actions justify-end mt-4">
                    <button
                      onClick={() => handleDelete(story.id)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      Delete
                    </button>
                    <Link
                      to={`/stories/${story.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStories; 