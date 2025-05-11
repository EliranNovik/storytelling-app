import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateStory from './pages/CreateStory';
import CollaborativeStory from './components/CollaborativeStory';
import { useParams } from 'react-router-dom';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-story" element={<CreateStory />} />
            <Route path="/stories/:id" element={<StoryWrapper />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Wrapper component to extract storyId from URL params
const StoryWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <CollaborativeStory storyId={parseInt(id!, 10)} userId={1} username={"Guest"} />;
};

export default App; 