import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const logo = '/logo.png';
import { Chrome, Mail, Lock, Loader2, UserPlus, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      login(response.data.token, response.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || t('auth.login_failed'));
      } else {
        setError(t('common.error_unexpected'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("La connexion Google sera configurée avec votre Client ID.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--notion-bg)] px-4 font-inter transition-colors duration-300">
      {/* Theme Toggle for Landing */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[var(--notion-border)] text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all active:scale-90"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-[var(--notion-border)] animate-in slide-in-from-bottom duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6 p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-gray-50 transform hover:scale-105 transition-transform duration-300">
            <img src={logo} alt="Badgi-WorkFlow" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-black mb-2 animate-in slide-in-from-top-4 duration-500 flex items-center justify-center gap-1">
            <span className="text-[var(--notion-text)]">Badgi-</span>
            <span className="text-[var(--brand-accent)]">WorkFlow</span>
          </h1>
          <p className="text-[var(--notion-text-light)] mt-3 font-medium text-sm max-w-xs">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-[var(--notion-border)] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-semibold text-[var(--notion-text)] shadow-sm"
          >
            <Chrome className="w-5 h-5 text-[#ea4335]" />
            {t('auth.google_continue') || 'Continuer avec Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--notion-border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-4 text-[var(--notion-text-light)] font-bold tracking-widest">{t('auth.or_email') || 'Ou avec email'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-4 rounded-xl text-sm border border-red-100 dark:border-red-500/30 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[var(--notion-text)] ml-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--notion-border)] bg-[var(--notion-sidebar)] dark:bg-slate-900/50 text-[var(--notion-text)] focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-slate-900/5 focus:border-[var(--brand-primary)] outline-none transition-all font-medium placeholder:text-[var(--notion-text-light)]"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[var(--notion-text)] ml-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--notion-border)] bg-[var(--notion-sidebar)] dark:bg-slate-900/50 text-[var(--notion-text)] focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-slate-900/5 focus:border-[var(--brand-primary)] outline-none transition-all font-medium placeholder:text-[var(--notion-text-light)]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand-primary)] hover:bg-slate-700 dark:hover:bg-slate-600 text-white dark:text-slate-900 font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-slate-100 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.login')}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--notion-text-light)] mt-8 pt-4 border-t border-[var(--notion-border)]">
            {t('auth.no_account') || 'Pas encore de compte ?'}{' '}
            <Link to="/register" className="text-[var(--brand-primary)] font-bold hover:underline inline-flex items-center gap-1">
              {t('auth.signup')} <UserPlus className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
