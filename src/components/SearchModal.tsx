import React, { useState } from 'react';
import { Search as SearchIcon, X, FileText, Filter, ChevronRight } from 'lucide-react';
import type { Project } from '../types';

interface SearchModalProps {
  onClose: () => void;
  projects: Project[];
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose, projects }) => {
  const [query, setQuery] = useState('');

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.product?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/5 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white w-[90%] max-w-2xl rounded-xl shadow-2xl border border-[#ececeb] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#ececeb]">
          <SearchIcon size={18} className="text-[#9b9a97] mr-3" />
          <input 
            autoFocus
            type="text"
            placeholder="Recherchez dans MédiS..."
            className="flex-1 bg-transparent border-none outline-none text-[#37352f] text-[16px]"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-[#efefed] rounded text-[#9b9a97]"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 bg-[#f7f7f5] border-b border-[#ececeb] overflow-x-auto scrollbar-hide">
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#9b9a97] hover:bg-[#efefed] px-2 py-1 rounded transition-colors">
            <Filter size={12} />
            Titres uniquement
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#9b9a97] hover:bg-[#efefed] px-2 py-1 rounded transition-colors">
            Créé par
            <ChevronRight size={10} />
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#9b9a97] hover:bg-[#efefed] px-2 py-1 rounded transition-colors">
            Dans
            <ChevronRight size={10} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              <div className="px-3 py-2 text-[11px] font-bold text-[#91918e] uppercase tracking-wider">Aujourd'hui</div>
              {filtered.map(p => (
                <div key={p._id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#efefed] rounded-lg cursor-pointer group transition-colors">
                  <div className="p-1.5 bg-[#efefed] group-hover:bg-white rounded border border-[#ececeb] transition-colors">
                    <FileText size={16} className="text-[#37352f]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[#37352f] truncate">{p.name}</span>
                    <span className="text-[11px] text-[#91918e] truncate">
                      Planning Département Digital MédiS et Nou... / Planning Département...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#9b9a97] text-sm italic">
              Aucun résultat trouvé pour "{query}"
            </div>
          )}
        </div>

        <div className="p-2 border-t border-[#ececeb] bg-[#f7f7f5] flex justify-between items-center px-4 py-2">
           <span className="text-[10px] text-[#9b9a97]">Entrée pour ouvrir, Esc pour fermer</span>
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#9b9a97]">Recherche récente</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
