import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  calculateSectionCompleteness,
  countWords,
  SECTION_META,
  SECTION_ORDER,
  STAGE_DEFINITIONS,
} from '../domain/planLogic';
import type {
  CoachAnalysis,
  PlanSectionKey,
  PlanVersion,
} from '../domain/types';

interface WorkspaceLabProps {
  currentVersion: PlanVersion;
  focusSection: PlanSectionKey | null;
  isAnalyzingCoach: boolean;
  isEvolving: boolean;
  streamStatus: string | null;
  coachWarning: string | null;
  onUpdateSection: (key: PlanSectionKey, value: string) => void;
  onAnalyzeCoach: () => Promise<void>;
  onApplyCoachAction: (actionId: string) => void;
  onUpdateQuestionAnswer: (questionId: string, answer: string) => void;
  onEvolvePlan: () => Promise<void>;
  onViewTimeline: () => void;
}

export const WorkspaceLab: React.FC<WorkspaceLabProps> = ({
  currentVersion,
  focusSection,
  isAnalyzingCoach,
  isEvolving,
  streamStatus,
  coachWarning,
  onUpdateSection,
  onAnalyzeCoach,
  onApplyCoachAction,
  onUpdateQuestionAnswer,
  onEvolvePlan,
  onViewTimeline,
}) => {
  const [stageFilter, setStageFilter] = useState<'all' | number>('all');
  const sectionRefs = useRef<Partial<Record<PlanSectionKey, HTMLTextAreaElement | null>>>({});

  useEffect(() => {
    if (focusSection && sectionRefs.current[focusSection]) {
      setStageFilter('all');
      const el = sectionRefs.current[focusSection];
      setTimeout(() => {
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }, 60);
    }
  }, [focusSection]);

  const coach: CoachAnalysis | undefined = currentVersion.coachAnalysis;
  const answeredCount = coach
    ? coach.questions.filter((q) => q.answer.trim().length > 2).length
    : 0;

  const visibleSections = SECTION_ORDER.filter((key) => {
    if (stageFilter === 'all') return true;
    const stage = STAGE_DEFINITIONS.find((s) => s.stepNumber === stageFilter);
    return stage ? stage.linkedSections.includes(key) : true;
  });

  return (
    <div className="space-y-4">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Filtra sezioni:</span>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                stageFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutte (7)
            </button>
            {STAGE_DEFINITIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStageFilter(st.stepNumber)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  stageFilter === st.stepNumber
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Step {st.stepNumber}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
          <span>
            Versione attiva: <strong className="font-mono text-slate-900">{currentVersion.versionLabel}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Solidità: <strong className="font-mono text-slate-900">{currentVersion.solidityScore}/100</strong>
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onViewTimeline}
            className="font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0"
          >
            Vedi Timeline
          </button>
        </div>
      </div>

      {/* Two-Column Split: Left Structured Editor | Right AI Business Coach */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Structured Editor */}
        <section
          aria-label="Editor Strutturato del Business Plan"
          className="space-y-4 lg:col-span-7"
        >
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
            <div className="px-6 py-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Editor Strutturato del Piano
                </h2>
                <p className="text-xs text-slate-500">
                  Ogni modifica aggiorna in tempo reale il Punteggio di Solidità e si salva automaticamente.
                </p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                Salvataggio automatico
              </span>
            </div>

            {visibleSections.map((key) => {
              const meta = SECTION_META[key];
              const value = currentVersion.sections[key] ?? '';
              const completeness = calculateSectionCompleteness(value);
              const words = countWords(value);

              return (
                <div key={key} className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label
                        htmlFor={`section-${key}`}
                        className="text-sm font-semibold text-slate-900"
                      >
                        {meta.label}
                      </label>
                      <p className="mt-0.5 text-xs text-slate-500">{meta.promptHint}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs tabular-nums">
                      <span className="font-mono text-slate-500">{words} parole</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span
                        className={`font-mono font-medium ${
                          completeness >= 75
                            ? 'text-emerald-600'
                            : completeness >= 45
                              ? 'text-indigo-600'
                              : 'text-amber-600'
                        }`}
                      >
                        {completeness}%
                      </span>
                    </div>
                  </div>

                  <textarea
                    id={`section-${key}`}
                    ref={(el) => {
                      sectionRefs.current[key] = el;
                    }}
                    rows={5}
                    value={value}
                    onChange={(e) => onUpdateSection(key, e.target.value)}
                    placeholder={`Compila la sezione ${meta.label}...`}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: AI Business Coach */}
        <aside
          aria-label="AI Business Coach"
          className="space-y-4 lg:col-span-5 lg:sticky lg:top-6"
        >
          <div className="rounded-xl border border-slate-200 bg-white">
            {/* Coach Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    AI Business Coach
                  </h2>
                  {coach && (
                    <span className="text-xs text-slate-400">
                      · {coach.source === 'gemini' ? 'Gemini Live' : 'Motore Strategico'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Analisi critica, rischi nascosti e domande per sbloccare il livello successivo.
                </p>
              </div>

              <button
                type="button"
                onClick={onAnalyzeCoach}
                disabled={isAnalyzingCoach || isEvolving}
                aria-label="Rianalizza business plan con AI Business Coach"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isAnalyzingCoach ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {isAnalyzingCoach ? 'Analisi...' : 'Analizza Piano'}
              </button>
            </div>

            {/* Streaming Feedback Banner */}
            {(isAnalyzingCoach || isEvolving || streamStatus) && (
              <div
                aria-live="polite"
                className="flex items-center gap-2.5 border-b border-indigo-100 bg-indigo-50/70 px-6 py-2.5 text-xs text-indigo-800"
              >
                {(isAnalyzingCoach || isEvolving) && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-600" />
                )}
                <span>{streamStatus}</span>
              </div>
            )}

            {coachWarning && (
              <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
                {coachWarning}
              </div>
            )}

            {!coach ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-600">
                  Avvia l’analisi per ricevere 3 azioni concrete, rischi critici e domande strategiche.
                </p>
                <button
                  type="button"
                  onClick={onAnalyzeCoach}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Avvia Analisi Coach
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {/* Summary */}
                <div className="px-6 py-4">
                  <p className="text-xs leading-relaxed text-slate-700">{coach.summary}</p>
                </div>

                {/* 3 Azioni Concrete di Miglioramento */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900">
                      3 Azioni Concrete di Miglioramento
                    </h3>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {coach.actions.filter((a) => a.applied).length}/3 applicate
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {coach.actions.map((action, idx) => (
                      <div
                        key={action.id}
                        className={`rounded-lg border p-3.5 transition-colors ${
                          action.applied
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : 'border-slate-200 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {idx + 1}. {action.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {action.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500">
                            Sezione: <strong className="text-slate-700">{SECTION_META[action.targetSection].shortLabel}</strong>
                          </span>
                          <button
                            type="button"
                            disabled={action.applied}
                            onClick={() => onApplyCoachAction(action.id)}
                            aria-label={`Applica suggerimento: ${action.title}`}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                              action.applied
                                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                            }`}
                          >
                            {action.applied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Applicata
                              </>
                            ) : (
                              <>
                                Applica al piano
                                <ArrowUpRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Punti Ciechi / Rischi */}
                <div className="px-6 py-4 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    <h3 className="text-xs font-semibold text-slate-900">
                      Punti Ciechi e Rischi
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {coach.blindSpots.map((spot) => (
                      <li
                        key={spot.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">{spot.title}</span>
                          <span
                            className={`inline-flex items-center gap-1 font-medium whitespace-nowrap shrink-0 ${
                              spot.severity === 'high' ? 'text-rose-700' : 'text-amber-700'
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {spot.severity === 'high' ? 'Rischio alto' : 'Attenzione'}
                          </span>
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">{spot.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Domande Strategiche */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900">
                      Domande Strategiche per il Livello Successivo
                    </h3>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {answeredCount}/{coach.questions.length} risposte
                    </span>
                  </div>

                  <div className="space-y-3">
                    {coach.questions.map((q, idx) => (
                      <div key={q.id} className="space-y-1.5">
                        <label
                          htmlFor={`coach-q-${q.id}`}
                          className="block text-xs font-medium text-slate-800"
                        >
                          {idx + 1}. {q.question}
                        </label>
                        <textarea
                          id={`coach-q-${q.id}`}
                          rows={2}
                          value={q.answer}
                          onChange={(e) => onUpdateQuestionAnswer(q.id, e.target.value)}
                          placeholder={q.hint}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Evolution CTA */}
                <div className="bg-slate-50/80 px-6 py-4 rounded-b-xl">
                  <button
                    type="button"
                    data-testid="evolve-plan-btn"
                    onClick={onEvolvePlan}
                    disabled={isEvolving || isAnalyzingCoach}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isEvolving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Evoluzione in corso...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Evolvi questo Piano
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Unisce le sezioni attuali alle tue risposte per generare la versione successiva nello storico.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
