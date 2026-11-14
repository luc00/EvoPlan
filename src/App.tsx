import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Download,
  FlaskConical,
  GitBranch,
  Layers,
  Menu,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { HeroIntro } from './components/HeroIntro';
import { OnboardingModal } from './components/OnboardingModal';
import { QuickNotesSidebar } from './components/QuickNotesSidebar';
import { StressTestModule } from './components/StressTestModule';
import { TimelineDashboard } from './components/TimelineDashboard';
import { WorkspaceLab } from './components/WorkspaceLab';
import {
  addQuickNote,
  calculateSolidityScore,
  computeNextVersionLabel,
  computeStageProgress,
  createDemoSeedProject,
  generateDeterministicCoachAnalysis,
  removeQuickNote,
  SECTION_META,
  SECTION_ORDER,
} from './domain/planLogic';
import type {
  FinancialAssumptions,
  OnboardingInput,
  PlanSectionKey,
  PlanVersion,
  StartupProject,
  StressTestScenario,
} from './domain/types';
import {
  generateV1Plan,
  streamCoachAnalysis,
  streamPlanEvolution,
  streamStressTest,
} from './services/aiService';
import {
  loadActiveProjectId,
  loadProjects,
  saveActiveProjectId,
  saveProjects,
} from './services/storageService';

type AppTab = 'timeline' | 'workspace' | 'stress-test';

const TAB_LABELS: Record<AppTab, string> = {
  timeline: 'Timeline Evolutiva',
  workspace: 'Laboratorio del Piano',
  'stress-test': 'Stress-Test & Simulazione',
};

