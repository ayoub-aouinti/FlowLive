import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/logo.png';
import { Chrome, Mail, Lock, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login: React.FC = () => {
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
        setError(err.response?.data?.message || 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google Login implementation
    alert("La connexion Google sera configurée avec votre Client ID.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-inter">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-50 transform hover:scale-105 transition-transform duration-300">
            <img src={logo} alt="WorkPlan" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">
            Work<span className="text-slate-500 font-light italic">Plan</span>
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-sm max-w-xs">
            Optimisez votre flux de travail avec intelligence
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm"
          >
            <Chrome className="w-5 h-5 text-[#ea4335]" />
            Continuer avec Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Ou avec email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-[#1e293b] outline-none transition-all font-medium"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-[#1e293b] outline-none transition-all font-medium"
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
              className="w-full bg-[#1e293b] hover:bg-[#334155] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-slate-100 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 pt-4 border-t border-slate-50">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-[#1e293b] font-bold hover:underline inline-flex items-center gap-1">
              S'inscrire <UserPlus className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
