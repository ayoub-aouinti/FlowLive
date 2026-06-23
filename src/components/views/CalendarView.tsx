import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, User as UserIcon, Palmtree, AlertCircle } from 'lucide-react';
import axios from 'axios';
import type { Project, User, Leave } from '../../types';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface CalendarViewProps {
  projects: Project[];
}

// ── French holidays (Meeus/Jones/Butcher Easter algorithm) ──────────────────
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const dy = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, mo - 1, dy);
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getFrenchHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>([
    [`${year}-01-01`, 'Jour de l\'An'],
    [`${year}-05-01`, 'Fête du Travail'],
    [`${year}-05-08`, 'Victoire 1945'],
    [`${year}-07-14`, 'Fête Nationale'],
    [`${year}-08-15`, 'Assomption'],
    [`${year}-11-01`, 'Toussaint'],
    [`${year}-11-11`, 'Armistice'],
    [`${year}-12-25`, 'Noël'],
  ]);
  const easter = getEasterDate(year);
  holidays.set(toDateKey(addDays(easter, 1)), 'Lundi de Pâques');
  holidays.set(toDateKey(addDays(easter, 39)), 'Ascension');
  holidays.set(toDateKey(addDays(easter, 50)), 'Lundi de Pentecôte');
  return holidays;
}

// ── Workload thresholds ──────────────────────────────────────────────────────
const WORKLOAD = {
  green:  { bg: 'bg-emerald-50  dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300', label: '< 4h' },
  orange: { bg: 'bg-amber-50    dark:bg-amber-950/40',   badge: 'bg-amber-100  text-amber-800  dark:bg-amber-900/60  dark:text-amber-300',  label: '4–6h' },
  red:    { bg: 'bg-rose-50     dark:bg-rose-950/40',    badge: 'bg-rose-100   text-rose-800   dark:bg-rose-900/60   dark:text-rose-300',   label: '7–8h' },
};

const WORKER_PALETTE = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#10b981','#f43f5e','#3b82f6','#a855f7','#06b6d4'];

// ── Month/day labels ─────────────────────────────────────────────────────────
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function cellKey(day: number, month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────

const CalendarView: React.FC<CalendarViewProps> = ({ projects }) => {
  const { token, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  const [workers, setWorkers] = useState<User[]>([]);
  const [leaves, setLeaves]   = useState<Leave[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState<{
    userId: string; startDate: string; endDate: string; type: Leave['type'];
  }>({ userId: '', startDate: '', endDate: '', type: 'congé' });

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const holidays = getFrenchHolidays(year);

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
    });
    setShowModal(true);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/leaves`, leaveForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[var(--notion-bg)] select-none animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--notion-border)] bg-[var(--notion-sidebar)]">

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

          {/* Worker filter — only for chef or chef de produit */}
          {workers.length > 0 && (
            <label className="flex items-center gap-1.5 border border-[var(--notion-border)] rounded-lg px-2 py-1.5 bg-[var(--notion-bg)] cursor-pointer">
              <UserIcon size={13} className="text-[var(--notion-text-light)]" />
              <select
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
                className="text-xs bg-transparent text-[var(--notion-text)] focus:outline-none cursor-pointer"
              >
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
      <div className="grid grid-cols-7 border-b border-[var(--notion-border)]">
        {DAYS.map((d, i) => (
          <div key={d}
            className={`py-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-[var(--notion-border)] last:border-r-0
              ${i === 0 || i === 6
                ? 'text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50'
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
          const holiday   = isHoliday(cell.day, cell.month, cell.year);
          const today     = isToday(cell.day, cell.month, cell.year);
          const dayProjs  = cell.current ? projectsForDay(cell.day, cell.month, cell.year) : [];
          const dayLeaves = cell.current ? leavesForDay(cell.day, cell.month, cell.year) : [];
          const hours     = cell.current && selectedWorkerId !== 'all' ? workloadHours(cell.day, cell.month, cell.year) : 0;
          const wLevel    = selectedWorkerId !== 'all' ? workloadLevel(hours) : null;
          const holidayLabel = holidays.get(key);

          // Background
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
              {dayLeaves.map(l => (
                <div key={l.id}
                  className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-0.5 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  title={`${l.userName} — ${l.type} (cliquer pour supprimer)`}
                  onClick={() => {
                    const canDelete = isChef || l.userId === user?._id;
                    if (canDelete) handleDeleteLeave(l.id, l.userName || l.userId);
                  }}>
                  <Palmtree size={8} className="flex-shrink-0" />
                  <span className="truncate">{l.userName || 'Congé'}</span>
                </div>
              ))}

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
          <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-2xl shadow-2xl w-full max-w-sm"
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
                  onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value as Leave['type'] }))}
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

              <button type="submit"
                className="w-full py-2.5 bg-[var(--brand-accent)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
