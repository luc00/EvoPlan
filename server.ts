import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  calculateSolidityScore,
  calculateUnitEconomicsImpact,
  computeStageProgress,
  generateDeterministicCoachAnalysis,
  generateDeterministicEvolution,
  generateDeterministicStressTest,
  generateDeterministicV1Plan,
} from './src/domain/planLogic.ts';
import type {
  CoachAction,
  CoachAnalysis,
  CoachQuestion,
  FinancialAssumptions,
  OnboardingInput,
  PlanSections,
  PlanVersion,
  StressTestScenario,
} from './src/domain/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = 'gemini-4-hydrogen';
const GEMINI_TIMEOUT_MS = 18000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout dopo ${ms}ms`)), ms)
    ),
  ]);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 12) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sendSseEvent(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamSimulatedProgress(
  res: express.Response,
  steps: string[]
) {
  for (const step of steps) {
    if (res.writableEnded) return;
    sendSseEvent(res, 'progress', { text: step });
    await sleep(160);
  }
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(getGeminiClient()),
  });
});

// 1. Onboarding -> Generate Business Plan v1.0
app.post('/api/ai/onboard', async (req, res) => {
  const input = req.body as OnboardingInput;
  if (!input?.oneLiner?.trim() || !input?.idealCustomer?.trim() || !input?.currentPhase) {
    res.status(400).json({ error: 'Compila tutte e 3 le domande per generare la versione 1.0.' });
    return;
  }

  const ai = getGeminiClient();
  const deterministic = generateDeterministicV1Plan(input);

  if (!ai) {
    res.json({
      projectName: deterministic.projectName,
      sections: deterministic.sections,
      assumptions: deterministic.assumptions,
      source: 'local',
    });
    return;
  }

  try {
    const prompt = `Sei un Senior Venture Strategist italiano. Crea la Versione 1.0 di un business plan strutturato in italiano per questa startup:
- Idea in una frase: "${input.oneLiner}"
- Cliente ideale: "${input.idealCustomer}"
- Fase attuale: "${input.currentPhase}"

Restituisci un JSON rigoroso con:
- projectName: nome breve e credibile per il progetto (se non indicato, inventane uno professionale)
- sections: oggetto con le 7 chiavi (executiveSummary, problem, solution, targetCustomer, competitors, revenueChannels, costStructure), ciascuna di 2-4 frasi concrete, realistiche e con numeri/KPI stimati in euro (€).`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              sections: {
                type: Type.OBJECT,
                properties: {
                  executiveSummary: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  solution: { type: Type.STRING },
                  targetCustomer: { type: Type.STRING },
                  competitors: { type: Type.STRING },
                  revenueChannels: { type: Type.STRING },
                  costStructure: { type: Type.STRING },
                },
                required: [
                  'executiveSummary',
                  'problem',
                  'solution',
                  'targetCustomer',
                  'competitors',
                  'revenueChannels',
                  'costStructure',
                ],
              },
            },
            required: ['projectName', 'sections'],
          },
        },
      }),
      GEMINI_TIMEOUT_MS,
      'Onboarding Gemini'
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      projectName?: string;
      sections?: PlanSections;
    };

    if (!parsed.sections?.executiveSummary) {
      throw new Error('Risposta AI incompleta');
    }

    res.json({
      projectName: parsed.projectName || deterministic.projectName,
      sections: parsed.sections,
      assumptions: deterministic.assumptions,
      source: 'gemini',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore Gemini API';
    res.json({
      projectName: deterministic.projectName,
      sections: deterministic.sections,
      assumptions: deterministic.assumptions,
      source: 'local',
      warning: `Analisi generata in modalità locale (${message}).`,
    });
  }
});

// 2. AI Business Coach (Streaming SSE)
app.post('/api/ai/coach/stream', async (req, res) => {
  const { sections, stageIndex } = req.body as {
    sections?: PlanSections;
    stageIndex?: number;
  };

  if (!sections) {
    res.status(400).json({ error: 'Sezioni del business plan mancanti.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const safeStageIndex = typeof stageIndex === 'number' ? stageIndex : 0;
  const fallback = generateDeterministicCoachAnalysis(sections, safeStageIndex);
  const ai = getGeminiClient();

  if (!ai) {
    await streamSimulatedProgress(res, [
      'Lettura delle 7 sezioni del business plan...',
      'Valutazione coerenza tra Problema, Target e Canali di Ricavo...',
      'Identificazione dei punti ciechi e delle 3 azioni prioritarie...',
    ]);
    sendSseEvent(res, 'result', { analysis: fallback });
    res.end();
    return;
  }

  try {
    sendSseEvent(res, 'progress', { text: 'Connessione al modello Gemini per analisi strategica...' });

    const prompt = `Sei un AI Business Coach per startup (stile Linear/Stripe/YC) che risponde in italiano.
