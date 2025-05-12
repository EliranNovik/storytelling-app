import { Link } from 'react-router-dom';
import api from '../services/api';
import libraryImage from '../assets/images/LIBRARY.jpg';
import { useState, useEffect } from 'react';

interface Story {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

const Home = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await api.get('/api/stories');
        setStories(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setError('Failed to load stories');
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="container mx-auto w-full">
        {/* Background image and welcome message */}
        <div className="relative w-full" style={{ minHeight: '60vh' }}>
          <img
            src={libraryImage}
            alt="Library background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white/80 rounded-xl shadow-xl p-4 max-w-sm w-full text-center mt-6 mb-6 md:p-10 md:max-w-2xl md:mt-20 md:mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Welcome to Scribly</h1>
              <p className="text-base md:text-lg text-gray-700 mb-5 md:mb-6">Create, read, and collaborate on stories with a vibrant community of storytellers.</p>
              <Link to="/create-story" className="btn btn-primary btn-md md:btn-lg">Start a New Story</Link>
            </div>
          </div>
        </div>
        {/* Overview tab below the background image */}
        <div className="w-full pb-8 bg-base-200">
          <div className="bg-white/90 rounded-2xl shadow-lg w-full px-8 py-6 flex flex-col items-center mt-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">Overview</h2>
            <div className="flex flex-col md:flex-row gap-6 w-full mb-4">
              {stories.slice(0, 2).map((story) => (
                <div key={story.id} className="flex-1 bg-base-100 rounded-xl shadow p-4 border border-base-200">
                  <h3 className="text-xl font-semibold mb-2 truncate">{story.title}</h3>
                  <p className="text-base-content/60 mb-2 truncate">By {story.author_name}</p>
                  <p className="text-gray-600 line-clamp-2 mb-2">{story.content}</p>
                  <Link to={`/stories/${story.id}`} className="btn btn-outline btn-primary btn-sm mt-2">Read</Link>
                </div>
              ))}
            </div>
            <Link to="/read" className="btn btn-secondary btn-wide mt-2">Browse All Stories</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 