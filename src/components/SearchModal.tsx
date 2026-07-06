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
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--notion-sidebar)] w-[90%] max-w-2xl rounded-2xl border border-[var(--notion-border)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />

        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--notion-border)]">
          <SearchIcon size={17} className="text-[var(--notion-text-light)] mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher un projet..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--notion-text)] text-[15px] placeholder:text-[var(--notion-text-light)]"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--notion-bg)] border-b border-[var(--notion-border)] overflow-x-auto scrollbar-hide">
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] px-2 py-1 rounded-lg transition-colors">
            <Filter size={11} /> Titres uniquement
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] px-2 py-1 rounded-lg transition-colors">
            Créé par <ChevronRight size={10} />
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] px-2 py-1 rounded-lg transition-colors">
            Dans <ChevronRight size={10} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              <div className="px-3 py-2 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">
                Projets ({filtered.length})
              </div>
              {filtered.map(p => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--notion-hover)] rounded-xl cursor-pointer group transition-colors"
                >
                  <div className="p-1.5 bg-[var(--surface-low)] group-hover:bg-[var(--notion-sidebar)] rounded-lg border border-[var(--notion-border)] transition-colors shrink-0">
                    <FileText size={14} className="text-[var(--notion-text-light)]" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-[var(--notion-text)] truncate">{p.name}</span>
                    {p.product && (
                      <span className="text-[11px] text-[var(--notion-text-light)] truncate">{p.product}</span>
                    )}
                  </div>
                  {p.status && (
                    <span className="text-[10px] font-semibold text-[var(--notion-text-light)] bg-[var(--notion-hover)] px-2 py-0.5 rounded-md shrink-0">
                      {p.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-[var(--surface-low)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <SearchIcon size={20} className="text-[var(--notion-text-light)]" />
              </div>
              <p className="text-sm text-[var(--notion-text-light)]">
                Aucun résultat pour{' '}
                <strong className="text-[var(--notion-text)]">"{query}"</strong>
              </p>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-[var(--notion-text-light)]">
              Commencez à taper pour rechercher…
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--notion-border)] bg-[var(--notion-bg)] flex justify-between items-center px-4 py-2">
          <span className="text-[10px] text-[var(--notion-text-light)]">↵ pour ouvrir · Échap pour fermer</span>
          <span className="text-[10px] text-[var(--notion-text-light)]">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
