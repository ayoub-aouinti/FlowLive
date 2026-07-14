import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, User as UserIcon, Palmtree, AlertCircle, Paperclip, Check, Clock } from 'lucide-react';
import axios from 'axios';
import type { Project, User, Leave } from '../../types';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

interface CalendarViewProps {
  projects: Project[];
}

// ── Tunisian holidays ─────────────────────────────────────────────────────────
// Fixed civil holidays (Gregorian calendar, same date every year).
const TUNISIA_FIXED_HOLIDAYS: Array<[string, string]> = [
  ['01-01', "Jour de l'An"],
  ['01-14', 'Fête de la Révolution et de la Jeunesse'],
  ['03-20', "Fête de l'Indépendance"],
  ['04-09', 'Journée des Martyrs'],
  ['05-01', 'Fête du Travail'],
  ['07-25', 'Fête de la République'],
  ['08-13', 'Fête de la Femme'],
  ['10-15', "Fête de l'Évacuation"],
];

// Islamic (Hijri) holidays — the Hijri calendar is lunar, so these dates shift
// every year and are only confirmed close to the date via official moon sighting.
// Estimated dates below, to be adjusted once each year's official calendar is published.
const TUNISIA_ISLAMIC_HOLIDAYS: Record<number, Array<[string, string]>> = {
  2024: [
    ['04-10', 'Aïd El Fitr'], ['04-11', 'Aïd El Fitr'],
    ['06-16', 'Aïd El Idha'], ['06-17', 'Aïd El Idha'], ['06-18', 'Aïd El Idha'],
    ['07-07', 'Ras El Am Hijri'],
    ['09-15', 'Mouled'],
  ],
  2025: [
    ['03-31', 'Aïd El Fitr'], ['04-01', 'Aïd El Fitr'],
    ['06-06', 'Aïd El Idha'], ['06-07', 'Aïd El Idha'], ['06-08', 'Aïd El Idha'],
    ['06-26', 'Ras El Am Hijri'],
    ['09-04', 'Mouled'],
  ],
  2026: [
    ['03-19', 'Aïd El Fitr'], ['03-20', 'Aïd El Fitr'],
    ['05-26', 'Aïd El Idha'], ['05-27', 'Aïd El Idha'], ['05-28', 'Aïd El Idha'],
    ['06-15', 'Ras El Am Hijri'],
    ['08-24', 'Mouled'],
  ],
  2027: [
    ['03-09', 'Aïd El Fitr'], ['03-10', 'Aïd El Fitr'],
    ['05-15', 'Aïd El Idha'], ['05-16', 'Aïd El Idha'], ['05-17', 'Aïd El Idha'],
    ['06-04', 'Ras El Am Hijri'],
    ['08-13', 'Mouled'],
  ],
};

function getTunisianHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  TUNISIA_FIXED_HOLIDAYS.forEach(([monthDay, label]) => {
    holidays.set(`${year}-${monthDay}`, label);
  });
  (TUNISIA_ISLAMIC_HOLIDAYS[year] || []).forEach(([monthDay, label]) => {
    holidays.set(`${year}-${monthDay}`, label);
  });
  return holidays;
}

// ── Workload thresholds ──────────────────────────────────────────────────────
const WORKLOAD = {
  green:  { bg: 'bg-emerald-50  dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300', label: '< 4h' },
  orange: { bg: 'bg-amber-50    dark:bg-amber-950/40',   badge: 'bg-amber-100  text-amber-800  dark:bg-amber-900/60  dark:text-amber-300',  label: '4–6h' },
  red:    { bg: 'bg-rose-50     dark:bg-rose-950/40',    badge: 'bg-rose-100   text-rose-800   dark:bg-rose-900/60   dark:text-rose-300',   label: '7–8h' },
};

