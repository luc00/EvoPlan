export type StartupPhase = 'idea' | 'mvp' | 'traction' | 'growth';

export type PlanSectionKey =
  | 'executiveSummary'
  | 'problem'
  | 'solution'
  | 'targetCustomer'
  | 'competitors'
  | 'revenueChannels'
  | 'costStructure';

export type PlanSections = Record<PlanSectionKey, string>;

export type BusinessStageId = 'idea' | 'market' | 'model' | 'gtm' | 'scale';

export interface StageDefinition {
  id: BusinessStageId;
  stepNumber: number;
  title: string;
  subtitle: string;
  linkedSections: PlanSectionKey[];
  unlockThreshold: number;
}

export interface StageProgressItem {
  stage: StageDefinition;
  status: 'completed' | 'active' | 'locked';
  readiness: number;
}

export interface CoachAction {
  id: string;
  title: string;
  description: string;
  targetSection: PlanSectionKey;
  suggestedText: string;
  applied: boolean;
}

export interface CoachBlindSpot {
  id: string;
  title: string;
  severity: 'high' | 'medium';
  detail: string;
}

export interface CoachQuestion {
  id: string;
  question: string;
  hint: string;
  answer: string;
}

export interface CoachAnalysis {
  summary: string;
  actions: CoachAction[];
  blindSpots: CoachBlindSpot[];
  questions: CoachQuestion[];
  generatedAt: string;
  source: 'gemini' | 'local';
}

export interface FinancialAssumptions {
  cacEur: number;
  ltvEur: number;
  monthlyBurnEur: number;
  cashReserveEur: number;
  monthlyRevenueEur: number;
}

export interface StressTestScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  parameters: {
    cacMultiplier: number;
    conversionDeltaPct: number;
    churnDeltaPct: number;
    burnMultiplier: number;
    launchDelayMonths: number;
    horizonMonths: number;
  };
}

export interface StressTestAdaptation {
  id: string;
  title: string;
  detail: string;
  targetSection: PlanSectionKey;
  suggestedAddition: string;
  applied: boolean;
}

export interface StressTestResult {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  summary: string;
  impactScoreDelta: number;
  baselineRunwayMonths: number;
  projectedRunwayMonths: number;
  baselineLtvCac: number;
  projectedLtvCac: number;
  projectedBreakEvenMonths: number | null;
  monthlyNetBurnProjected: number;
  risks: string[];
  adaptations: StressTestAdaptation[];
  source: 'gemini' | 'local';
  generatedAt: string;
}

export interface PlanVersion {
  id: string;
  versionLabel: string;
  createdAt: string;
  stageIndex: number;
  solidityScore: number;
  changeSummary: string;
  sections: PlanSections;
  coachAnalysis?: CoachAnalysis;
}

export interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface StartupProject {
  id: string;
  name: string;
  oneLiner: string;
  idealCustomer: string;
  currentPhase: StartupPhase;
  currentVersionId: string;
  versions: PlanVersion[];
  assumptions: FinancialAssumptions;
  stressTests: StressTestResult[];
  quickNoteDraft?: string;
  quickNotes?: QuickNote[];
  createdAt: string;
  updatedAt: string;
}

export interface SectionDiffItem {
  key: PlanSectionKey;
  label: string;
  oldText: string;
  newText: string;
  oldWords: number;
  newWords: number;
  wordDelta: number;
  status: 'unchanged' | 'refined' | 'expanded';
}

export interface OnboardingInput {
  projectName?: string;
  oneLiner: string;
  idealCustomer: string;
  currentPhase: StartupPhase;
}
