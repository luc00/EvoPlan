import React, { useState } from 'react';
import { ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { OnboardingInput, StartupPhase } from '../domain/types';

interface OnboardingModalProps {
  isOpen: boolean;
  canClose: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onSubmit: (input: OnboardingInput) => Promise<void>;
}

const PHASE_OPTIONS: Array<{ value: StartupPhase; label: string; detail: string }> = [
  { value: 'idea', label: "Solo un'idea", detail: 'Validazione problema e primi test' },
  { value: 'mvp', label: 'Prototipo / MVP', detail: 'Primi utenti beta o design partner' },
  { value: 'traction', label: 'Primi clienti / Traction', detail: 'Ricavi iniziali e iterazione canali' },
  { value: 'growth', label: 'In crescita / Scale-up', detail: 'Ottimizzazione CAC, team e scala' },
];

const QUICK_PRESETS: Array<{ label: string; data: OnboardingInput }> = [
  {
    label: 'Logistica B2B AI',
    data: {
      projectName: 'LogiFlow AI',
      oneLiner: 'Piattaforma predittiva per ottimizzare le consegne ultimo miglio delle PMI manifatturiere',
      idealCustomer: 'Responsabili logistica di PMI italiane tra 20 e 150 dipendenti',
      currentPhase: 'mvp',
    },
  },
  {
    label: 'SaaS Energia Edifici',
    data: {
      projectName: 'WattSense',
      oneLiner: 'Software di monitoraggio e riduzione automatica dei consumi energetici per catene retail',
      idealCustomer: 'Energy manager e direttori operazioni di catene con almeno 10 punti vendita',
      currentPhase: 'traction',
    },
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  canClose,
  isGenerating,
  onClose,
  onSubmit,
}) => {
  const [projectName, setProjectName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [idealCustomer, setIdealCustomer] = useState('');
  const [currentPhase, setCurrentPhase] = useState<StartupPhase>('idea');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oneLiner.trim().length < 8) {
      setError("Descrivi la tua idea in almeno una frase chiara (minimo 8 caratteri).");
      return;
    }
    if (idealCustomer.trim().length < 4) {
      setError("Specifica chi è il tuo cliente ideale.");
      return;
    }
    setError(null);
    await onSubmit({
      projectName: projectName.trim() || undefined,
      oneLiner: oneLiner.trim(),
      idealCustomer: idealCustomer.trim(),
      currentPhase,
    });
  };

  const applyPreset = (data: OnboardingInput) => {
    setProjectName(data.projectName ?? '');
    setOneLiner(data.oneLiner);
    setIdealCustomer(data.idealCustomer);
    setCurrentPhase(data.currentPhase);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-medium text-indigo-600">
                  Onboarding Guidato · Generazione v1.0
                </p>
                <h2
                  id="onboarding-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
                >
                  Trasforma la tua idea nella prima versione del Business Plan
                </h2>
              </div>
              {canClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi onboarding"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-6 py-5" noValidate>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <span className="text-xs text-slate-500">
                  Compila i 3 punti essenziali oppure carica un esempio rapido:
                </span>
                <div className="flex items-center gap-2">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.data)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 whitespace-nowrap shrink-0"
                    >
                      Esempio: {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="ob-project-name"
                  className="block text-sm font-medium text-slate-800"
                >
                  Nome progetto <span className="font-normal text-slate-400">(opzionale)</span>
                </label>
                <input
                  id="ob-project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Es. LogiFlow AI"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="ob-one-liner"
                  className="block text-sm font-medium text-slate-900"
                >
                  1. Qual è la tua idea in una frase? <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="ob-one-liner"
                  rows={2}
                  required
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  placeholder="Es. Piattaforma B2B che automatizza la gestione delle consegne ultimo miglio riducendo i costi di carburante."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="ob-ideal-customer"
                  className="block text-sm font-medium text-slate-900"
                >
                  2. Chi è il tuo cliente ideale? <span className="text-rose-600">*</span>
                </label>
                <input
                  id="ob-ideal-customer"
                  type="text"
                  required
                  value={idealCustomer}
                  onChange={(e) => setIdealCustomer(e.target.value)}
                  placeholder="Es. Responsabili logistica di PMI manifatturiere tra 20 e 150 dipendenti"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-900">
                  3. In che fase sei ora? <span className="text-rose-600">*</span>
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PHASE_OPTIONS.map((opt) => {
                    const selected = currentPhase === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCurrentPhase(opt.value)}
                        aria-pressed={selected}
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50/60 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="mt-0.5 text-xs text-slate-500">{opt.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                {canClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    Annulla
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generazione v1.0 in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Genera Business Plan v1.0
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
