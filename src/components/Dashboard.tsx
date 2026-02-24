import { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../services/socket';
import { LayoutDashboard, Clock, User, Briefcase } from 'lucide-react';

interface Request {
  _id: string;
  nom: string;
  projet: string;
  type: string;
  produit: string;
  deadline: string;
}

const Dashboard = () => {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    // Fetch initial data
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests');
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();

    // Listen for real-time updates
    socket.on('newRequest', (newRequest: Request) => {
      setRequests((prev) => {
        const updated = [...prev, newRequest];
        return updated.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      });
    });

    return () => {
      socket.off('newRequest');
    };
  }, []);

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">FlowLive Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <div key={req._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase">
                {req.type}
              </span>
              <div className="flex items-center text-gray-500 text-sm italic">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(req.deadline).toLocaleDateString()}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">{req.projet}</h3>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{req.nom}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="text-sm">{req.produit}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">ID: {req._id.slice(-6)}</span>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                Dtails
              </button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            Aucune requte en attente.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