Analizza questo business plan attuale (stadio corrente: ${safeStageIndex + 1}/5):
${JSON.stringify(sections, null, 2)}

Produci:
1. summary: sintesi diagnostica di max 2 frasi.
2. actions: esattamente 3 azioni concrete di miglioramento, ognuna collegata a una targetSection tra (executiveSummary, problem, solution, targetCustomer, competitors, revenueChannels, costStructure) e con suggestedText pronto da appendere alla sezione.
3. blindSpots: 3 rischi o punti ciechi reali con severity ("high" o "medium").
4. questions: 3 domande strategiche per sbloccare il livello successivo, ciascuna con un breve hint di risposta.`;

    const fullText = await withTimeout(
      (async () => {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                actions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      targetSection: { type: Type.STRING },
                      suggestedText: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'targetSection', 'suggestedText'],
                  },
                },
                blindSpots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ['title', 'severity', 'detail'],
                  },
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      hint: { type: Type.STRING },
                    },
                    required: ['question', 'hint'],
                  },
                },
              },
              required: ['summary', 'actions', 'blindSpots', 'questions'],
            },
          },
        });

        let acc = '';
        let chunkCount = 0;
        for await (const chunk of stream) {
          const text = chunk.text ?? '';
          acc += text;
          chunkCount++;
          if (chunkCount % 3 === 1) {
            sendSseEvent(res, 'progress', {
              text: `Analisi AI in corso (${acc.length} caratteri elaborati)...`,
            });
          }
        }
        return acc;
      })(),
      GEMINI_TIMEOUT_MS,
      'Coach Gemini'
    );

    const parsed = JSON.parse(fullText.trim()) as {
      summary: string;
      actions: Array<{ title: string; description: string; targetSection: string; suggestedText: string }>;
      blindSpots: Array<{ title: string; severity: string; detail: string }>;
      questions: Array<{ question: string; hint: string }>;
    };

    const validSections = new Set([
      'executiveSummary',
      'problem',
      'solution',
      'targetCustomer',
      'competitors',
      'revenueChannels',
      'costStructure',
    ]);

    const analysis: CoachAnalysis = {
      summary: parsed.summary || fallback.summary,
      actions: (parsed.actions || []).slice(0, 3).map((a, i) => ({
        id: `gem-act-${Date.now()}-${i}`,
        title: a.title,
        description: a.description,
        targetSection: (validSections.has(a.targetSection)
          ? a.targetSection
          : 'executiveSummary') as CoachAction['targetSection'],
        suggestedText: a.suggestedText.startsWith(' ') ? a.suggestedText : ` ${a.suggestedText}`,
        applied: false,
      })),
      blindSpots: (parsed.blindSpots || []).slice(0, 3).map((b, i) => ({
        id: `gem-bs-${Date.now()}-${i}`,
        title: b.title,
        severity: b.severity === 'high' ? 'high' : 'medium',
        detail: b.detail,
      })),
      questions: (parsed.questions || []).slice(0, 3).map((q, i) => ({
        id: `gem-q-${Date.now()}-${i}`,
        question: q.question,
        hint: q.hint,
        answer: '',
      })),
      generatedAt: new Date().toISOString(),
      source: 'gemini',
    };

    sendSseEvent(res, 'result', { analysis });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore Gemini API';
    sendSseEvent(res, 'progress', {
      text: `Fallback su motore diagnostico locale (${message})...`,
    });
    sendSseEvent(res, 'result', { analysis: fallback, warning: message });
    res.end();
  }
});

// 3. Evolvi questo Piano (Streaming SSE)
app.post('/api/ai/evolve/stream', async (req, res) => {
  const { currentVersion, questions, actions } = req.body as {
    currentVersion?: PlanVersion;
    questions?: CoachQuestion[];
    actions?: CoachAction[];
  };

  if (!currentVersion?.sections) {
    res.status(400).json({ error: 'Versione corrente mancante.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const safeQuestions = questions ?? [];
  const safeActions = actions ?? [];
  const deterministic = generateDeterministicEvolution(currentVersion, safeQuestions, safeActions);
  const ai = getGeminiClient();

  if (!ai) {
    await streamSimulatedProgress(res, [
      'Acquisizione delle risposte strategiche e delle sezioni correnti...',
      'Sintesi delle migliorie su modello di business e go-to-market...',
      'Generazione della nuova versione del business plan...',
    ]);
    sendSseEvent(res, 'result', {
      ...deterministic,
      source: 'local',
    });
    res.end();
    return;
  }

  try {
    sendSseEvent(res, 'progress', { text: 'Sintesi evolutiva con Gemini in corso...' });

    const answeredText = safeQuestions
      .filter((q) => q.answer.trim().length > 0)
      .map((q) => `D: ${q.question}\nR: ${q.answer}`)
      .join('\n\n');

    const prompt = `Sei un Senior Startup Advisor. Evolvi questo business plan dalla versione ${currentVersion.versionLabel} alla versione successiva più matura, quantitativa e pronta per investitori.

