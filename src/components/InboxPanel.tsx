import React from 'react';
import axios from 'axios';
import { Inbox as InboxIcon, X, CheckCircle2, Archive, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../types';
import { socket } from '../services/socket';

interface InboxPanelProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

const InboxPanel: React.FC<InboxPanelProps> = ({ onClose, onNotificationRead }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const { token, user } = useAuth();

  const fetchNotifications = React.useCallback(() => {
    if (token) {
      axios.get('http://localhost:5001/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setNotifications(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  React.useEffect(() => {
    fetchNotifications();

    socket.on('notification_added', (notif: Notification) => {
      if (notif.userId === user?._id) {
        setNotifications(prev => [notif, ...prev]);
      }
    });

    return () => {
      socket.off('notification_added');
    };
  }, [fetchNotifications, user?._id]);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      onNotificationRead?.();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onNotificationRead?.();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      onNotificationRead?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/5 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md h-screen shadow-2xl border-l border-[#ececeb] flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#ececeb]">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-[#37352f]">Boîte de réception</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-[#eb5757] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
             <button 
               onClick={markAllAsRead}
               title="Tout marquer comme lu"
               className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"
             >
               <CheckCircle2 size={16} />
             </button>
             <button className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><Archive size={16} /></button>
             <button className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><MoreHorizontal size={16} /></button>
             <button onClick={onClose} className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors ml-2"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 border-b border-[#ececeb] hover:bg-[#f7f7f5] cursor-pointer transition-colors group relative ${!notif.read ? 'bg-[#f0f7ff]/50' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs border ${
                    !notif.read ? 'bg-[#1a4f8b] text-white border-[#1a4f8b]' : 'bg-[#efefed] text-[#9b9a97] border-[#ececeb]'
                  }`}>
                    {notif.title[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm ${!notif.read ? 'text-[#37352f] font-semibold' : 'text-[#5a5a57]'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[11px] text-[#9b9a97] whitespace-nowrap ml-2">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-xs text-[#5a5a57] leading-relaxed">
                      {notif.message}
                    </div>
                    <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          className="text-[11px] font-bold text-[#1a4f8b] hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="text-[11px] font-bold text-[#eb5757] hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-[#1a4f8b] rounded-full absolute top-5 right-2" />}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <InboxIcon size={48} className="text-[#ececeb] mb-4" />
              <p className="text-sm font-medium text-[#37352f]">Aucune nouvelle notification</p>
              <p className="text-xs text-[#9b9a97] mt-1">Vous êtes à jour ! Toutes les modifications récentes apparaîtront ici.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#ececeb] bg-[#f7f7f5] flex justify-center">
           <button className="text-xs font-bold text-[#9b9a97] hover:text-[#37352f] transition-colors">Afficher les notifications archivées</button>
        </div>
      </div>
    </div>
  );
};

export default InboxPanel;
