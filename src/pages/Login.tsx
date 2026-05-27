import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminLogin } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedWashioLogo } from '../components/AnimatedWashioLogo';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import washioTextImg from '/washio-text.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t.loginError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await adminLogin(username, password);
      login(response.data.admin_id, response.data.username);
      navigate('/');
    } catch (e: any) {
      if (e.response?.status === 401) {
        setError(t.loginError);
      } else {
        setError(t.toast_error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Language selector in top right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AnimatedWashioLogo size={64} />
          </div>
          <img src={washioTextImg} alt="WASHIO" className="h-8 mx-auto mb-2" style={{ filter: 'invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(95%) contrast(101%)' }} />
          <p className="text-gray-500">{t.login}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <AnimatedButton
            type="submit"
            disabled={loading}
            loading={loading}
            fullWidth
          >
            {t.loginButton}
          </AnimatedButton>
        </form>

      </div>
    </div>
  );
}
