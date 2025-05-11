import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
}

const CreateStory = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}') as User;
      await api.post('/api/stories', {
        title,
        content,
        author_id: user.id
      });

      navigate('/my-stories');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/my-stories');
  };

  return (
    <div className="min-h-screen p-6 bg-base-200">
      <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Create New Story
        </h1>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Enter your story title"
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Content</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea textarea-bordered w-full h-64"
              placeholder="Write your story here..."
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating story...
                </>
              ) : (
                'Create Story'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory; 