export default function App() {
  const [projects, setProjects] = useState<StartupProject[]>(() => {
    const saved = loadProjects();
    if (saved.length > 0) return saved;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const demo = createDemoSeedProject();
      saveProjects([demo]);
      saveActiveProjectId(demo.id);
      return [demo];
    }
    return [];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const savedId = loadActiveProjectId();
    const savedProjects = loadProjects();
    if (savedId && savedProjects.some((p) => p.id === savedId)) {
      return savedId;
    }
    if (savedProjects[0]) return savedProjects[0].id;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const current = loadProjects();
      return current[0]?.id ?? null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('timeline');
  const [focusSection, setFocusSection] = useState<PlanSectionKey | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') !== '1';
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const hasAutoPromptedOnboardingRef = useRef<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [isGeneratingOnboarding, setIsGeneratingOnboarding] = useState(false);
  const [isAnalyzingCoach, setIsAnalyzingCoach] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [coachWarning, setCoachWarning] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      saveActiveProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (showIntro) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showIntro]);

  const handleEnterSite = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleIntroExitComplete = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return;
    if (projects.length === 0 && !hasAutoPromptedOnboardingRef.current) {
      hasAutoPromptedOnboardingRef.current = true;
      setIsOnboardingOpen(true);
    }
  }, [projects.length]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId]
  );

  const currentVersion = useMemo(() => {
    if (!activeProject) return null;
    return (
      activeProject.versions.find((v) => v.id === activeProject.currentVersionId) ??
      activeProject.versions[activeProject.versions.length - 1] ??
      null
    );
  }, [activeProject]);

  const showToast = useCallback((msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  const updateProject = useCallback(
    (projectId: string, updater: (proj: StartupProject) => StartupProject) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...updater(p), updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    []
  );

  const handleOnboardingSubmit = async (input: OnboardingInput) => {
    setIsGeneratingOnboarding(true);
    try {
      const newProject = await generateV1Plan(input);
      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setIsOnboardingOpen(false);
      setActiveTab('timeline');
      showToast(`Business Plan ${newProject.versions[0].versionLabel} generato per "${newProject.name}".`);
    } finally {
      setIsGeneratingOnboarding(false);
    }
  };

  const handleSelectVersion = (versionId: string) => {
    if (!activeProject) return;
    updateProject(activeProject.id, (proj) => ({
      ...proj,
      currentVersionId: versionId,
    }));
    const ver = activeProject.versions.find((v) => v.id === versionId);
    if (ver) {
      showToast(`Versione ${ver.versionLabel} attivata.`);
    }
  };

  const handleOpenWorkspace = (section?: PlanSectionKey) => {
    setFocusSection(section ?? null);
    setActiveTab('workspace');
    setIsMobileNavOpen(false);
  };

  const handleUpdateSection = (key: PlanSectionKey, value: string) => {
    if (!activeProject || !currentVersion) return;

    updateProject(activeProject.id, (proj) => {
      const updatedVersions = proj.versions.map((v) => {
        if (v.id !== currentVersion.id) return v;
        const nextSections = { ...v.sections, [key]: value };
        const answeredCount = v.coachAnalysis
          ? v.coachAnalysis.questions.filter((q) => q.answer.trim().length > 2).length
          : 0;
        const appliedCount = v.coachAnalysis
          ? v.coachAnalysis.actions.filter((a) => a.applied).length
          : 0;
        const solidityScore = calculateSolidityScore(
          nextSections,
          answeredCount,
          appliedCount,
          proj.versions.length
        );
        const { activeStageIndex } = computeStageProgress(
          nextSections,
          solidityScore,
          proj.versions.length
        );
        return {
          ...v,
          sections: nextSections,
          solidityScore,
          stageIndex: activeStageIndex,
        };
      });
      return { ...proj, versions: updatedVersions };
    });
  };

  const handleAnalyzeCoach = async () => {
    if (!activeProject || !currentVersion) return;
    setIsAnalyzingCoach(true);
    setCoachWarning(null);
    setStreamStatus('Avvio analisi AI del business plan...');

    try {
      const { analysis, warning } = await streamCoachAnalysis(
        currentVersion.sections,
        currentVersion.stageIndex,
        (progressText) => setStreamStatus(progressText)
      );

      if (warning) {
        setCoachWarning(`Modalità locale attiva (${warning})`);
      }

      updateProject(activeProject.id, (proj) => ({
        ...proj,
        versions: proj.versions.map((v) => {
          if (v.id !== currentVersion.id) return v;
          const prevAnswers = v.coachAnalysis?.questions.map((q) => q.answer) ?? [];
          const mergedQuestions = analysis.questions.map((q, idx) => ({
            ...q,
            answer: q.answer || prevAnswers[idx] || '',
          }));
          return {
            ...v,
            coachAnalysis: { ...analysis, questions: mergedQuestions },
          };
        }),
      }));
      setStreamStatus(null);
    } finally {
      setIsAnalyzingCoach(false);
    }
  };

  const handleApplyCoachAction = (actionId: string) => {
    if (!activeProject || !currentVersion || !currentVersion.coachAnalysis) return;
    const action = currentVersion.coachAnalysis.actions.find((a) => a.id === actionId);
    if (!action || action.applied) return;

    updateProject(activeProject.id, (proj) => {
      const updatedVersions = proj.versions.map((v) => {
        if (v.id !== currentVersion.id || !v.coachAnalysis) return v;
        const currentText = v.sections[action.targetSection] ?? '';
        const updatedText = currentText.includes(action.suggestedText.trim())
          ? currentText
          : `${currentText.trim()}${action.suggestedText}`;

        const nextSections = { ...v.sections, [action.targetSection]: updatedText };
        const nextActions = v.coachAnalysis.actions.map((a) =>
          a.id === actionId ? { ...a, applied: true } : a
        );
        const answeredCount = v.coachAnalysis.questions.filter(
          (q) => q.answer.trim().length > 2
        ).length;
        const appliedCount = nextActions.filter((a) => a.applied).length;
        const solidityScore = calculateSolidityScore(
          nextSections,
          answeredCount,
          appliedCount,
          proj.versions.length
        );
        const { activeStageIndex } = computeStageProgress(
          nextSections,
          solidityScore,
          proj.versions.length
        );

        return {
          ...v,
          sections: nextSections,
          solidityScore,
          stageIndex: activeStageIndex,
          coachAnalysis: { ...v.coachAnalysis, actions: nextActions },
        };
      });
      return { ...proj, versions: updatedVersions };
    });

    showToast(`Suggerimento applicato alla sezione "${SECTION_META[action.targetSection].label}".`);
  };

  const handleUpdateQuestionAnswer = (questionId: string, answer: string) => {
    if (!activeProject || !currentVersion || !currentVersion.coachAnalysis) return;

    updateProject(activeProject.id, (proj) => {
      const updatedVersions = proj.versions.map((v) => {
        if (v.id !== currentVersion.id || !v.coachAnalysis) return v;
        const nextQuestions = v.coachAnalysis.questions.map((q) =>
          q.id === questionId ? { ...q, answer } : q
        );
        const answeredCount = nextQuestions.filter((q) => q.answer.trim().length > 2).length;
        const appliedCount = v.coachAnalysis.actions.filter((a) => a.applied).length;
        const solidityScore = calculateSolidityScore(
          v.sections,
          answeredCount,
          appliedCount,
          proj.versions.length
        );
        return {
          ...v,
          solidityScore,
          coachAnalysis: { ...v.coachAnalysis, questions: nextQuestions },
        };
      });
      return { ...proj, versions: updatedVersions };
    });
  };

  const handleEvolvePlan = async () => {
    if (!activeProject || !currentVersion) return;
    setIsEvolving(true);
    setStreamStatus('Preparazione della nuova iterazione del business plan...');

    const questions = currentVersion.coachAnalysis?.questions ?? [];
    const actions = currentVersion.coachAnalysis?.actions ?? [];

    try {
      const evolved = await streamPlanEvolution(
        currentVersion,
        questions,
        actions,
        (text) => setStreamStatus(text)
      );

      const nextLabel = computeNextVersionLabel(
        currentVersion.versionLabel,
        evolved.isMajorMilestone
      );
      const nextVersionsCount = activeProject.versions.length + 1;
      const answeredCount = questions.filter((q) => q.answer.trim().length > 2).length;
      const appliedCount = actions.filter((a) => a.applied).length;

      const rawScore = calculateSolidityScore(
        evolved.nextSections,
        answeredCount,
        appliedCount,
        nextVersionsCount
      );
      const nextScore = Math.min(100, Math.max(currentVersion.solidityScore + 4, rawScore));
      const { activeStageIndex } = computeStageProgress(
        evolved.nextSections,
        nextScore,
        nextVersionsCount
      );

      const nextCoach = generateDeterministicCoachAnalysis(
        evolved.nextSections,
        activeStageIndex
      );

      const newVersion: PlanVersion = {
        id: `ver-${Date.now()}`,
        versionLabel: nextLabel,
        createdAt: new Date().toISOString(),
        stageIndex: activeStageIndex,
        solidityScore: nextScore,
        changeSummary: evolved.changeSummary,
        sections: evolved.nextSections,
        coachAnalysis: nextCoach,
      };

      updateProject(activeProject.id, (proj) => ({
        ...proj,
        currentVersionId: newVersion.id,
        versions: [...proj.versions, newVersion],
      }));

      setStreamStatus(null);
      showToast(
        `Piano evoluto alla versione ${nextLabel} · Solidità salita a ${nextScore}/100.`
      );
    } finally {
      setIsEvolving(false);
    }
  };

  const handleUpdateAssumptions = (next: FinancialAssumptions) => {
    if (!activeProject) return;
    updateProject(activeProject.id, (proj) => ({
      ...proj,
      assumptions: next,
    }));
  };

  const handleRunSimulation = async (
    scenario: StressTestScenario,
    customPrompt: string
  ) => {
    if (!activeProject || !currentVersion) return;
    setIsSimulating(true);
    setStreamStatus('Calcolo dell’impatto finanziario e strategico...');

    try {
      const { result } = await streamStressTest(
        currentVersion.sections,
        activeProject.assumptions,
        scenario,
        customPrompt,
        (text) => setStreamStatus(text)
      );

      updateProject(activeProject.id, (proj) => ({
        ...proj,
        stressTests: [result, ...proj.stressTests],
      }));
      setStreamStatus(null);
      showToast(`Stress-test "${result.scenarioTitle}" completato.`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyAdaptation = (testId: string, adaptationId: string) => {
    if (!activeProject || !currentVersion) return;
    const test = activeProject.stressTests.find((t) => t.id === testId);
    const adp = test?.adaptations.find((a) => a.id === adaptationId);
    if (!test || !adp || adp.applied) return;

    updateProject(activeProject.id, (proj) => {
      const updatedVersions = proj.versions.map((v) => {
        if (v.id !== currentVersion.id) return v;
        const curr = v.sections[adp.targetSection] ?? '';
        const nextText = curr.includes(adp.suggestedAddition.trim())
          ? curr
          : `${curr.trim()}${adp.suggestedAddition}`;
        const nextSections = { ...v.sections, [adp.targetSection]: nextText };
        const solidityScore = calculateSolidityScore(
          nextSections,
          v.coachAnalysis?.questions.filter((q) => q.answer.trim().length > 2).length ?? 0,
          v.coachAnalysis?.actions.filter((a) => a.applied).length ?? 0,
          proj.versions.length
        );
        return {
          ...v,
          sections: nextSections,
          solidityScore,
        };
      });

      const updatedTests = proj.stressTests.map((t) =>
        t.id !== testId
          ? t
          : {
              ...t,
              adaptations: t.adaptations.map((a) =>
                a.id === adaptationId ? { ...a, applied: true } : a
              ),
            }
      );

      return {
        ...proj,
        versions: updatedVersions,
        stressTests: updatedTests,
      };
    });

    showToast(`Contromisura integrata in "${SECTION_META[adp.targetSection].label}".`);
  };

  const handleExportMarkdown = () => {
    if (!activeProject || !currentVersion) return;
    const lines = [
      `# ${activeProject.name} — Business Plan (${currentVersion.versionLabel})`,
      `Solidità: ${currentVersion.solidityScore}/100`,
      `Idea: ${activeProject.oneLiner}`,
      `Cliente ideale: ${activeProject.idealCustomer}`,
      '',
      ...SECTION_ORDER.flatMap((key) => [
        `## ${SECTION_META[key].label}`,
        currentVersion.sections[key],
        '',
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-${currentVersion.versionLabel}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Esportato ${currentVersion.versionLabel} in Markdown.`);
  };

  const handleUpdateQuickNoteDraft = (text: string) => {
    if (!activeProject) return;
    updateProject(activeProject.id, (proj) => ({
      ...proj,
      quickNoteDraft: text,
    }));
  };

  const handleAddQuickNote = () => {
    if (!activeProject) return;
    const draft = activeProject.quickNoteDraft ?? '';
    if (!draft.trim()) return;
    updateProject(activeProject.id, (proj) => addQuickNote(proj, draft));
    showToast('Nota rapida salvata.');
  };

  const handleDeleteQuickNote = (noteId: string) => {
    if (!activeProject) return;
    updateProject(activeProject.id, (proj) => removeQuickNote(proj, noteId));
  };

  return (
    <div className="w-full overflow-x-clip bg-[#F8FAFC] text-slate-900">
      <AnimatePresence onExitComplete={handleIntroExitComplete}>
        {showIntro && <HeroIntro key="hero-intro" onEnter={handleEnterSite} />}
      </AnimatePresence>

      <div
        id="home-app"
        aria-hidden={showIntro}
        className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row"
      >
        {/* Mobile Sidebar Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside
        aria-label="Navigazione principale"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('timeline');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            EvoPlan
          </a>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Chiudi menu laterale"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-4">
          {/* Primary Views */}
          <nav aria-label="Viste applicazione" className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('timeline');
                setIsMobileNavOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <GitBranch className="h-4 w-4 shrink-0" />
              Timeline Evolutiva
            </button>

            <button
              type="button"
              onClick={() => handleOpenWorkspace()}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'workspace'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="h-4 w-4 shrink-0" />
              Laboratorio del Piano
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('stress-test');
                setIsMobileNavOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'stress-test'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Activity className="h-4 w-4 shrink-0" />
              Stress-Test & Simulazione
            </button>
          </nav>

          {/* Projects Switcher */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-500">I tuoi Progetti</span>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                aria-label="Crea nuovo business plan"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuovo
              </button>
            </div>

            <div className="mt-2 space-y-1">
              {projects.length === 0 ? (
                <p className="px-2 py-2 text-xs text-slate-400">
                  Nessun progetto ancora creato.
                </p>
              ) : (
                projects.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  const ver =
                    proj.versions.find((v) => v.id === proj.currentVersionId) ??
                    proj.versions[proj.versions.length - 1];
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        setActiveProjectId(proj.id);
                        setIsMobileNavOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-slate-100 font-semibold text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{proj.name}</span>
                      </span>
                      {ver && (
                        <span className="ml-2 font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                          {ver.versionLabel}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {activeProject && (
            <QuickNotesSidebar
              draft={activeProject.quickNoteDraft ?? ''}
              notes={activeProject.quickNotes ?? []}
              onChangeDraft={handleUpdateQuickNoteDraft}
              onAddNote={handleAddQuickNote}
              onDeleteNote={handleDeleteQuickNote}
            />
          )}
        </div>

        {/* Sidebar Footer Actions */}
        {activeProject && currentVersion && (
          <div className="border-t border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-500">Solidità attuale</span>
              <span className="font-mono font-semibold text-slate-900">
                {currentVersion.solidityScore}/100
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Esporta Piano (.md)
            </button>
          </div>
        )}
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Breadcrumb Left — Primary Action Right */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Apri menu di navigazione"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden md:inline text-slate-400 whitespace-nowrap">Progetti</span>
              {activeProject && (
                <>
                  <span className="hidden md:inline text-slate-300" aria-hidden="true">/</span>
                  <span className="hidden sm:inline truncate max-w-[180px] lg:max-w-[220px] font-medium text-slate-700">
                    {activeProject.name}
                  </span>
                  <span className="hidden sm:inline text-slate-300" aria-hidden="true">/</span>
                </>
              )}
              <h1 className="truncate font-semibold text-slate-900">
                {TAB_LABELS[activeTab]}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeProject && currentVersion ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'workspace') {
                    handleEvolvePlan();
                  } else {
                    handleOpenWorkspace();
                  }
                }}
                disabled={isEvolving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {activeTab === 'workspace' ? 'Evolvi Piano' : 'Apri Laboratorio'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuovo Piano
              </button>
            )}
          </div>
        </header>

        {/* Feedback Toast Banner */}
        <AnimatePresence>
          {bannerMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              role="status"
              className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 sm:mx-6"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {bannerMessage}
              </span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                aria-label="Chiudi notifica"
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1360px] flex-1 p-4 sm:p-6">
          {!activeProject || !currentVersion ? (
            <div className="mx-auto mt-12 max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Crea il tuo primo Business Plan evolutivo
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Rispondi a 3 domande rapide per generare la Versione 1.0 e iniziare il percorso con l’AI Business Coach.
              </p>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                Inizia Onboarding Guidato
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeProject.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                {activeTab === 'timeline' && (
                  <TimelineDashboard
                    project={activeProject}
                    currentVersion={currentVersion}
                    onOpenWorkspace={handleOpenWorkspace}
                    onSelectVersion={handleSelectVersion}
                    onOpenStressTest={() => setActiveTab('stress-test')}
                  />
                )}

                {activeTab === 'workspace' && (
                  <WorkspaceLab
                    currentVersion={currentVersion}
                    focusSection={focusSection}
                    isAnalyzingCoach={isAnalyzingCoach}
                    isEvolving={isEvolving}
                    streamStatus={streamStatus}
                    coachWarning={coachWarning}
                    onUpdateSection={handleUpdateSection}
                    onAnalyzeCoach={handleAnalyzeCoach}
                    onApplyCoachAction={handleApplyCoachAction}
                    onUpdateQuestionAnswer={handleUpdateQuestionAnswer}
                    onEvolvePlan={handleEvolvePlan}
                    onViewTimeline={() => setActiveTab('timeline')}
                  />
                )}

                {activeTab === 'stress-test' && (
                  <StressTestModule
                    currentVersion={currentVersion}
                    assumptions={activeProject.assumptions}
                    stressTests={activeProject.stressTests}
                    isSimulating={isSimulating}
                    streamStatus={streamStatus}
                    onUpdateAssumptions={handleUpdateAssumptions}
                    onRunSimulation={handleRunSimulation}
                    onApplyAdaptation={handleApplyAdaptation}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      </div>

      {/* Guided Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        canClose={projects.length > 0}
        isGenerating={isGeneratingOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleOnboardingSubmit}
      />
    </div>
  );
}