SEZIONI ATTUALI:
${JSON.stringify(currentVersion.sections, null, 2)}

RISPOSTE DELL'IMPRENDITORE ALLE DOMANDE STRATEGICHE:
${answeredText || 'Nessuna risposta aggiuntiva fornita; raffina comunque chiarezza e metriche in tutte le sezioni.'}

Restituisci in JSON:
- nextSections: tutte e 7 le sezioni aggiornate e potenziate in italiano (executiveSummary, problem, solution, targetCustomer, competitors, revenueChannels, costStructure). Mantieni la coerenza ma rendile più precise e azionabili.
- changeSummary: sintesi in 1 frase delle principali evoluzioni apportate.
- isMajorMilestone: true se l'evoluzione segna un salto di stadio sostanziale, altrimenti false.`;

    const fullText = await withTimeout(
      (async () => {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nextSections: {
                  type: Type.OBJECT,
                  properties: {
                    executiveSummary: { type: Type.STRING },
                    problem: { type: Type.STRING },
                    solution: { type: Type.STRING },
                    targetCustomer: { type: Type.STRING },
                    competitors: { type: Type.STRING },
                    revenueChannels: { type: Type.STRING },
                    costStructure: { type: Type.STRING },
                  },
                  required: [
                    'executiveSummary',
                    'problem',
                    'solution',
                    'targetCustomer',
                    'competitors',
                    'revenueChannels',
                    'costStructure',
                  ],
                },
                changeSummary: { type: Type.STRING },
                isMajorMilestone: { type: Type.BOOLEAN },
              },
              required: ['nextSections', 'changeSummary', 'isMajorMilestone'],
            },
          },
        });

        let acc = '';
        let count = 0;
        for await (const chunk of stream) {
          acc += chunk.text ?? '';
          count++;
          if (count % 3 === 1) {
            sendSseEvent(res, 'progress', {
              text: `Generazione nuova iterazione (${acc.length} caratteri)...`,
            });
          }
        }
        return acc;
      })(),
      GEMINI_TIMEOUT_MS,
      'Evolve Gemini'
    );

    const parsed = JSON.parse(fullText.trim()) as {
      nextSections: PlanSections;
      changeSummary: string;
      isMajorMilestone: boolean;
    };

    const nextScore = calculateSolidityScore(
      parsed.nextSections,
      safeQuestions.filter((q) => q.answer.trim().length > 0).length,
      safeActions.filter((a) => a.applied).length,
      2
    );
    const { activeStageIndex } = computeStageProgress(parsed.nextSections, nextScore, 2);

    sendSseEvent(res, 'result', {
      nextSections: parsed.nextSections,
      changeSummary: parsed.changeSummary || deterministic.changeSummary,
      isMajorMilestone: Boolean(parsed.isMajorMilestone),
      suggestedStageIndex: activeStageIndex,
      source: 'gemini',
    });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore Gemini API';
    sendSseEvent(res, 'progress', { text: `Ripristino sintesi locale (${message})...` });
    sendSseEvent(res, 'result', {
      ...deterministic,
      source: 'local',
      warning: message,
    });
    res.end();
  }
});

