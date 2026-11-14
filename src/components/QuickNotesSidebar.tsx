import React from 'react';
import { Send, StickyNote, Trash2 } from 'lucide-react';
import type { QuickNote } from '../domain/types';

interface QuickNotesSidebarProps {
  draft: string;
  notes: QuickNote[];
  onChangeDraft: (text: string) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

export const QuickNotesSidebar: React.FC<QuickNotesSidebarProps> = ({
  draft,
  notes,
  onChangeDraft,
  onAddNote,
  onDeleteNote,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddNote();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (draft.trim()) {
        onAddNote();
      }
    }
  };

  return (
    <section
      aria-labelledby="quick-notes-heading"
      className="border-t border-slate-200 pt-3.5"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5 text-slate-400" />
          <h2 id="quick-notes-heading" className="text-xs font-semibold text-slate-700">
            Note rapide
          </h2>
        </div>
        {notes.length > 0 && (
          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            {notes.length}
          </span>
        )}
      </div>

      <p className="mt-0.5 px-2 text-[11px] leading-snug text-slate-400">
        Riflessioni personali · fuori dal piano
      </p>

      <form onSubmit={handleSubmit} className="mt-2 px-2 space-y-2">
        <label htmlFor="quick-notes-input" className="sr-only">
          Scrivi una riflessione personale
        </label>
        <textarea
          id="quick-notes-input"
          rows={2}
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Appunta idee, dubbi o feedback da interviste..."
          className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">Salvataggio auto</span>
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Invia nota rapida"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:border disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 whitespace-nowrap shrink-0"
          >
            <Send className="h-3 w-3" />
            Invia
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <ul
          aria-label="Elenco note rapide salvate"
          className="mt-2.5 max-h-44 space-y-1.5 overflow-y-auto px-2"
        >
          {notes.map((note) => {
            const dateLabel = new Date(note.createdAt).toLocaleString('it-IT', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li
                key={note.id}
                className="group rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs"
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-700">
                  {note.text}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span className="tabular-nums">{dateLabel}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label={`Elimina nota del ${dateLabel}`}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
