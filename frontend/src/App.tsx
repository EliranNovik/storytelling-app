import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './app/components/Navbar';
import Home from './app/pages/Home';
import CreateStory from './app/pages/CreateStory';
import ReadStory from './app/pages/ReadStory';
import About from './app/pages/About';
import Login from './app/pages/Login';
import Register from './app/pages/Register';
import MyStories from './app/pages/MyStories';
import StoryView from './app/pages/StoryView';
import Profile from './app/pages/Profile';

// Configure React Router future flags
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  } as const
};

function App() {
  return (
    <Router {...routerOptions}>
      <div className="min-h-screen bg-base-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateStory />} />
            <Route path="/create-story" element={<CreateStory />} />
            <Route path="/read" element={<ReadStory />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-stories" element={<MyStories />} />
            <Route path="/stories/:id" element={<StoryView />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 