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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InboxPanel: React.FC<InboxPanelProps> = ({ onClose, onNotificationRead }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const { token, user } = useAuth();

  const fetchNotifications = React.useCallback(() => {
    if (token) {
      axios
        .get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setNotifications(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  React.useEffect(() => {
    fetchNotifications();
    socket.on('notification_added', (notif: Notification) => {
      if (notif.userId === user?._id) setNotifications(prev => [notif, ...prev]);
    });
    return () => { socket.off('notification_added'); };
  }, [fetchNotifications, user?._id]);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      onNotificationRead?.();
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onNotificationRead?.();
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.filter(n => n.id !== id));
      onNotificationRead?.();
    } catch (err) { console.error(err); }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--notion-sidebar)] w-full max-w-md h-screen border-l border-[var(--notion-border)] flex flex-col animate-in slide-in-from-right duration-300"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--notion-border)]">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-[var(--notion-text)]">Boîte de réception</h2>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={markAllAsRead}
              title="Tout marquer comme lu"
              className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors"
            >
              <CheckCircle2 size={15} />
            </button>
            <button className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors">
              <Archive size={15} />
            </button>
            <button className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors">
              <MoreHorizontal size={15} />
            </button>
            <div className="w-px h-4 bg-[var(--notion-border)] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`px-4 py-3.5 border-b border-[var(--notion-border)] hover:bg-[var(--notion-hover)] cursor-pointer transition-colors group relative ${
                  !notif.read ? 'bg-[var(--surface-low)]' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      !notif.read
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--notion-hover)] text-[var(--notion-text-light)]'
                    }`}
                  >
                    {notif.title?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                      <p className={`text-sm leading-snug ${!notif.read ? 'text-[var(--notion-text)] font-semibold' : 'text-[var(--notion-text-light)]'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-[var(--notion-text-light)] whitespace-nowrap shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--notion-text-light)] leading-relaxed">{notif.message}</p>
                    <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button
                          onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                          className="text-[11px] font-semibold text-[var(--brand-secondary)] hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="text-[11px] font-semibold text-red-500 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {!notif.read && (
                    <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full absolute top-5 right-3 shrink-0" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-14 h-14 bg-[var(--surface-low)] rounded-2xl flex items-center justify-center mb-4">
                <InboxIcon size={24} className="text-[var(--notion-text-light)]" />
              </div>
              <p className="text-sm font-medium text-[var(--notion-text)] mb-1">Aucune notification</p>
              <p className="text-xs text-[var(--notion-text-light)] leading-relaxed">
                Vous êtes à jour ! Les mises à jour apparaîtront ici.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--notion-border)] bg-[var(--notion-bg)] flex justify-center">
          <button className="text-xs font-medium text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors">
            Afficher les notifications archivées
          </button>
        </div>
      </div>
    </div>
  );
};

export default InboxPanel;
