import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid username or password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BTS Assets</h1>
          <p className="text-gray-500 mt-2">Baltimore Tamu Samaj asset management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
