import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
const logo = '/logo.png';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

const Field: React.FC<{
  label: string;
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}> = ({ label, icon: Icon, type, placeholder, value, onChange, required, minLength }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)] mb-1.5">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--notion-text-light)]" />
      <input
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-low)] border border-[var(--notion-border)] rounded-xl text-[var(--notion-text)] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] placeholder:text-[var(--notion-text-light)]/60"
      />
    </div>
  </div>
);

export default function PublicSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError(t('auth.passwords_dont_match'));
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || t('auth.signup_error'));
      else setError(t('auth.signup_error'));
      setLoading(false);
    }
  };

  const bgStyle = { background: 'radial-gradient(circle at top left, #f8f9ff 0%, #eff4ff 100%)' };
  const cardShadow = { boxShadow: '0 20px 60px -12px rgba(0,35,111,0.12)' };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <div className="bg-[var(--notion-sidebar)] p-10 rounded-2xl max-w-md w-full text-center border border-[var(--notion-border)]" style={cardShadow}>
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--notion-text)] mb-3">{t('auth.account_created_title')}</h2>
          <p className="text-sm text-[var(--notion-text-light)] mb-7 leading-relaxed">{t('auth.account_created_desc')}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: 'var(--shadow-btn)' }}
          >
            {t('auth.login')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
      {/* Atmospheric blobs */}
      <div
        className="pointer-events-none fixed top-[-160px] right-[-160px] w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,88,190,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-[-100px] left-[-100px] w-[380px] h-[380px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,35,111,0.05) 0%, transparent 70%)' }}
      />

      <div
        className="relative w-full max-w-[420px] bg-[var(--notion-sidebar)] rounded-2xl border border-[var(--notion-border)] overflow-hidden"
        style={cardShadow}
      >
        {/* Accent top bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />

        <div className="p-8">
          {/* Logo + heading */}
          <div className="text-center mb-7">
            <img src={logo} alt="Badgi-WorkFlow" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[var(--notion-text)]">
              {t('auth.signup') || 'Créer un compte'}
            </h1>
            <p className="text-sm text-[var(--notion-text-light)] mt-1">
              {t('dashboard.subtitle') || 'Rejoignez votre espace de travail'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label={t('project.initiator')}
              icon={UserIcon}
              type="text"
              placeholder="Jean Dupont"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
              required
            />
            <Field
              label={t('auth.email')}
              icon={Mail}
              type="email"
              placeholder="jean@exemple.com"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
              required
            />
            <Field
              label={t('auth.password')}
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(v) => setFormData({ ...formData, password: v })}
              required
              minLength={6}
            />
            <Field
              label={t('auth.confirm_password')}
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
              required
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              style={{ boxShadow: 'var(--shadow-btn)' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{t('auth.signup') || 'Créer un compte'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--notion-border)]" />
            <span className="text-[11px] text-[var(--notion-text-light)] font-medium">ou</span>
            <div className="flex-1 h-px bg-[var(--notion-border)]" />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="w-full py-2.5 bg-white hover:bg-[var(--notion-hover)] border border-[var(--notion-border)] rounded-xl text-sm font-medium text-[var(--notion-text)] transition-all flex items-center justify-center gap-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </button>

          {/* Footer link */}
          <p className="text-center text-xs text-[var(--notion-text-light)] mt-6">
            {t('auth.have_account') || 'Vous avez déjà un compte ?'}{' '}
            <Link to="/login" className="text-[var(--brand-secondary)] font-semibold hover:underline">
              {t('auth.login') || 'Se connecter'}
            </Link>
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div
        className="fixed bottom-6 right-6 flex items-center gap-1.5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-full px-3 py-1.5 text-[10px] text-[var(--notion-text-light)]"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Cloud System Active
      </div>
    </div>
  );
}
