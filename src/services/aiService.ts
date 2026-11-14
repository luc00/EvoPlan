import {
  createInitialProjectFromOnboarding,
  generateDeterministicCoachAnalysis,
  generateDeterministicEvolution,
  generateDeterministicStressTest,
} from '../domain/planLogic';
import type {
  CoachAction,
  CoachAnalysis,
  CoachQuestion,
  FinancialAssumptions,
  OnboardingInput,
  PlanSections,
  PlanVersion,
  StartupProject,
  StressTestResult,
  StressTestScenario,
} from '../domain/types';

async function consumeSseStream<T>(
  url: string,
  payload: unknown,
  onProgress: (text: string) => void
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Richiesta fallita (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: T | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const block of chunks) {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr += line.slice(5).trim();
          }
        }

        if (!dataStr) continue;
        const parsed = JSON.parse(dataStr);
        if (eventName === 'progress' && parsed.text) {
          onProgress(parsed.text);
        } else if (eventName === 'result') {
          finalResult = parsed as T;
        }
      }
    }

    if (!finalResult) {
      throw new Error('Stream completato senza risultato valido.');
    }

    return finalResult;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateV1Plan(input: OnboardingInput): Promise<StartupProject> {
  const baseProject = createInitialProjectFromOnboarding(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('/api/ai/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) return baseProject;
    const data = (await res.json()) as {
      projectName?: string;
      sections?: PlanSections;
      assumptions?: FinancialAssumptions;
    };

    if (!data.sections) return baseProject;

    return {
      ...baseProject,
      name: data.projectName || baseProject.name,
      assumptions: data.assumptions || baseProject.assumptions,
      versions: [
        {
          ...baseProject.versions[0],
          sections: data.sections,
        },
      ],
    };
  } catch {
    return baseProject;
  } finally {
    clearTimeout(timer);
  }
}

export async function streamCoachAnalysis(
  sections: PlanSections,
  stageIndex: number,
  onProgress: (text: string) => void
): Promise<{ analysis: CoachAnalysis; warning?: string }> {
  try {
    return await consumeSseStream<{ analysis: CoachAnalysis; warning?: string }>(
      '/api/ai/coach/stream',
      { sections, stageIndex },
      onProgress
    );
  } catch {
    onProgress('Generazione analisi locale completata.');
    return { analysis: generateDeterministicCoachAnalysis(sections, stageIndex) };
  }
}

export async function streamPlanEvolution(
  currentVersion: PlanVersion,
  questions: CoachQuestion[],
  actions: CoachAction[],
  onProgress: (text: string) => void
): Promise<{
  nextSections: PlanSections;
  changeSummary: string;
  isMajorMilestone: boolean;
  source?: 'gemini' | 'local';
  warning?: string;
}> {
  try {
    return await consumeSseStream(
      '/api/ai/evolve/stream',
      { currentVersion, questions, actions },
      onProgress
    );
  } catch {
    onProgress('Sintesi iterazione completata in modalità locale.');
    return {
      ...generateDeterministicEvolution(currentVersion, questions, actions),
      source: 'local',
    };
  }
}

export async function streamStressTest(
  sections: PlanSections,
  assumptions: FinancialAssumptions,
  scenario: StressTestScenario,
  customPrompt: string,
  onProgress: (text: string) => void
): Promise<{ result: StressTestResult; warning?: string }> {
  try {
    return await consumeSseStream<{ result: StressTestResult; warning?: string }>(
      '/api/ai/stress-test/stream',
      { sections, assumptions, scenario, customPrompt },
      onProgress
    );
  } catch {
    onProgress('Simulazione locale completata.');
    return {
      result: generateDeterministicStressTest(sections, assumptions, scenario, customPrompt),
    };
  }
}
