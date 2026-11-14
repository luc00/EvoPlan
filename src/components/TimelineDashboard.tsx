import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitCompare,
  History,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  computeSectionDiff,
  computeStageProgress,
  PHASE_LABELS,
  SECTION_META,
} from '../domain/planLogic';
import type { PlanSectionKey, PlanVersion, StartupProject } from '../domain/types';

interface TimelineDashboardProps {
  project: StartupProject;
  currentVersion: PlanVersion;
  onOpenWorkspace: (focusSection?: PlanSectionKey) => void;
  onSelectVersion: (versionId: string) => void;
  onOpenStressTest: () => void;
}

export const TimelineDashboard: React.FC<TimelineDashboardProps> = ({
  project,
  currentVersion,
  onOpenWorkspace,
  onSelectVersion,
  onOpenStressTest,
}) => {
  const { stages, globalProgressPct, completedCount } = useMemo(
    () =>
      computeStageProgress(
        currentVersion.sections,
        currentVersion.solidityScore,
        project.versions.length
      ),
    [currentVersion.sections, currentVersion.solidityScore, project.versions.length]
  );

  const [compareLeftId, setCompareLeftId] = useState<string>(
    project.versions[0]?.id ?? currentVersion.id
  );
  const [compareRightId, setCompareRightId] = useState<string>(currentVersion.id);
  const [showCompare, setShowCompare] = useState<boolean>(project.versions.length > 1);

  useEffect(() => {
    setCompareLeftId(project.versions[0]?.id ?? currentVersion.id);
    setCompareRightId(currentVersion.id);
    if (project.versions.length > 1) {
      setShowCompare(true);
    }
  }, [project.id, project.versions, currentVersion.id]);

  const leftVersion =
    project.versions.find((v) => v.id === compareLeftId) ?? project.versions[0];
  const rightVersion =
    project.versions.find((v) => v.id === compareRightId) ?? currentVersion;

  const diffs = useMemo(() => {
    if (!leftVersion || !rightVersion) return [];
    return computeSectionDiff(leftVersion.sections, rightVersion.sections);
  }, [leftVersion, rightVersion]);

  const solidityScore = currentVersion.solidityScore;
  const solidityTier =
    solidityScore >= 80
      ? 'Investor Ready'
      : solidityScore >= 60
        ? 'Validazione Avanzata'
        : solidityScore >= 40
          ? 'Struttura Iniziale'
          : 'Bozza Embrionale';

  const scoreDeltaSinceV1 =
    project.versions.length > 1
      ? solidityScore - project.versions[0].solidityScore
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Executive Metrics */}
      <section aria-label="Indicatori principali" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Punteggio di Solidità del Business */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Punteggio di Solidità del Business
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span
                  data-testid="solidity-score-value"
                  className="font-mono text-4xl font-semibold tracking-tight text-slate-900 tabular-nums"
                >
                  {solidityScore}
                </span>
                <span className="font-mono text-sm text-slate-400 tabular-nums">/ 100</span>
                {scoreDeltaSinceV1 !== 0 && (
                  <span className="text-xs font-medium text-emerald-600 tabular-nums">
                    {scoreDeltaSinceV1 > 0 ? `+${scoreDeltaSinceV1}` : scoreDeltaSinceV1} pt da v1.0
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-700">{solidityTier}</p>
            </div>

            <div className="relative h-16 w-16 shrink-0" aria-hidden="true">
              <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={solidityScore >= 70 ? '#10B981' : '#4F46E5'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.round((solidityScore / 100) * 163.36)} 163.36`}
                />
              </svg>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Calcolato su completezza delle 7 sezioni, presenza di metriche quantitative, risposte al Coach AI e iterazioni salvate.
          </p>
        </div>

        {/* Global Timeline Progress & Project Summary */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Avanzamento Globale · {PHASE_LABELS[project.currentPhase]}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {project.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {globalProgressPct}%
                </span>
                <p className="text-xs text-slate-500 tabular-nums">
                  {completedCount} su 5 stadi completati
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                data-testid="global-progress-bar"
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${globalProgressPct}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-600 line-clamp-2">{project.oneLiner}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
              <span>Versione attiva: <strong className="font-mono text-slate-800">{currentVersion.versionLabel}</strong></span>
              <span aria-hidden="true">·</span>
              <span>
                {project.versions.length}{' '}
                {project.versions.length === 1 ? 'iterazione' : 'iterazioni'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{project.stressTests.length} stress-test</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenStressTest}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Simula Stress-Test
              </button>
              <button
                type="button"
                onClick={() => onOpenWorkspace()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0"
              >
                Apri Laboratorio
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* La Timeline Evolutiva (5 Stadi) */}
      <section aria-labelledby="timeline-heading" className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 id="timeline-heading" className="text-base font-semibold text-slate-900">
              Timeline Evolutiva del Business Plan
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Progredisci stadio dopo stadio raffinando il piano nel Laboratorio e rispondendo all’AI Business Coach.
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            5 stadi dalla validazione alla scalabilità
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          {stages.map(({ stage, status, readiness }) => {
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const statusText = isCompleted
              ? 'Completato'
              : isActive
                ? 'In corso'
                : 'Da sbloccare';

            return (
              <div
                key={stage.id}
                data-testid={`timeline-stage-${stage.stepNumber}`}
                className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/35'
                    : isActive
                      ? 'border-indigo-300 bg-indigo-50/35'
                      : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                      Step {stage.stepNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isActive
                            ? 'text-indigo-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : isActive ? (
                        <CircleDot className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      {statusText}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-[13px] font-semibold leading-snug text-slate-900">
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {stage.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70">
                  <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                    <span>Copertura</span>
                    <span className="font-mono font-medium text-slate-800">{readiness}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isActive
                            ? 'bg-indigo-600'
                            : 'bg-slate-400'
                      }`}
                      style={{ width: `${readiness}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(stage.linkedSections[0])}
                    className="mt-3 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 whitespace-nowrap"
                  >
                    Lavora su Step {stage.stepNumber}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Storico delle Versioni (Version Control) */}
      <section aria-labelledby="versions-heading" className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-slate-500" />
            <div>
              <h2 id="versions-heading" className="text-base font-semibold text-slate-900">
                Storico delle Versioni (Version Control)
              </h2>
              <p className="text-xs text-slate-500">
                Traccia l’evoluzione dal Piano v1.0 alle iterazioni successive e confronta le modifiche sezione per sezione.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCompare((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <GitCompare className="h-3.5 w-3.5" />
            {showCompare ? 'Nascondi Confronto' : 'Confronta Versioni'}
          </button>
        </div>

        {/* Version List Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-4">Versione</th>
                <th className="py-2.5 px-4">Sintesi evoluzione</th>
                <th className="py-2.5 px-4 text-right">Solidità</th>
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 pl-4 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {project.versions.map((ver, index) => {
                const isActive = ver.id === currentVersion.id;
                const prevScore = index > 0 ? project.versions[index - 1].solidityScore : ver.solidityScore;
                const delta = ver.solidityScore - prevScore;
                const formattedDate = new Date(ver.createdAt).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={ver.id}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isActive ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {ver.versionLabel}
                      {isActive && (
                        <span className="ml-2 font-sans font-medium text-indigo-600">
                          · Attiva
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {ver.changeSummary}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {ver.solidityScore}/100
                      {index > 0 && delta !== 0 && (
                        <span
                          className={`ml-1.5 ${
                            delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          ({delta > 0 ? `+${delta}` : delta})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => onOpenWorkspace()}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Modifica nel Laboratorio
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectVersion(ver.id)}
                          aria-label={`Attiva versione ${ver.versionLabel}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-indigo-700"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Attiva {ver.versionLabel}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Version Comparison Matrix */}
        {showCompare && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            {project.versions.length < 2 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Hai attualmente solo la versione <strong className="font-mono">v1.0</strong>. Vai nel{' '}
                <button
                  type="button"
                  onClick={() => onOpenWorkspace()}
                  className="font-medium text-indigo-600 underline hover:text-indigo-800"
                >
                  Laboratorio del Piano
                </button>{' '}
                e clicca <strong>“Evolvi questo Piano”</strong> per generare v1.1 e confrontare i progressi.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Confronto Diretto tra Iterazioni
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Base:</span>
                      <select
                        value={leftVersion?.id}
                        onChange={(e) => setCompareLeftId(e.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      >
                        {project.versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.versionLabel} ({v.solidityScore}/100)
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="text-xs text-slate-400">vs</span>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Confronto:</span>
                      <select
                        value={rightVersion?.id}
                        onChange={(e) => setCompareRightId(e.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      >
                        {project.versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.versionLabel} ({v.solidityScore}/100)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {diffs.map((item) => {
                    const statusLabel =
                      item.status === 'expanded'
                        ? 'Espansa'
                        : item.status === 'refined'
                          ? 'Affinata'
                          : 'Invariata';
                    const statusColor =
                      item.status === 'expanded'
                        ? 'text-emerald-700'
                        : item.status === 'refined'
                          ? 'text-indigo-700'
                          : 'text-slate-400';

                    return (
                      <div key={item.key} className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {SECTION_META[item.key].label}
                          </span>
                          <div className="flex items-center gap-2 text-xs tabular-nums">
                            <span className={statusColor}>{statusLabel}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-mono text-slate-500">
                              {item.oldWords} → {item.newWords} parole (
                              {item.wordDelta >= 0 ? `+${item.wordDelta}` : item.wordDelta})
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                            <span className="mb-1 block font-mono text-[11px] font-medium text-slate-400">
                              {leftVersion?.versionLabel}
                            </span>
                            {item.oldText}
                          </div>
                          <div
                            className={`rounded-md p-3 text-xs leading-relaxed ${
                              item.status !== 'unchanged'
                                ? 'bg-emerald-50/40 text-slate-800'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="mb-1 block font-mono text-[11px] font-medium text-slate-500">
                              {rightVersion?.versionLabel}
                            </span>
                            {item.newText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
