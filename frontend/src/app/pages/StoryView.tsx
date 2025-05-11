import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CollaborativeStory from '../components/CollaborativeStory';
import WebSocketService from '../services/websocket';

interface StoryBlock {
  id: string;
  content: string;
  order: number;
  lockedBy: string | null;
  lockedAt: Date | null;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
}

interface Story {
  id: number;
  title: string;
  content?: string;
  created_at?: string;
  author_name?: string;
  authorName?: string;
  blocks: StoryBlock[];
}

const StoryView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api.get(`/api/stories/${id}`);
        setStory(response.data);

        // Connect to WebSocket after fetching story
        const token = localStorage.getItem('token');
        if (token) {
          const ws = WebSocketService.getInstance();
          ws.connect(token);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen p-6 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error || 'Story not found'}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-6 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-warning">
            <span>Please log in to collaborate on stories</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-base-200">
      <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
        <div className="flex items-center gap-2 text-base-content/60 mb-6">
          <span>By {story.author_name || story.authorName}</span>
          <span>•</span>
          <span>{story.created_at && new Date(story.created_at).toLocaleDateString()}</span>
        </div>
        
        <CollaborativeStory
          storyId={story.id}
          userId={user.id}
          username={user.username}
          onStoryUpdate={(updatedStory) => {
            setStory({
              ...story,
              ...updatedStory,
              // Keep the original story metadata
              author_name: story.author_name,
              created_at: story.created_at
            });
          }}
        />

        <div className="mt-8">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryView; 