const WORKER_PALETTE = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#10b981','#f43f5e','#3b82f6','#a855f7','#06b6d4'];

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function cellKey(day: number, month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────

interface LeaveFormState {
  userId: string;
  startDate: string;
  endDate: string;
  type: Leave['type'];
  description: string;
  attachmentBase64: string;
  attachmentName: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects }) => {
  const { token, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  const [workers, setWorkers] = useState<User[]>([]);
  const [leaves, setLeaves]   = useState<Leave[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leaveForm, setLeaveForm] = useState<LeaveFormState>({
    userId: '', startDate: '', endDate: '', type: 'congé',
    description: '', attachmentBase64: '', attachmentName: '',
  });

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const holidays = getTunisianHolidays(year);

  const isChef = user?.role === 'chef de projet' || user?.role === 'superadmin';

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/leaves`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setWorkers(res.data))
      .catch(() => {});
    fetchLeaves();
  }, [token, fetchLeaves]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; month: number; year: number; current: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--)
    cells.push({ day: prevMonthDays - i, month: month - 1, year, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month, year, current: true });
  while (cells.length < 42)
    cells.push({ day: cells.length - daysInMonth - firstWeekday + 1, month: month + 1, year, current: false });

  // ── Day helpers ────────────────────────────────────────────────────────────
  function isWeekend(day: number, m: number, y: number) {
    const dow = new Date(y, m, day).getDay();
    return dow === 0 || dow === 6;
  }
  function isHoliday(day: number, m: number, y: number) {
    return holidays.has(cellKey(day, m, y));
  }
  function isNonWorking(day: number, m: number, y: number) {
    return isWeekend(day, m, y) || isHoliday(day, m, y);
  }
  function isToday(day: number, m: number, y: number) {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === m && t.getFullYear() === y;
  }

  // ── Projects & workload ────────────────────────────────────────────────────
  function projectsForDay(day: number, m: number, y: number) {
    return projects.filter(p => {
      if (!p.deadline) return false;
      const d = new Date(p.deadline);
      if (d.getDate() !== day || d.getMonth() !== m || d.getFullYear() !== y) return false;
      if (selectedWorkerId === 'all') return true;
      const aid = typeof p.assignedTo === 'object' ? (p.assignedTo as User)?._id : p.assignedTo;
      return aid === selectedWorkerId;
    });
  }

  function workloadHours(day: number, m: number, y: number): number {
    if (isNonWorking(day, m, y)) return 0;
    return projectsForDay(day, m, y).reduce((s, p) => s + (p.estimatedHours ?? 2), 0);
  }

  function workloadLevel(hours: number): keyof typeof WORKLOAD | null {
    if (hours <= 0) return null;
    if (hours < 4)  return 'green';
    if (hours <= 6) return 'orange';
    return 'red';
  }

  // ── Leaves ─────────────────────────────────────────────────────────────────
  function leavesForDay(day: number, m: number, y: number): Leave[] {
    const key = cellKey(day, m, y);
    const filtered = leaves.filter(l => l.startDate <= key && l.endDate >= key);
    if (selectedWorkerId !== 'all') return filtered.filter(l => l.userId === selectedWorkerId);
    return filtered;
  }

  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  // ── Worker colour map ──────────────────────────────────────────────────────
  const workerColor: Record<string, string> = {};
  workers.forEach((w, i) => { workerColor[w._id] = WORKER_PALETTE[i % WORKER_PALETTE.length]; });

  // ── Leave CRUD ─────────────────────────────────────────────────────────────
  const openModal = (prefillDate?: string) => {
    setLeaveForm({
      userId: isChef ? '' : (user?._id || ''),
      startDate: prefillDate || '',
      endDate:   prefillDate || '',
      type: 'congé',
      description: '',
      attachmentBase64: '',
      attachmentName: '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLeaveForm(f => ({
        ...f,
        attachmentBase64: reader.result as string,
        attachmentName: file.name,
      }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/leaves`, leaveForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      fetchLeaves();
    } catch (err) { console.error(err); }
  };

  const handleConfirmLeave = async (leaveId: string) => {
    try {
      await axios.patch(`${API_URL}/api/leaves/${leaveId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeaves();
    } catch (err) { console.error(err); }
  };

  const handleDeleteLeave = async (leaveId: string, ownerName: string) => {
    if (!confirm(`Supprimer le congé de ${ownerName} ?`)) return;
    try {
      await axios.delete(`${API_URL}/api/leaves/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeaves();
    } catch (err) { console.error(err); }
  };

  const openAttachment = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = name;
    link.click();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-260px)] bg-[var(--notion-sidebar)] rounded-xl border border-[var(--notion-border)] select-none animate-in fade-in duration-300 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--notion-border)] bg-[var(--surface-low)]">

        {/* Left: navigation */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-[var(--notion-text)] capitalize">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-xs font-medium px-2.5 py-1 rounded border border-[var(--notion-border)] hover:bg-[var(--notion-hover)] text-[var(--notion-text)] transition-colors">
            Aujourd'hui
          </button>
        </div>

        {/* Right: legend + worker filter + add leave */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pending badge for chef */}
          {isChef && pendingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700">
              <Clock size={10} />
              {pendingCount} en attente
            </span>
          )}

          {/* Workload legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--notion-text-light)] border-r border-[var(--notion-border)] pr-3 mr-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-300 inline-block" />&lt; 4h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" />4–6h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />7–8h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />WE/Férié
            </span>
          </div>

          {/* Worker filter */}
          {workers.length > 0 && (
            <label className="flex items-center gap-1.5 border border-[var(--notion-border)] rounded-lg px-2 py-1.5 bg-[var(--notion-bg)] cursor-pointer">
              <UserIcon size={13} className="text-[var(--notion-text-light)]" />
              <select
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
                className="text-xs bg-transparent text-[var(--notion-text)] focus:outline-none cursor-pointer">
                <option value="all">Tous les collaborateurs</option>
                {workers.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </label>
          )}

          {/* Add leave button */}
          <button onClick={() => openModal()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[var(--brand-accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <Palmtree size={13} />
            Congé
          </button>
        </div>
      </div>

      {/* ── Day-of-week header ── */}
      <div className="grid grid-cols-7 border-b border-[var(--notion-border)] bg-[var(--surface-low)]">
        {DAYS.map((d, i) => (
          <div key={d}
            className={`py-2 text-center text-[10px] font-semibold uppercase tracking-wider border-r border-[var(--notion-border)] last:border-r-0
              ${i === 0 || i === 6
                ? 'text-slate-400 dark:text-slate-600'
                : 'text-[var(--notion-text-light)]'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {cells.map((cell, idx) => {
          const key       = cellKey(cell.day, cell.month, cell.year);
          const nonWork   = isNonWorking(cell.day, cell.month, cell.year);
          const today     = isToday(cell.day, cell.month, cell.year);
          const dayProjs  = cell.current ? projectsForDay(cell.day, cell.month, cell.year) : [];
          const dayLeaves = cell.current ? leavesForDay(cell.day, cell.month, cell.year) : [];
          const hours     = cell.current && selectedWorkerId !== 'all' ? workloadHours(cell.day, cell.month, cell.year) : 0;
          const wLevel    = selectedWorkerId !== 'all' ? workloadLevel(hours) : null;
          const holidayLabel = holidays.get(key);

          let bgClass = '';
          if (!cell.current) {
            bgClass = 'bg-[var(--notion-sidebar)] opacity-60';
          } else if (nonWork) {
            bgClass = 'bg-slate-100 dark:bg-slate-800/50';
          } else if (wLevel) {
            bgClass = WORKLOAD[wLevel].bg;
          }

          return (
            <div key={idx}
              className={`min-h-[100px] p-1.5 border-r border-b border-[var(--notion-border)] last:border-r-0 group relative transition-colors ${bgClass} ${!nonWork && cell.current ? 'hover:brightness-[0.97]' : ''}`}>

              {/* Day number */}
              <div className="flex items-start justify-between mb-0.5">
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none
                    ${today
                      ? 'bg-blue-500 text-white'
                      : nonWork && cell.current
                        ? 'text-slate-400 dark:text-slate-500'
                        : cell.current
                          ? 'text-[var(--notion-text)]'
                          : 'text-slate-300 dark:text-slate-600'}`}>
                    {cell.day}
                  </span>
                  {holidayLabel && cell.current && (
                    <span className="text-[8px] text-rose-400 font-semibold leading-tight mt-0.5 truncate max-w-[56px]" title={holidayLabel}>
                      {holidayLabel}
                    </span>
                  )}
                </div>

                {/* Quick add-leave button on hover */}
                {!nonWork && cell.current && (
                  <button
                    onClick={() => openModal(key)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[var(--notion-hover)] rounded text-[var(--notion-text-light)] transition-all"
                    title="Planifier un congé">
                    <Plus size={11} />
                  </button>
                )}
              </div>

              {/* Workload badge */}
              {wLevel && hours > 0 && cell.current && !nonWork && (
                <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded mb-0.5 ${WORKLOAD[wLevel].badge}`}>
                  {wLevel === 'red' && <AlertCircle size={8} />}
                  {hours}h
                </span>
              )}

              {/* Leaves */}
              {dayLeaves.map(l => {
                const isPending = l.status === 'pending';
                const isMine = l.userId === user?._id;
                const canDelete = isChef || isMine;
                const tooltip = [
                  l.userName,
                  l.type,
                  l.description,
                  isPending ? '⏳ En attente de validation' : '✓ Confirmé'
                ].filter(Boolean).join(' — ');

                return (
                  <div key={l.id}
                    title={tooltip}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium mb-0.5 transition-colors
                      ${isPending
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-dashed border-amber-400 dark:border-amber-600'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>

                    <Palmtree size={8} className="flex-shrink-0" />
                    <span className="truncate flex-1">{l.userName || 'Congé'}</span>

                    {/* Attachment indicator */}
                    {l.attachmentBase64 && (
                      <button
                        onClick={e => { e.stopPropagation(); openAttachment(l.attachmentBase64!, l.attachmentName || 'pièce-jointe'); }}
                        title="Télécharger la pièce jointe"
                        className="flex-shrink-0 opacity-70 hover:opacity-100">
                        <Paperclip size={7} />
                      </button>
                    )}

                    {/* Confirm button (chef only, pending only) */}
                    {isChef && isPending && (
                      <button
                        onClick={e => { e.stopPropagation(); handleConfirmLeave(l.id); }}
                        title="Confirmer le congé"
                        className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 ml-0.5">
                        <Check size={9} />
                      </button>
                    )}

                    {/* Delete button */}
                    {canDelete && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteLeave(l.id, l.userName || l.userId); }}
                        title="Supprimer"
                        className="flex-shrink-0 opacity-50 hover:opacity-100 hover:text-rose-500 ml-0.5">
                        <X size={8} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Projects */}
              <div className="space-y-0.5 overflow-y-auto max-h-[55px] scrollbar-hide">
                {dayProjs.map(p => {
                  const aid = typeof p.assignedTo === 'object' ? (p.assignedTo as User)?._id : p.assignedTo;
                  const color = (aid && workerColor[aid]) || '#94a3b8';
                  return (
                    <div key={p._id}
                      className="px-1 py-0.5 rounded text-[9px] flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity"
                      style={{ backgroundColor: `${color}22`, borderLeft: `2px solid ${color}` }}>
                      <span className="truncate font-medium text-[var(--notion-text)]">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Leave modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl w-full max-w-sm" style={{ boxShadow: 'var(--shadow-elevated)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--notion-border)]">
              <div className="flex items-center gap-2 font-bold text-[var(--notion-text)]">
                <Palmtree size={16} className="text-blue-500" />
                Planifier un congé
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-5 space-y-4">

              {/* Collaborateur (chef only) */}
              {isChef ? (
                <div>
                  <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">Collaborateur</label>
                  <select
                    value={leaveForm.userId}
                    onChange={e => setLeaveForm(f => ({ ...f, userId: e.target.value }))}
                    required
                    className="w-full border border-[var(--notion-border)] rounded-lg px-3 py-2 text-sm bg-[var(--notion-bg)] text-[var(--notion-text)] focus:outline-none focus:border-[var(--brand-accent)]">
                    <option value="">Sélectionner...</option>
                    {workers.map(w => (
                      <option key={w._id} value={w._id}>{w.name} — {w.role}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-[var(--notion-text-light)] bg-[var(--notion-hover)] rounded-lg px-3 py-2">
                  Congé pour : <strong className="text-[var(--notion-text)]">{user?.name}</strong>
                </p>
              )}

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">Type</label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value as Leave['type'], attachmentBase64: '', attachmentName: '' }))}
                  className="w-full border border-[var(--notion-border)] rounded-lg px-3 py-2 text-sm bg-[var(--notion-bg)] text-[var(--notion-text)] focus:outline-none focus:border-[var(--brand-accent)]">
                  <option value="congé">Congé payé</option>
                  <option value="maladie">Arrêt maladie</option>
                  <option value="autre">Autre absence</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">Début</label>
                  <input type="date" required
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))}
                    className="w-full border border-[var(--notion-border)] rounded-lg px-2 py-2 text-sm bg-[var(--notion-bg)] text-[var(--notion-text)] focus:outline-none focus:border-[var(--brand-accent)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">Fin</label>
                  <input type="date" required
                    value={leaveForm.endDate}
                    min={leaveForm.startDate}
                    onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-[var(--notion-border)] rounded-lg px-2 py-2 text-sm bg-[var(--notion-bg)] text-[var(--notion-text)] focus:outline-none focus:border-[var(--brand-accent)]" />
                </div>
              </div>

              {/* Description (optional) */}
              <div>
                <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">
                  Description <span className="font-normal opacity-60">(optionnelle)</span>
                </label>
                <textarea
                  value={leaveForm.description}
                  onChange={e => setLeaveForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Motif, précisions..."
                  className="w-full border border-[var(--notion-border)] rounded-lg px-3 py-2 text-sm bg-[var(--notion-bg)] text-[var(--notion-text)] focus:outline-none focus:border-[var(--brand-accent)] resize-none" />
              </div>

              {/* Attachment (only for arrêt maladie) */}
              {leaveForm.type === 'maladie' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--notion-text-light)] block mb-1">
                    Justificatif médical <span className="font-normal opacity-60">(optionnel)</span>
                  </label>
                  <label className={`flex items-center gap-2 border border-dashed rounded-lg px-3 py-2.5 cursor-pointer transition-colors
                    ${leaveForm.attachmentName
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-[var(--notion-border)] hover:border-[var(--brand-accent)] bg-[var(--notion-hover)]'}`}>
                    <Paperclip size={14} className={leaveForm.attachmentName ? 'text-emerald-600' : 'text-[var(--notion-text-light)]'} />
                    <span className="text-xs text-[var(--notion-text-light)] flex-1 truncate">
                      {uploading ? 'Chargement...' : leaveForm.attachmentName || 'PDF, image (max 10 Mo)'}
                    </span>
                    {leaveForm.attachmentName && (
                      <button type="button"
                        onClick={e => { e.preventDefault(); setLeaveForm(f => ({ ...f, attachmentBase64: '', attachmentName: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-rose-400 hover:text-rose-600">
                        <X size={13} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleFileChange} />
                  </label>
                </div>
              )}

              {/* Info pour non-chef */}
              {!isChef && (
                <p className="text-[10px] text-[var(--notion-text-light)] flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <Clock size={10} className="text-amber-500 flex-shrink-0" />
                  Votre demande sera soumise au chef de projet pour validation.
                </p>
              )}

              <button type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-[var(--brand-accent)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                Envoyer la demande
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;