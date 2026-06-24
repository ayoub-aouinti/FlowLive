import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Lock, User as UserIcon, Loader2, CheckCircle, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function SignupPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { token } = useParams();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/invitations/verify/${token}`);
        setInviteData(res.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || t('auth.invalid_link'));
        } else {
          setError(t('common.error_unexpected'));
        }
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError(t('auth.passwords_dont_match'));
    }
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/auth/complete-signup`, {
        token,
        name: formData.name,
        password: formData.password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || t('auth.signup_error'));
      } else {
        setError(t('auth.signup_error'));
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--notion-bg)] transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-[var(--notion-text)] animate-spin" />
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
        {success ? (
          <div className="text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[var(--notion-text)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--notion-text)] mb-2">{t('auth.account_created_title') || 'Compte créé !'}</h2>
            <p className="text-[var(--notion-text-light)] mb-6">{t('auth.account_created_desc') || 'Votre compte est maintenant prêt. Vous allez être redirigé...'}</p>
            <div className="w-full bg-slate-50 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-200 h-full animate-progress-bar" style={{ animation: 'progress 3s linear' }} />
            </div>
          </div>
        ) : error && !inviteData ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--notion-text)] mb-2">{t('common.error') || 'Oups !'}</h2>
            <p className="text-[var(--notion-text-light)] mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[var(--notion-sidebar)] text-[var(--notion-text)] rounded-xl font-bold hover:bg-[var(--notion-hover)] transition-all"
            >
              {t('auth.back_to_login') || 'Retour à la connexion'}
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <img src={logo} alt="Badgi-WorkFlow" className="h-16 w-auto mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[var(--notion-text)]">{t('auth.signup_title') || 'Finalisez votre inscription'}</h1>
              <p className="text-[var(--notion-text-light)] mt-2">{t('auth.signup_subtitle') || 'Bienvenue parmi nous ! Configurez votre profil.'}</p>
            </div>

            <div className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl p-4 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                <UserIcon className="w-5 h-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--notion-text-light)] font-bold uppercase tracking-wider">{t('auth.invited_account') || 'Compte invité'}</p>
                <p className="text-[var(--notion-text)] font-medium">{inviteData?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--notion-text)] mb-2">{t('project.initiator')}</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] focus:ring-4 focus:ring-slate-900/5 focus:border-[var(--brand-primary)] outline-none transition-all font-medium"
                    placeholder="Ex: Jean Dupont"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--notion-text)] mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] focus:ring-4 focus:ring-slate-900/5 focus:border-[var(--brand-primary)] outline-none transition-all font-medium"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--notion-text)] mb-2">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--notion-text-light)]" />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-[var(--notion-sidebar)] dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl focus:bg-white dark:focus:bg-slate-800 text-[var(--notion-text)] focus:ring-4 focus:ring-slate-900/5 focus:border-[var(--brand-primary)] outline-none transition-all font-medium"
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
                disabled={submitting}
                className="w-full py-4 bg-[var(--brand-primary)] text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-700 dark:hover:bg-slate-200 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('auth.signup')
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
