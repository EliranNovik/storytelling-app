import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
  id: number;
  profile_pic?: string;
}

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    handleStorage();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('userChanged', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('userChanged', handleStorage);
    };
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <Link to="/read" className={`font-medium ${location.pathname === '/read' ? 'bg-primary/10 rounded' : ''}`}>Read Stories</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/my-stories" className={`font-medium ${location.pathname === '/my-stories' ? 'bg-primary/10 rounded' : ''}`}>My Stories</Link>
                </li>
                <li>
                  <Link to="/profile" className={`font-medium ${location.pathname === '/profile' ? 'bg-primary/10 rounded' : ''}`}>My Profile</Link>
                </li>
                <li><span>Welcome {user.username}</span></li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={`font-medium ${location.pathname === '/login' ? 'bg-primary/10 rounded' : ''}`}>Login</Link>
                </li>
                <li>
                  <Link to="/register" className={`font-medium ${location.pathname === '/register' ? 'bg-primary/10 rounded' : ''}`}>Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost normal-case text-xl">Storytelling App</Link>
      </div>
      <div className="navbar-end hidden lg:flex">
        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/read" className={`btn btn-ghost font-medium ${location.pathname === '/read' ? 'bg-primary/10 rounded' : ''}`}>Read Stories</Link>
            <Link to="/my-stories" className={`btn btn-ghost font-medium ${location.pathname === '/my-stories' ? 'bg-primary/10 rounded' : ''}`}>My Stories</Link>
            <Link to="/profile" className={`btn btn-ghost font-medium ${location.pathname === '/profile' ? 'bg-primary/10 rounded' : ''}`}>My Profile</Link>
            {user.profile_pic && (
              <img
                src={user.profile_pic}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-primary"
              />
            )}
            <span className="text-sm font-medium">Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/read" className={`btn btn-ghost font-medium ${location.pathname === '/read' ? 'bg-primary/10 rounded' : ''}`}>Read Stories</Link>
            <Link to="/login" className={`btn btn-ghost font-medium ${location.pathname === '/login' ? 'bg-primary/10 rounded' : ''}`}>Login</Link>
            <Link to="/register" className={`btn btn-primary font-medium ${location.pathname === '/register' ? 'bg-primary/10 rounded' : ''}`}>Register</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar; 