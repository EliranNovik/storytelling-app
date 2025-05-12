import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

interface User {
  username: string;
  email: string;
  id: number;
  profile_pic?: string;
}

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

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
          <label tabIndex={0} className="btn btn-ghost lg:hidden" onClick={() => setMenuOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          {menuOpen && (
            <>
              <div className="fixed inset-0 bg-black/30 z-[20]" onClick={() => setMenuOpen(false)} />
              <ul ref={dropdownRef} tabIndex={0} className="menu menu-md dropdown-content mt-3 z-[30] p-4 shadow-lg bg-white rounded-2xl w-64 space-y-2 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-primary">Scribly</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <li>
                  <Link to="/read" className={`flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-primary/10 transition ${location.pathname === '/read' ? 'bg-primary/10' : ''}`} onClick={() => setMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m0 0l-4-4m4 4l4-4" /></svg>
                    Read Stories
                  </Link>
                </li>
                {user ? (
                  <>
                    <li>
                      <Link to="/my-stories" className={`flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-primary/10 transition ${location.pathname === '/my-stories' ? 'bg-primary/10' : ''}`} onClick={() => setMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /></svg>
                        My Stories
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile" className={`flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-primary/10 transition ${location.pathname === '/profile' ? 'bg-primary/10' : ''}`} onClick={() => setMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        My Profile
                      </Link>
                    </li>
                    <div className="border-t my-2" />
                    <li>
                      <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-error/10 text-error transition w-full text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <div className="border-t my-2" />
                    <li>
                      <Link to="/login" className={`flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-primary/10 transition ${location.pathname === '/login' ? 'bg-primary/10' : ''}`} onClick={() => setMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className={`flex items-center gap-3 font-bold text-base px-4 py-3 rounded-lg hover:bg-primary/10 transition ${location.pathname === '/register' ? 'bg-primary/10' : ''}`} onClick={() => setMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </>
          )}
        </div>
        <Link to="/" className="btn btn-ghost normal-case text-xl">Scribly</Link>
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