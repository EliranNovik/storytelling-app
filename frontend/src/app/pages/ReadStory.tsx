import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Comment from '../components/Comment';
import WebSocketService from '../services/websocket';

const BACKEND_URL = 'http://localhost:3001';

interface Story {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  author_id: number;
}

interface Comment {
  id: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface StoryWithComments extends Story {
  comments: Comment[];
  newComment: string;
  isAddingComment: boolean;
}

const ReadStory = () => {
  const [stories, setStories] = useState<StoryWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
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
    const fetchStories = async () => {
      try {
        console.log('Fetching stories from:', `${BACKEND_URL}/api/stories`);
        const response = await axios.get(`${BACKEND_URL}/api/stories`);
        console.log('Stories response:', response);
        
        // Initialize each story with empty comments and comment state
        const storiesWithComments = await Promise.all(
          response.data.map(async (story: Story) => {
            const commentsResponse = await axios.get(
              `${BACKEND_URL}/api/stories/${story.id}/comments`
            );
            return {
              ...story,
              comments: commentsResponse.data,
              newComment: '',
              isAddingComment: false
            };
          })
        );

        setStories(storiesWithComments);
      } catch (err: any) {
        console.error('Error fetching stories:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.error || err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchStories();
    }
  }, [loading]); // Only run when loading changes

  useEffect(() => {
    // Connect to WebSocket when component mounts
    const token = localStorage.getItem('token');
    if (token) {
      const ws = WebSocketService.getInstance();
      ws.connect(token);
    }
  }, []); // Empty dependency array means this only runs on mount/unmount

  const handleCommentChange = (storyId: number, value: string) => {
    setStories(stories.map(story => 
      story.id === storyId ? { ...story, newComment: value } : story
    ));
  };

  const handleAddComment = async (storyId: number) => {
    const story = stories.find(s => s.id === storyId);
    if (!story || !story.newComment.trim() || !user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to comment');
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/stories/${storyId}/comments`,
        { content: story.newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update the stories state with the new comment
      setStories(stories.map(s => {
        if (s.id === storyId) {
          return {
            ...s,
            comments: [response.data, ...s.comments],
            newComment: '',
            isAddingComment: false
          };
        }
        return s;
      }));
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to delete stories');
        return;
      }

      await axios.delete(`${BACKEND_URL}/api/stories/${storyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove the deleted story from the state
      setStories(stories.filter(story => story.id !== storyId));
    } catch (err: any) {
      console.error('Error deleting story:', err);
      setError(err.response?.data?.error || 'Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Community Stories
      </h1>
      
      {stories.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl font-serif">No Stories Yet</h2>
            <p className="text-gray-600">Be the first to share a story!</p>
            <div className="card-actions justify-center mt-4">
              <Link to="/create" className="btn btn-primary btn-wide">
                Create Story
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="text-sm text-gray-500 text-center">
            Found {stories.length} stories
          </div>
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-base-200"
            >
              <div className="card-body p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="card-title text-2xl font-serif mb-2 text-primary hover:text-primary-focus transition-colors">
                      {story.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{story.author_name}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(story.created_at).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span>{story.comments.length} comments</span>
                      </div>
                    </div>
                  </div>
                  {user && user.id === story.author_id && (
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                      title="Delete story"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    {story.content.length > 200
                      ? `${story.content.substring(0, 200)}...`
                      : story.content}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-base-200">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/stories/${story.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Read & Collaborate
                    </Link>
                  </div>
                </div>

                {/* Comments section */}
                <div className="mt-6 border-t border-base-200 pt-4">
                  {user ? (
                    <div className="mb-6">
                      <textarea
                        className="textarea textarea-bordered w-full min-h-[100px] focus:textarea-primary"
                        placeholder="Share your thoughts..."
                        value={story.newComment}
                        onChange={(e) => handleCommentChange(story.id, e.target.value)}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddComment(story.id)}
                          disabled={!story.newComment.trim()}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">
                      <Link to="/login" className="text-primary hover:text-primary-focus">Login</Link> to add a comment
                    </p>
                  )}

                  {story.comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      content={comment.content}
                      author_name={comment.author_name}
                      created_at={comment.created_at}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadStory; 