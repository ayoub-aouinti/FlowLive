import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Project } from '../../types';

interface CalendarViewProps {
  projects: Project[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];

  const daysOfWeek = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const calendarDays = [];
  // Days from previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ 
      day: prevMonthDays - i, 
      month: month - 1, 
      year: year,
      currentMonth: false 
    });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ 
      day: i, 
      month: month, 
      year: year,
      currentMonth: true 
    });
  }

  // Days from next month
  const remainingSlots = 42 - calendarDays.length;
  for (let i = 1; i <= remainingSlots; i++) {
    calendarDays.push({ 
      day: i, 
      month: month + 1, 
      year: year,
      currentMonth: false 
    });
  }

  const getProjectsForDay = (day: number, m: number, y: number) => {
    return projects.filter(p => {
      if (!p.deadline) return false;
      const d = new Date(p.deadline);
      return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  return (
    <div className="flex flex-col h-full bg-white select-none animate-in fade-in duration-500">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-2 py-4 border-b border-[#ececeb]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-[#37352f] first-letter:uppercase">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={goToToday}
            className="text-sm font-medium text-[#37352f] hover:bg-[#efefed] px-2 py-1 rounded transition-colors border border-[#ececeb]"
          >
            Aujourd'hui
          </button>
        </div>
        <div className="flex items-center gap-2">
            {/* Action buttons could go here */}
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-[#ececeb]">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center text-[11px] font-bold text-[#91918e] uppercase tracking-wider border-r border-[#ececeb] last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
        {calendarDays.map((dateObj, idx) => {
          const dayProjects = getProjectsForDay(dateObj.day, dateObj.month, dateObj.year);
          return (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 border-r border-b border-[#ececeb] last:border-r-0 group hover:bg-[#fbfbfa] transition-colors ${!dateObj.currentMonth ? 'bg-[#f7f7f5]/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday(dateObj.day, dateObj.month, dateObj.year) 
                    ? 'bg-[#eb5757] text-white font-bold' 
                    : dateObj.currentMonth ? 'text-[#37352f]' : 'text-[#9b9a97]'
                }`}>
                  {dateObj.day}
                </span>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#efefed] rounded transition-all text-[#9b9a97]">
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayProjects.map(p => (
                  <div 
                    key={p._id}
                    className="px-1.5 py-0.5 rounded bg-white border border-[#ececeb] shadow-sm flex items-center gap-1.5 cursor-pointer hover:border-[#9b9a97] transition-all group/item"
                  >
                    <div className={`w-2 h-2 rounded-full ${p.priority === 'Haute' ? 'bg-[#eb5757]' : p.priority === 'Moyenne' ? 'bg-[#f2994a]' : 'bg-[#27ae60]'}`} />
                    <span className="text-[10px] text-[#37352f] font-medium truncate flex-1">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
