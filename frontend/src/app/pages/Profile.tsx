import { useState, useEffect } from 'react';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState<{ email: string; username: string; profilePic?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setEmail(userData.email);
      setUsername(userData.username);
      setPreview(userData.profilePic || null);
    }
  }, []);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      if (password) formData.append('password', password);
      if (profilePic) formData.append('profilePic', profilePic);
      // Debug: log FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData:', pair[0], pair[1]);
      }
      const token = localStorage.getItem('token');
      const result = await api.put('/api/users/me', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile update API response:', result);
      setMessage('Profile updated successfully!');
      if (result.data && result.data.user) {
        const updatedUser = { ...user, ...result.data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userChanged'));
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-base-100 p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      {message && <div className="alert alert-success mb-4">{message}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="flex flex-col items-center mb-4">
          <div className="avatar mb-2">
            <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden flex items-center justify-center bg-gray-100">
              {preview ? (
                <img src={preview} alt="Profile" className="object-cover w-full h-full" />
              ) : (
                <span className="text-5xl flex items-center justify-center h-full w-full">👤</span>
              )}
            </div>
          </div>
          <input type="file" accept="image/*" onChange={handleProfilePicChange} className="file-input file-input-bordered w-full max-w-xs" />
        </div>
        <div className="form-control">
          <label className="label">Email</label>
          <input
            type="email"
            className="input input-bordered"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Username</label>
          <input
            type="text"
            className="input input-bordered"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label">New Password</label>
          <input
            type="password"
            className="input input-bordered"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">Update Profile</button>
      </form>
    </div>
  );
};

export default Profile; 