// 4. Stress-Test & Simulazione (Streaming SSE)
app.post('/api/ai/stress-test/stream', async (req, res) => {
  const { sections, assumptions, scenario, customPrompt } = req.body as {
    sections?: PlanSections;
    assumptions?: FinancialAssumptions;
    scenario?: StressTestScenario;
    customPrompt?: string;
  };

  if (!sections || !assumptions || !scenario) {
    res.status(400).json({ error: 'Parametri della simulazione mancanti.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const fallback = generateDeterministicStressTest(sections, assumptions, scenario, customPrompt);
  const ai = getGeminiClient();

  if (!ai) {
    await streamSimulatedProgress(res, [
      'Calcolo impatto su LTV/CAC, burn rate e runway...',
      'Simulazione di resilienza sui canali di ricavo e costi...',
      'Elaborazione piano di adattamento operativo...',
    ]);
    sendSseEvent(res, 'result', { result: fallback });
    res.end();
    return;
  }

  try {
    sendSseEvent(res, 'progress', { text: 'Simulazione scenario di stress con Gemini...' });

    const econ = calculateUnitEconomicsImpact(assumptions, scenario.parameters);
    const scenarioDesc = customPrompt?.trim() ? customPrompt.trim() : `${scenario.title}: ${scenario.description}`;

    const prompt = `Sei un CFO e Venture Strategist. Esegui uno stress-test in italiano su questo business plan per lo scenario:
"${scenarioDesc}"

DATI QUANTITATIVI SIMULATI:
- LTV/CAC: da ${econ.baselineLtvCac}x a ${econ.projectedLtvCac}x
- Runway: da ${econ.baselineRunwayMonths} mesi a ${econ.projectedRunwayMonths} mesi
- Net burn mensile proiettato: ${econ.monthlyNetBurnProjected} €

BUSINESS PLAN:
${JSON.stringify(sections, null, 2)}

Restituisci JSON con:
- summary: valutazione esecutiva di max 2 frasi.
- risks: array di 3 rischi concreti legati a questo scenario.
- adaptations: array di 3 contromisure azionabili con { title, detail, targetSection (una tra executiveSummary, problem, solution, targetCustomer, competitors, revenueChannels, costStructure), suggestedAddition }.`;

    const fullText = await withTimeout(
      (async () => {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                adaptations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      detail: { type: Type.STRING },
                      targetSection: { type: Type.STRING },
                      suggestedAddition: { type: Type.STRING },
                    },
                    required: ['title', 'detail', 'targetSection', 'suggestedAddition'],
                  },
                },
              },
              required: ['summary', 'risks', 'adaptations'],
            },
          },
        });

        let acc = '';
        for await (const chunk of stream) {
          acc += chunk.text ?? '';
        }
        return acc;
      })(),
      GEMINI_TIMEOUT_MS,
      'Stress-Test Gemini'
    );

    const parsed = JSON.parse(fullText.trim()) as {
      summary: string;
      risks: string[];
      adaptations: Array<{
        title: string;
        detail: string;
        targetSection: string;
        suggestedAddition: string;
      }>;
    };

    const validSections = new Set([
      'executiveSummary',
      'problem',
      'solution',
      'targetCustomer',
      'competitors',
      'revenueChannels',
      'costStructure',
    ]);

    const result = {
      ...fallback,
      summary: parsed.summary || fallback.summary,
      risks: parsed.risks?.length ? parsed.risks.slice(0, 3) : fallback.risks,
      adaptations: parsed.adaptations?.length
        ? parsed.adaptations.slice(0, 3).map((a, i) => ({
            id: `gem-adp-${Date.now()}-${i}`,
            title: a.title,
            detail: a.detail,
            targetSection: (validSections.has(a.targetSection)
              ? a.targetSection
              : 'revenueChannels') as CoachAction['targetSection'],
            suggestedAddition: a.suggestedAddition.startsWith(' ')
              ? a.suggestedAddition
              : ` ${a.suggestedAddition}`,
            applied: false,
          }))
        : fallback.adaptations,
      source: 'gemini' as const,
    };

    sendSseEvent(res, 'result', { result });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore Gemini API';
    sendSseEvent(res, 'result', { result: fallback, warning: message });
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EvoPlan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
