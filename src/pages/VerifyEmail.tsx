import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const runVerification = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setStatus('success');
      } catch (err: any) {
        setMessage(err.response?.data?.message || 'Lien invalide ou expiré');
        setStatus('error');
      }
    };
    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[#1a4f8b] animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Vérification en cours...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-[#1a4f8b] text-white rounded-2xl font-bold hover:bg-[#154070] transition-all flex items-center justify-center gap-2"
            >
              Se connecter maintenant
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in shake duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
