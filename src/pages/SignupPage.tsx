import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User as UserIcon, Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
const logo = '/logo.png';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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

export default function SignupPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/invitations/verify/${token}`);
        setInviteData(res.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) setError(err.response?.data?.message || t('auth.invalid_link'));
        else setError(t('common.error_unexpected'));
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError(t('auth.passwords_dont_match'));
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/auth/complete-signup`, {
        token,
        name: formData.name,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || t('auth.signup_error'));
      else setError(t('auth.signup_error'));
      setSubmitting(false);
    }
  };

  const bgStyle = { background: 'radial-gradient(circle at top left, #f8f9ff 0%, #eff4ff 100%)' };
  const cardShadow = { boxShadow: '0 20px 60px -12px rgba(0,35,111,0.12)' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
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
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-[var(--notion-text)] mb-3">
                {t('auth.account_created_title') || 'Compte créé !'}
              </h2>
              <p className="text-sm text-[var(--notion-text-light)] mb-6">
                {t('auth.account_created_desc') || 'Redirection en cours...'}
              </p>
              <div className="w-full bg-[var(--surface-low)] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--brand-primary)] h-full rounded-full"
                  style={{ animation: 'progress-fill 3s linear forwards' }}
                />
              </div>
            </div>
          ) : error && !inviteData ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--notion-text)] mb-2">
                {t('common.error') || 'Lien invalide'}
              </h2>
              <p className="text-sm text-[var(--notion-text-light)] mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: 'var(--shadow-btn)' }}
              >
                {t('auth.back_to_login') || 'Retour à la connexion'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Logo + heading */}
              <div className="text-center mb-7">
                <img src={logo} alt="Badgi-WorkFlow" className="h-12 w-auto mx-auto mb-4" />
                <h1 className="text-xl font-bold text-[var(--notion-text)]">
                  {t('auth.signup_title') || 'Finalisez votre inscription'}
                </h1>
                <p className="text-sm text-[var(--notion-text-light)] mt-1">
                  {t('auth.signup_subtitle') || 'Configurez votre profil pour commencer'}
                </p>
              </div>

              {/* Invited email banner */}
              <div className="flex items-center gap-3 bg-[var(--surface-low)] border border-[var(--notion-border)] rounded-xl p-3 mb-6">
                <div className="w-8 h-8 bg-[var(--brand-primary)]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)]">
                    {t('auth.invited_account') || 'Compte invité'}
                  </p>
                  <p className="text-sm text-[var(--notion-text)] font-medium truncate">{inviteData?.email}</p>
                </div>
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
                  disabled={submitting}
                  className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  style={{ boxShadow: 'var(--shadow-btn)' }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>{t('auth.signup') || 'Créer mon compte'} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
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
