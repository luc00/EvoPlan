import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Flame,
  Loader2,
  Play,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import {
  calculateUnitEconomicsImpact,
  PRESET_SCENARIOS,
  SECTION_META,
} from '../domain/planLogic';
import type {
  FinancialAssumptions,
  PlanVersion,
  StressTestResult,
  StressTestScenario,
} from '../domain/types';

interface StressTestModuleProps {
  currentVersion: PlanVersion;
  assumptions: FinancialAssumptions;
  stressTests: StressTestResult[];
  isSimulating: boolean;
  streamStatus: string | null;
  onUpdateAssumptions: (next: FinancialAssumptions) => void;
  onRunSimulation: (scenario: StressTestScenario, customPrompt: string) => Promise<void>;
  onApplyAdaptation: (testId: string, adaptationId: string) => void;
}

export const StressTestModule: React.FC<StressTestModuleProps> = ({
  currentVersion,
  assumptions,
  stressTests,
  isSimulating,
  streamStatus,
  onUpdateAssumptions,
  onRunSimulation,
  onApplyAdaptation,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const selectedScenario =
    PRESET_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? PRESET_SCENARIOS[0];

  const livePreview = useMemo(
    () => calculateUnitEconomicsImpact(assumptions, selectedScenario.parameters),
    [assumptions, selectedScenario.parameters]
  );

  const latestResult = stressTests[0] ?? null;

  const handleAssumptionChange = (field: keyof FinancialAssumptions, raw: string) => {
    const num = Math.max(0, Number(raw) || 0);
    onUpdateAssumptions({
      ...assumptions,
      [field]: num,
    });
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRunSimulation(selectedScenario, customPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Top Financial Assumptions Panel */}
      <section aria-labelledby="assumptions-heading" className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 id="assumptions-heading" className="text-base font-semibold text-slate-900">
              Ipotesi Finanziarie di Base · {currentVersion.versionLabel}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Regola i parametri economici correnti per calcolare l’impatto reale degli scenari di stress.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
            <span>
              LTV/CAC base: <strong className="font-mono text-slate-900">{livePreview.baselineLtvCac}x</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Runway base: <strong className="font-mono text-slate-900">{livePreview.baselineRunwayMonths} mesi</strong>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label htmlFor="st-cac" className="block text-xs font-medium text-slate-600">
              CAC stimato (€)
            </label>
            <input
              id="st-cac"
              type="number"
              min={1}
              value={assumptions.cacEur}
              onChange={(e) => handleAssumptionChange('cacEur', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="st-ltv" className="block text-xs font-medium text-slate-600">
              LTV stimato (€)
            </label>
            <input
              id="st-ltv"
              type="number"
              min={1}
              value={assumptions.ltvEur}
              onChange={(e) => handleAssumptionChange('ltvEur', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="st-burn" className="block text-xs font-medium text-slate-600">
              Burn mensile (€)
            </label>
            <input
              id="st-burn"
              type="number"
              min={100}
              step={500}
              value={assumptions.monthlyBurnEur}
              onChange={(e) => handleAssumptionChange('monthlyBurnEur', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="st-rev" className="block text-xs font-medium text-slate-600">
              Ricavi mensili (€)
            </label>
            <input
              id="st-rev"
              type="number"
              min={0}
              step={200}
              value={assumptions.monthlyRevenueEur}
              onChange={(e) => handleAssumptionChange('monthlyRevenueEur', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="st-cash" className="block text-xs font-medium text-slate-600">
              Cassa disponibile (€)
            </label>
            <input
              id="st-cash"
              type="number"
              min={1000}
              step={5000}
              value={assumptions.cashReserveEur}
              onChange={(e) => handleAssumptionChange('cashReserveEur', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Scenario Selector + Results Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: Scenario Builder */}
        <form
          onSubmit={handleRun}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 lg:col-span-5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Scenari di Stress-Test & Simulazione
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Seleziona uno shock di mercato o scrivi una simulazione personalizzata.
            </p>
          </div>

          <div className="space-y-2.5">
            {PRESET_SCENARIOS.map((sc) => {
              const selected = sc.id === selectedScenarioId && customPrompt.trim() === '';
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setCustomPrompt('');
                  }}
                  aria-pressed={selected}
                  className={`w-full rounded-lg border p-3.5 text-left transition-colors ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{sc.title}</span>
                    <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap shrink-0">
                      {sc.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label
              htmlFor="st-custom-prompt"
              className="block text-xs font-medium text-slate-800"
            >
              Oppure simula uno scenario personalizzato
            </label>
            <textarea
              id="st-custom-prompt"
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Es. Cosa succede se un competitor lancia una versione freemium gratuita nei primi 6 mesi?"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            data-testid="run-stress-test-btn"
            disabled={isSimulating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Simulazione in corso...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Avvia Simulazione
              </>
            )}
          </button>

          {streamStatus && isSimulating && (
            <p aria-live="polite" className="text-xs text-indigo-700">
              {streamStatus}
            </p>
          )}
        </form>

        {/* Right: Simulation Output & Adaptation Plan */}
        <div className="space-y-4 lg:col-span-7">
          {!latestResult ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <Flame className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Nessuna simulazione eseguita per {currentVersion.versionLabel}
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
                Scegli uno scenario a sinistra (es. raddoppio del CAC o lancio nei primi 6 mesi) e avvia la simulazione per verificare la tenuta finanziaria e generare contromisure automatiche.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-left">
                <div>
                  <span className="text-[11px] text-slate-500">Anteprima LTV/CAC</span>
                  <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                    {livePreview.projectedLtvCac}x
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Runway Stimata</span>
                  <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                    {livePreview.projectedRunwayMonths} mesi
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Net Burn Proiettato</span>
                  <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                    {livePreview.monthlyNetBurnProjected.toLocaleString('it-IT')} €
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div data-testid="stress-test-result" className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-indigo-600">
                      Risultato Simulazione · {latestResult.source === 'gemini' ? 'Gemini AI' : 'Modello Quantitativo'}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">
                      {latestResult.scenarioTitle}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                    {new Date(latestResult.generatedAt).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                  {latestResult.summary}
                </p>

                {/* Quantitative Comparison Strip */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] text-slate-500">Runway</span>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {latestResult.projectedRunwayMonths} mesi
                    </p>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Base: {latestResult.baselineRunwayMonths}m
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] text-slate-500">Rapporto LTV/CAC</span>
                    <p
                      className={`mt-1 font-mono text-base font-semibold tabular-nums ${
                        latestResult.projectedLtvCac < 2 ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {latestResult.projectedLtvCac}x
                    </p>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Base: {latestResult.baselineLtvCac}x
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] text-slate-500">Net Burn / mese</span>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {latestResult.monthlyNetBurnProjected.toLocaleString('it-IT')} €
                    </p>
                    <span className="text-[11px] text-slate-500">Sotto stress</span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] text-slate-500">Break-Even</span>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {latestResult.projectedBreakEvenMonths
                        ? `${latestResult.projectedBreakEvenMonths} mesi`
                        : 'Non raggiunto'}
                    </p>
                    <span className="text-[11px] text-slate-500">Orizzonte stimato</span>
                  </div>
                </div>
              </div>

              {/* Vulnerabilità rilevate */}
              <div className="p-6 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <h4 className="text-xs font-semibold text-slate-900">
                    Vulnerabilità Critiche Rilevate
                  </h4>
                </div>
                <ul className="space-y-2">
                  {latestResult.risks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Piano di Adattamento */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-semibold text-slate-900">
                    Suggerimenti per Adattare il Business Plan
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {latestResult.adaptations.map((adp) => (
                    <div
                      key={adp.id}
                      className={`rounded-lg border p-3.5 ${
                        adp.applied
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="max-w-lg">
                          <p className="text-xs font-semibold text-slate-900">{adp.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{adp.detail}</p>
                          <p className="mt-1.5 text-[11px] text-slate-500">
                            Sezione target:{' '}
                            <strong className="text-slate-700">
                              {SECTION_META[adp.targetSection].label}
                            </strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={adp.applied}
                          onClick={() => onApplyAdaptation(latestResult.id, adp.id)}
                          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            adp.applied
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                          }`}
                        >
                          {adp.applied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Integrata
                            </>
                          ) : (
                            'Integra nel Piano'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Previous Stress Tests History */}
          {stressTests.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="text-xs font-semibold text-slate-900">
                Simulazioni Precedenti ({stressTests.length - 1})
              </h4>
              <div className="mt-2.5 divide-y divide-slate-100">
                {stressTests.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <span className="font-medium text-slate-800">{item.scenarioTitle}</span>
                    <div className="flex items-center gap-3 font-mono text-slate-500 tabular-nums">
                      <span>LTV/CAC: {item.projectedLtvCac}x</span>
                      <span>Runway: {item.projectedRunwayMonths}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
