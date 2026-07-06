import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const logo = '/logo.png';
import { Mail, Lock, Loader2, UserPlus, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--notion-bg)] relative overflow-hidden px-4">
      {/* Decorative blobs */}
      <div className="absolute top-[-140px] right-[-140px] w-[440px] h-[440px] rounded-full bg-[var(--brand-primary)]/[0.05] pointer-events-none" />
      <div className="absolute bottom-[-120px] left-[-120px] w-[380px] h-[380px] rounded-full bg-[var(--brand-secondary)]/[0.06] pointer-events-none" />
      <div className="absolute top-1/2 left-[5%] w-[200px] h-[200px] rounded-full bg-[var(--surface-mid)] opacity-40 pointer-events-none" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 p-2.5 bg-[var(--notion-sidebar)] rounded-xl border border-[var(--notion-border)] text-[var(--notion-text-light)] hover:text-[var(--notion-text)] shadow-[var(--shadow-card)] transition-all hover:scale-105 active:scale-95"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card */}
      <div
        className="relative w-full max-w-[420px] bg-[var(--notion-sidebar)] rounded-2xl border border-[var(--notion-border)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />

        <div className="p-8">
          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="mb-4 p-3 bg-[var(--surface-low)] rounded-2xl">
              <img src={logo} alt="Badgi-WorkFlow" className="w-11 h-11 object-contain" />
            </div>
            <h1 className="text-[22px] font-bold text-[var(--notion-text)] leading-tight mb-1">
              Bienvenue sur{' '}
              <span className="text-[var(--brand-secondary)]">Badgi-WorkFlow</span>
            </h1>
            <p className="text-sm text-[var(--notion-text-light)]">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Google SSO */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-11 flex items-center justify-center gap-2.5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl hover:bg-[var(--notion-hover)] transition-colors text-sm font-semibold text-[var(--notion-text)] shadow-[var(--shadow-card)] mb-5"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.google_continue')}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--notion-border)]" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[var(--notion-sidebar)] px-3 text-[var(--notion-text-light)] uppercase tracking-widest font-semibold">
                {t('auth.or_email')}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[var(--notion-text)] mb-1.5 uppercase tracking-wide">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--notion-text-light)]" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--notion-border)] bg-[var(--surface-low)] text-[var(--notion-text)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] outline-none transition-all text-sm placeholder:text-[var(--notion-text-light)]/60"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--notion-text)] mb-1.5 uppercase tracking-wide">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--notion-text-light)]" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--notion-border)] bg-[var(--surface-low)] text-[var(--notion-text)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] outline-none transition-all text-sm placeholder:text-[var(--notion-text-light)]/60"
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
              className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
              style={{ boxShadow: 'var(--shadow-btn)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.login')}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-[var(--notion-text-light)] mt-6 pt-5 border-t border-[var(--notion-border)]">
            {t('auth.no_account')}{' '}
            <Link
              to="/register"
              className="text-[var(--brand-secondary)] font-semibold hover:underline inline-flex items-center gap-1"
            >
              {t('auth.signup')} <UserPlus className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
