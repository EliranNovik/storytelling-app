import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Comment from '../components/Comment';
import WebSocketService from '../services/websocket';

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

interface TaggedStory {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  tagged_by_user_id: number;
  tagged_by_username: string;
  tagged_at: string;
}

interface LikeInfo {
  likes: number;
  dislikes: number;
  userVote: number;
}

const ReadStory = () => {
  const [stories, setStories] = useState<StoryWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'edited'>('created');
  const [taggedStories, setTaggedStories] = useState<TaggedStory[]>([]);
  const [likeInfo, setLikeInfo] = useState<{ [storyId: number]: LikeInfo }>({});

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
        console.log('Fetching stories from:', `/api/stories`);
        const response = await api.get('/api/stories');
        console.log('Stories response:', response);
        
        // Initialize each story with empty comments and comment state
        const storiesWithComments = await Promise.all(
          response.data.map(async (story: Story) => {
            const commentsResponse = await api.get(`/api/stories/${story.id}/comments`);
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

  useEffect(() => {
    if (user) {
      api.get(`/api/stories/tagged/${user.id}`)
        .then(res => setTaggedStories(res.data))
        .catch(err => console.error('Error fetching tagged stories:', err));
    }
  }, [user]);

  // Fetch like/dislike info for all stories
  const fetchLikeInfo = useCallback((storyIds: number[]) => {
    if (!user) return;
    storyIds.forEach(id => {
      api.get(`/api/stories/${id}/likes`)
        .then(res => setLikeInfo(prev => ({ ...prev, [id]: res.data })))
        .catch(() => {});
    });
  }, [user]);

  useEffect(() => {
    if (stories.length > 0 && user) {
      fetchLikeInfo(stories.map(s => s.id));
    }
  }, [stories, user, fetchLikeInfo]);

  const handleLike = async (storyId: number, value: 1 | -1) => {
    if (!user) return;
    try {
      await api.post(`/api/stories/${storyId}/like`, { value });
      // Refresh like info for this story
      const res = await api.get(`/api/stories/${storyId}/likes`);
      setLikeInfo(prev => ({ ...prev, [storyId]: res.data }));
    } catch (err) {
      // Optionally show error
    }
  };

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

      const response = await api.post(
        `/api/stories/${storyId}/comments`,
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

      await api.delete(`/api/stories/${storyId}`, {
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

  // Filter and sort stories
  const filteredStories = stories.filter(story => {
    const searchLower = search.toLowerCase();
    return (
      story.title.toLowerCase().includes(searchLower) ||
      story.author_name.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    if (sortBy === 'created') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      // Use last comment date as edited date if available, else fallback to created_at
      const aEdited = a.comments.length > 0 ? a.comments[0].created_at : a.created_at;
      const bEdited = b.comments.length > 0 ? b.comments[0].created_at : b.created_at;
      return new Date(bEdited).getTime() - new Date(aEdited).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-base-200">
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
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          className="input input-bordered w-full md:w-1/2"
          placeholder="Search by title or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered w-full md:w-1/4"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'created' | 'edited')}
        >
          <option value="created">Sort by Date Created</option>
          <option value="edited">Sort by Date Edited</option>
        </select>
      </div>

      {/* Tagged Stories Section */}
      {user && taggedStories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-primary">Stories You're Tagged In</h2>
          <div className="grid gap-6 mb-4">
            {taggedStories.map(story => (
              <div key={story.id} className="card bg-primary/10 border border-primary/30 shadow p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-1">{story.title}</h3>
                    <span className="text-sm text-gray-500">By {story.author_name} • {new Date(story.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="badge badge-primary badge-outline text-xs px-3 py-1">Tagged by {story.tagged_by_username}</span>
                </div>
                <p className="text-gray-700 mb-2 line-clamp-2">{story.content.length > 120 ? story.content.slice(0, 120) + '...' : story.content}</p>
                <Link to={`/stories/${story.id}`} className="btn btn-primary btn-sm mt-2">Read & Collaborate</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredStories.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl font-serif">No Stories Found</h2>
            <p className="text-gray-600">Try searching for a different term or checking back later.</p>
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
            Found {filteredStories.length} stories
          </div>
          {filteredStories.map((story) => (
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
                  <div className="flex items-center gap-4">
                    <button
                      className={`btn btn-sm ${likeInfo[story.id]?.userVote === 1 ? 'btn-success' : 'btn-ghost'}`}
                      onClick={() => handleLike(story.id, 1)}
                      disabled={!user}
                      title="Like"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9V5a3 3 0 013-3h2a2 2 0 012 2v12a2 2 0 01-2 2h-7.28a2 2 0 01-1.94-1.515l-1.36-5.447A1 1 0 018 10V5a1 1 0 011-1h3z" /></svg>
                      {likeInfo[story.id]?.likes || 0}
                    </button>
                    <button
                      className={`btn btn-sm ${likeInfo[story.id]?.userVote === -1 ? 'btn-error' : 'btn-ghost'}`}
                      onClick={() => handleLike(story.id, -1)}
                      disabled={!user}
                      title="Dislike"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 15v4a3 3 0 01-3 3H5a2 2 0 01-2-2V8a2 2 0 012-2h7.28a2 2 0 011.94 1.515l1.36 5.447A1 1 0 0116 14v5a1 1 0 01-1 1h-3z" /></svg>
                      {likeInfo[story.id]?.dislikes || 0}
                    </button>
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