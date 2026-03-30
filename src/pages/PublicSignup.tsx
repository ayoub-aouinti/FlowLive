import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function PublicSignup() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError(t('auth.passwords_dont_match'));
    }
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || t('auth.signup_error'));
      } else {
        setError(t('auth.signup_error'));
      }
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--notion-bg)] p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300 border border-[var(--notion-border)]">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[var(--notion-text)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--notion-text)] mb-4">{t('auth.account_created_title')}</h2>
          <p className="text-[var(--notion-text-light)] mb-8 leading-relaxed">
            {t('auth.account_created_desc')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-[var(--brand-primary)] text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-700 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {t('auth.login')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--notion-bg)] p-4 font-inter transition-colors duration-300">
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[var(--notion-border)] text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-[var(--notion-border)] animate-in slide-in-from-bottom duration-500">
        <div className="text-center mb-8">
          <img src={logo} alt="WorkPlan Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--notion-text)]">{t('auth.signup')}</h1>
          <p className="text-[var(--notion-text-light)] mt-2">{t('dashboard.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--notion-text)] mb-1.5">{t('project.initiator')}</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] outline-none transition-all font-medium"
                placeholder="Jean Dupont"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--notion-text)] mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] outline-none transition-all font-medium"
                placeholder="jean@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--notion-text)] mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
              <input
                type="password"
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--notion-text)] mb-1.5">{t('auth.confirm_password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm rounded-xl border border-red-100 dark:border-red-500/30 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[var(--brand-primary)] text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-700 dark:hover:bg-slate-200 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('auth.signup')
            )}
          </button>

          <p className="text-center text-sm text-[var(--notion-text-light)] mt-6">
            {t('auth.have_account') || 'Déjà un compte ?'}{' '}
            <Link to="/login" className="text-[var(--brand-primary)] font-bold hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
