import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      login(response.data.token, response.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8 px-2 text-center">
          <div className="mb-6 p-2 bg-white rounded-2xl shadow-sm border border-[#ececeb] animate-in zoom-in slide-in-from-top-4 duration-700">
            <img src={logo} alt="FlowLive" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-4xl font-extrabold text-[#1a4f8b] tracking-tight">
            Flow<span className="text-[#8cc63f]">Live</span> Login
          </h2>
          <p className="text-[#9b9a97] mt-3 font-medium text-sm leading-relaxed max-w-xs">
            Entrez vos identifiants pour accéder au dashboard "Live"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1a4f8b] hover:bg-[#154070] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-[#1a4f8b]/20 active:scale-[0.98]"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
