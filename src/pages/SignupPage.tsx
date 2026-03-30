import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Lock, User as UserIcon, Loader2, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function SignupPage() {
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
          setError(err.response?.data?.message || 'Lien invalide ou expiré');
        } else {
          setError('Erreur inattendue');
        }
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
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
        setError(err.response?.data?.message || 'Erreur lors de la création du compte');
      } else {
        setError('Erreur lors de la création du compte');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 text-[#1e293b] animate-spin" />
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Oups !</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-slate-800" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Compte créé !</h2>
          <p className="text-slate-600 mb-6">Votre compte est maintenant prêt. Vous allez être redirigé vers la page de connexion...</p>
          <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-800 h-full animate-progress-bar" style={{ animation: 'progress 3s linear' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-inter">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-50 animate-in slide-in-from-bottom duration-500">
        <div className="text-center mb-8">
          <img src={logo} alt="WorkPlan" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Finalisez votre inscription</h1>
          <p className="text-slate-500 mt-2">Bienvenue parmi nous ! Configurez votre profil pour commencer.</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <UserIcon className="w-5 h-5 text-[#1e293b]" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Compte invité</p>
            <p className="text-slate-700 font-medium">{inviteData?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom complet</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-[#1e293b] outline-none transition-all font-medium"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-[#1e293b] outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-[#1e293b] outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-bold hover:bg-[#334155] shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Finaliser mon inscription'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
