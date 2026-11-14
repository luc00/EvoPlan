import type {
  CoachAction,
  CoachAnalysis,
  CoachQuestion,
  FinancialAssumptions,
  OnboardingInput,
  PlanSectionKey,
  PlanSections,
  PlanVersion,
  QuickNote,
  SectionDiffItem,
  StageDefinition,
  StageProgressItem,
  StartupPhase,
  StartupProject,
  StressTestResult,
  StressTestScenario,
} from './types.ts';

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    id: 'idea',
    stepNumber: 1,
    title: 'Idea & Value Proposition',
    subtitle: 'Chiarezza del problema, unicità della soluzione e sintesi esecutiva.',
    linkedSections: ['executiveSummary', 'problem', 'solution'],
    unlockThreshold: 0,
  },
  {
    id: 'market',
    stepNumber: 2,
    title: 'Analisi di Mercato & Target',
    subtitle: 'Segmentazione ICP, urgenza del bisogno e posizionamento competitivo.',
    linkedSections: ['targetCustomer', 'competitors'],
    unlockThreshold: 38,
  },
  {
    id: 'model',
    stepNumber: 3,
    title: 'Modello di Business & Monetizzazione',
    subtitle: 'Pricing, flussi di ricavo ricorrenti e sostenibilità dei margini.',
    linkedSections: ['revenueChannels', 'costStructure'],
    unlockThreshold: 54,
  },
  {
    id: 'gtm',
    stepNumber: 4,
    title: 'Strategia Go-To-Market',
    subtitle: 'Canali di acquisizione, ciclo di vendita e metriche CAC / conversione.',
    linkedSections: ['targetCustomer', 'revenueChannels'],
    unlockThreshold: 68,
  },
  {
    id: 'scale',
    stepNumber: 5,
    title: 'Proiezioni Finanziarie & Scalabilità',
    subtitle: 'Unit economics difendibili, runway, leva operativa e resilienza.',
    linkedSections: ['costStructure', 'executiveSummary'],
    unlockThreshold: 82,
  },
];

export const SECTION_META: Record<
  PlanSectionKey,
  {
    label: string;
    shortLabel: string;
    promptHint: string;
    weight: number;
    stageStep: number;
  }
> = {
  executiveSummary: {
    label: 'Executive Summary',
    shortLabel: 'Summary',
    promptHint: 'Sintesi chiara di missione, proposta di valore e traguardo a 12 mesi.',
    weight: 1.15,
    stageStep: 1,
  },
  problem: {
    label: 'Problema',
    shortLabel: 'Problema',
    promptHint: 'Dolore reale del cliente, costi nascosti oggi e frequenza del problema.',
    weight: 1.0,
    stageStep: 1,
  },
  solution: {
    label: 'Soluzione',
    shortLabel: 'Soluzione',
    promptHint: 'Come il prodotto risolve il problema in modo 10x migliore o più rapido.',
    weight: 1.05,
    stageStep: 1,
  },
  targetCustomer: {
    label: 'Target',
    shortLabel: 'Target',
    promptHint: 'Profilo cliente ideale (ICP), dimensione segmento e potere decisionale.',
    weight: 1.0,
    stageStep: 2,
  },
  competitors: {
    label: 'Competitor',
    shortLabel: 'Competitor',
    promptHint: 'Alternative attuali, vantaggi difendibili e barriere all’ingresso.',
    weight: 0.95,
    stageStep: 2,
  },
  revenueChannels: {
    label: 'Canali di Ricavo',
    shortLabel: 'Ricavi',
    promptHint: 'Modello di pricing, ticket medio, ricorrenza e canali di acquisizione.',
    weight: 1.1,
    stageStep: 3,
  },
  costStructure: {
    label: 'Costi',
    shortLabel: 'Costi',
    promptHint: 'Costi fissi/variabili, CAC stimato, infrastruttura e fabbisogno iniziale.',
    weight: 1.0,
    stageStep: 5,
  },
};

export const SECTION_ORDER: PlanSectionKey[] = [
  'executiveSummary',
  'problem',
  'solution',
  'targetCustomer',
  'competitors',
  'revenueChannels',
  'costStructure',
];

export const PHASE_LABELS: Record<StartupPhase, string> = {
  idea: "Solo un'idea",
  mvp: 'Prototipo / MVP',
  traction: 'Primi clienti / Traction',
  growth: 'In crescita / Scale-up',
};

export const PRESET_SCENARIOS: StressTestScenario[] = [
  {
    id: 'cac-double',
    title: 'Costo di Acquisizione (CAC) raddoppiato',
    category: 'Acquisizione',
    description:
      'Cosa succede se il costo per acquisire un cliente pagante raddoppia a causa di saturazione dei canali o asta ADV più competitiva?',
    parameters: {
      cacMultiplier: 2.0,
      conversionDeltaPct: -15,
      churnDeltaPct: 0,
      burnMultiplier: 1.25,
      launchDelayMonths: 0,
      horizonMonths: 12,
    },
  },
  {
    id: 'launch-6m',
    title: 'Simula il lancio nei primi 6 mesi',
    category: 'Lancio',
    description:
      'Simulazione realistica dei primi 180 giorni sul mercato con conversione iniziale prudenziale e ramp-up progressivo dei ricavi.',
    parameters: {
      cacMultiplier: 1.35,
      conversionDeltaPct: -25,
      churnDeltaPct: 2,
      burnMultiplier: 1.0,
      launchDelayMonths: 1,
      horizonMonths: 6,
    },
  },
  {
    id: 'churn-spike',
    title: 'Compressione Margini & Churn +5%',
    category: 'Retention',
    description:
      'Un competitor abbassa i prezzi del 30% e il tasso di abbandono mensile cresce di 5 punti percentuali riducendo il Lifetime Value.',
    parameters: {
      cacMultiplier: 1.15,
      conversionDeltaPct: -10,
      churnDeltaPct: 5,
      burnMultiplier: 1.1,
      launchDelayMonths: 0,
      horizonMonths: 12,
    },
  },
  {
    id: 'gtm-delay',
    title: 'Ritardo Go-To-Market di 4 mesi',
    category: 'Operativo',
    description:
      'Slittamento tecnico del rilascio di 4 mesi a costi fissi invariati: impatto su cassa residua e fabbisogno finanziario.',
    parameters: {
      cacMultiplier: 1.1,
      conversionDeltaPct: -20,
      churnDeltaPct: 0,
      burnMultiplier: 1.15,
      launchDelayMonths: 4,
      horizonMonths: 12,
    },
  },
];

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function calculateSectionCompleteness(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = countWords(trimmed);
  const lengthScore = Math.min(62, Math.round((words / 55) * 62));

  // Reward quantitative/concrete detail (numbers, %, €, KPIs, timeframes)
  const hasNumbers = /\d/.test(trimmed) ? 14 : 0;
  const hasCurrencyOrPct = /(€|\$|%|mesi|giorni|settimane|anno|CAC|LTV|MRR|ARR|B2B|B2C|ROI)/i.test(trimmed)
    ? 12
    : 0;
  const hasStructure = trimmed.includes('.') || trimmed.includes(':') || trimmed.includes('-') ? 12 : 4;

  return Math.min(100, lengthScore + hasNumbers + hasCurrencyOrPct + hasStructure);
}

export function calculateSolidityScore(
  sections: PlanSections,
  answeredQuestionsCount = 0,
  appliedActionsCount = 0,
  versionCount = 1
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of SECTION_ORDER) {
    const meta = SECTION_META[key];
    const completeness = calculateSectionCompleteness(sections[key] || '');
    weightedSum += completeness * meta.weight;
    totalWeight += meta.weight;
  }

  const baseSectionScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Base sections contribute up to 74 pts; validation/evolution actions contribute up to 26 pts
  const sectionContribution = baseSectionScore * 0.74;
  const questionContribution = Math.min(12, answeredQuestionsCount * 4);
  const actionContribution = Math.min(8, appliedActionsCount * 2.7);
  const iterationContribution = Math.min(6, Math.max(0, versionCount - 1) * 3);

  return Math.max(0, Math.min(100, Math.round(sectionContribution + questionContribution + actionContribution + iterationContribution)));
}

export function computeStageProgress(
  sections: PlanSections,
  solidityScore: number,
  versionsCount = 1
): {
  stages: StageProgressItem[];
  activeStageIndex: number;
  globalProgressPct: number;
  completedCount: number;
} {
  const stageItems: StageProgressItem[] = STAGE_DEFINITIONS.map((stage) => {
    const readinessSum = stage.linkedSections.reduce(
      (acc, secKey) => acc + calculateSectionCompleteness(sections[secKey] || ''),
      0
    );
    const avgReadiness = Math.round(readinessSum / stage.linkedSections.length);
    // Factor in iteration maturity for later stages
    const maturityBonus = stage.stepNumber <= versionsCount + 1 ? 8 : 0;
    const readiness = Math.min(100, avgReadiness + (solidityScore >= stage.unlockThreshold ? maturityBonus : 0));

    let status: StageProgressItem['status'] = 'locked';
    if (solidityScore >= stage.unlockThreshold + 18 && avgReadiness >= 68 && stage.stepNumber <= versionsCount + 2) {
      status = 'completed';
    } else if (solidityScore >= stage.unlockThreshold) {
      status = 'active';
    }

    return { stage, status, readiness };
  });

  // Ensure sequential coherence: completed -> active (exactly one) -> locked
  let foundActive = false;
  for (let i = 0; i < stageItems.length; i++) {
    const item = stageItems[i];
    if (foundActive) {
      item.status = 'locked';
      continue;
    }
    if (item.status !== 'completed') {
      item.status = 'active';
      foundActive = true;
    }
  }

  const completedCount = stageItems.filter((s) => s.status === 'completed').length;
  const activeIdx = stageItems.findIndex((s) => s.status === 'active');
  const activeStageIndex = activeIdx >= 0 ? activeIdx : stageItems.length - 1;

  const avgStageReadiness =
    stageItems.reduce((sum, s) => sum + s.readiness, 0) / stageItems.length;
  const globalProgressPct = Math.min(
    100,
    Math.round(completedCount * 16 + avgStageReadiness * 0.28)
  );

  return {
    stages: stageItems,
    activeStageIndex,
    globalProgressPct,
    completedCount,
  };
}

export function computeNextVersionLabel(currentLabel: string, isMajorMilestone: boolean): string {
  const match = currentLabel.match(/^v(\d+)\.(\d+)$/i);
  if (!match) return 'v1.1';
  const major = Number(match[1]);
  const minor = Number(match[2]);

  if (isMajorMilestone || minor >= 3) {
    return `v${major + 1}.0`;
  }
  return `v${major}.${minor + 1}`;
}

export function computeSectionDiff(
  oldSections: PlanSections,
  newSections: PlanSections
): SectionDiffItem[] {
  return SECTION_ORDER.map((key) => {
    const oldText = (oldSections[key] || '').trim();
    const newText = (newSections[key] || '').trim();
    const oldWords = countWords(oldText);
    const newWords = countWords(newText);
    const wordDelta = newWords - oldWords;

    let status: SectionDiffItem['status'] = 'unchanged';
    if (oldText !== newText) {
      status = wordDelta >= 8 ? 'expanded' : 'refined';
    }

    return {
      key,
      label: SECTION_META[key].label,
      oldText,
      newText,
      oldWords,
      newWords,
      wordDelta,
      status,
    };
  });
}

export function calculateUnitEconomicsImpact(
  assumptions: FinancialAssumptions,
  params: StressTestScenario['parameters']
): {
  baselineRunwayMonths: number;
  projectedRunwayMonths: number;
  baselineLtvCac: number;
  projectedLtvCac: number;
  projectedBreakEvenMonths: number | null;
  monthlyNetBurnProjected: number;
  impactScoreDelta: number;
} {
  const safeCac = Math.max(1, assumptions.cacEur);
  const safeLtv = Math.max(1, assumptions.ltvEur);
  const baseNetBurn = Math.max(500, assumptions.monthlyBurnEur - assumptions.monthlyRevenueEur);

  const baselineLtvCac = Number((safeLtv / safeCac).toFixed(2));
  const baselineRunwayMonths = Number((assumptions.cashReserveEur / baseNetBurn).toFixed(1));

  const projectedCac = safeCac * params.cacMultiplier;
  // Churn increase reduces LTV proportionally; conversion drop lowers active revenue ramp
  const churnRetentionFactor = Math.max(0.45, 1 - params.churnDeltaPct * 0.045);
  const projectedLtv = safeLtv * churnRetentionFactor;
  const projectedLtvCac = Number((projectedLtv / projectedCac).toFixed(2));

  const revenueFactor = Math.max(0.25, 1 + params.conversionDeltaPct / 100);
  const effectiveMonthlyRev =
    params.launchDelayMonths >= params.horizonMonths
      ? 0
      : assumptions.monthlyRevenueEur * revenueFactor * (1 - params.launchDelayMonths / (params.horizonMonths + 2));

  const projectedGrossBurn = assumptions.monthlyBurnEur * params.burnMultiplier;
  const monthlyNetBurnProjected = Math.max(300, Math.round(projectedGrossBurn - effectiveMonthlyRev));
  const projectedRunwayMonths = Number(
    Math.max(1, assumptions.cashReserveEur / monthlyNetBurnProjected).toFixed(1)
  );

  // Break-even heuristic based on unit margin recovery + delay
  const monthlyGrowthMargin = Math.max(0, effectiveMonthlyRev * 0.22);
  let projectedBreakEvenMonths: number | null = null;
  if (projectedLtvCac >= 1.4 && monthlyGrowthMargin > 0) {
    projectedBreakEvenMonths = Math.round(
      Math.min(48, 8 + params.launchDelayMonths + (projectedGrossBurn / Math.max(400, effectiveMonthlyRev)) * 3)
    );
  }

  let impactScoreDelta = 0;
  if (projectedLtvCac < 1.5) impactScoreDelta -= 14;
  else if (projectedLtvCac < 2.5) impactScoreDelta -= 7;
  if (projectedRunwayMonths < 6) impactScoreDelta -= 10;
  else if (projectedRunwayMonths < 10) impactScoreDelta -= 5;

  return {
    baselineRunwayMonths,
    projectedRunwayMonths,
    baselineLtvCac,
    projectedLtvCac,
    projectedBreakEvenMonths,
    monthlyNetBurnProjected,
    impactScoreDelta,
  };
}

function deriveProjectName(oneLiner: string, explicitName?: string): string {
  if (explicitName && explicitName.trim().length > 1) {
    return explicitName.trim();
  }
  const clean = oneLiner.trim().replace(/^una?\s+/i, '');
  const words = clean.split(/\s+/).slice(0, 3).join(' ');
  return words.length > 3 ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : 'Nuova Startup';
}

export function generateDeterministicV1Plan(input: OnboardingInput): {
  projectName: string;
  sections: PlanSections;
  assumptions: FinancialAssumptions;
} {
  const idea = input.oneLiner.trim();
  const customer = input.idealCustomer.trim();
  const phaseLabel = PHASE_LABELS[input.currentPhase];
  const projectName = deriveProjectName(idea, input.projectName);

  const phaseGoal =
    input.currentPhase === 'idea'
      ? 'validare il bisogno con 15 interviste e un prototipo cliccabile entro 60 giorni'
      : input.currentPhase === 'mvp'
        ? 'convertire i primi 10 design partner in clienti paganti entro 90 giorni'
        : input.currentPhase === 'traction'
          ? 'portare i ricavi ricorrenti a 15.000 €/mese riducendo il ciclo di vendita'
          : 'scalare i canali di acquisizione mantenendo un rapporto LTV/CAC superiore a 3.5x';

  const sections: PlanSections = {
    executiveSummary: `${projectName} sviluppa una soluzione dedicata a ${customer}, incentrata su: ${idea.charAt(0).toLowerCase()}${idea.slice(1)}. Attualmente nella fase "${phaseLabel}", il focus nei prossimi 6 mesi è ${phaseGoal}.`,
    problem: `${customer} affronta oggi processi frammentati, tempi operativi elevati e mancanza di visibilità sui costi nascosti. Le soluzioni attuali richiedono lavoro manuale e causano inefficienze stimate tra il 20% e il 35% delle risorse settimanali.`,
    solution: `La proposta di ${projectName} integra workflow automatizzati e analisi predittiva in un'unica interfaccia pensata specificamente per ${customer}, riducendo i tempi di esecuzione del 50% fin dalla prima settimana di adozione.`,
    targetCustomer: `Segmento primario: ${customer} (early adopter con budget autonomo e urgenza operativa elevata). Mercato iniziale focalizzato su aziende e team in Italia ed Europa occidentale con elevata propensione al digitale.`,
    competitors: `Le alternative attuali includono fogli di calcolo interni, consulenti tradizionali e suite enterprise complesse. ${projectName} si differenzia per tempi di attivazione inferiori a 48 ore, UX focalizzata e costi trasparenti.`,
    revenueChannels: `Modello SaaS ricorrente a livelli (piano Starter da 79 €/mese e piano Pro da 249 €/mese), integrato da setup guidato opzionale. Acquisizione iniziale tramite outbound mirato, partnership di settore e contenuti ad alta intenzione.`,
    costStructure: `Struttura snella orientata al prodotto: costi cloud e API (circa 650 €/mese), acquisizione clienti iniziale (CAC stimato 320 €), sviluppo core e customer success. Burn rate mensile target contenuto entro 6.500 € nei primi 6 mesi.`,
  };

  const assumptions: FinancialAssumptions =
    input.currentPhase === 'growth'
      ? { cacEur: 420, ltvEur: 2200, monthlyBurnEur: 14000, cashReserveEur: 140000, monthlyRevenueEur: 9500 }
      : input.currentPhase === 'traction'
        ? { cacEur: 350, ltvEur: 1650, monthlyBurnEur: 9000, cashReserveEur: 85000, monthlyRevenueEur: 4200 }
        : { cacEur: 320, ltvEur: 1350, monthlyBurnEur: 6500, cashReserveEur: 60000, monthlyRevenueEur: 1200 };

  return { projectName, sections, assumptions };
}

export function generateDeterministicCoachAnalysis(
  sections: PlanSections,
  stageIndex: number
): CoachAnalysis {
  const scored = SECTION_ORDER.map((key) => ({
    key,
    score: calculateSectionCompleteness(sections[key] || ''),
  })).sort((a, b) => a.score - b.score);

  const weakest = scored.slice(0, 3);

  const actionSuggestions: Record<PlanSectionKey, { title: string; desc: string; addition: string }> = {
    executiveSummary: {
      title: 'Quantifica l’obiettivo a 12 mesi nell’Executive Summary',
      desc: 'Inserisci un traguardo misurabile (clienti attivi, MRR target e metrica di validazione) per rendere la tesi verificabile.',
      addition: ' Obiettivo operativo a 12 mesi: raggiungere 45 clienti paganti con 11.200 € di MRR e payback del CAC inferiore a 4 mesi.',
    },
    problem: {
      title: 'Quantifica il costo economico del Problema',
      desc: 'Esplicita quanto tempo o denaro perde oggi il cliente senza la tua soluzione per giustificare il pricing.',
      addition: ' Impatto economico stimato sul cliente: oltre 14 ore/settimana perse in attività manuali e circa 1.800 €/mese di costi operativi evitabili.',
    },
    solution: {
      title: 'Definisci il vantaggio 10x e il tempo di onboarding',
      desc: 'Specifica il primo risultato concreto ("Time-to-Value") che l’utente ottiene nei primi 15 minuti.',
      addition: ' Time-to-Value garantito sotto i 15 minuti tramite importazione guidata e template pronti per il settore.',
    },
    targetCustomer: {
      title: 'Restringi l’ICP a una nicchia iper-specifica',
      desc: 'Indica ruolo del buyer, dimensione aziendale e trigger d’acquisto immediato.',
      addition: ' Trigger d’acquisto principale: crescita del team oltre 10 unità o adozione di nuovi vincoli normativi di rendicontazione.',
    },
    competitors: {
      title: 'Esplicita il fossato competitivo (Moat)',
      desc: 'Chiarisci perché un incumbent non può replicare facilmente la tua proposta nei prossimi 12 mesi.',
      addition: ' Vantaggio difendibile basato su dati proprietari di benchmark settoriale e integrazioni native verticali.',
    },
    revenueChannels: {
      title: 'Allinea pricing, espansione e canale primario',
      desc: 'Specifica il prezzo annuale vs mensile e il meccanismo di upsell naturale al crescere dell’uso.',
      addition: ' Sconto 18% sul pagamento annuale anticipato per migliorare il flusso di cassa e espansione tramite pacchetti utenti extra (+29 €/utente).',
    },
    costStructure: {
      title: 'Collega i costi ai driver di scala e margini lordi',
      desc: 'Separa costi fissi di struttura da costi variabili per cliente per evidenziare il margine lordo target.',
      addition: ' Margine lordo stimato all’82% a regime; costi variabili infrastrutturali pari a 14 €/mese per account attivo.',
    },
  };

  const actions: CoachAction[] = weakest.map((item, idx) => {
    const template = actionSuggestions[item.key];
    return {
      id: `act-${item.key}-${idx}`,
      title: template.title,
      description: template.desc,
      targetSection: item.key,
      suggestedText: template.addition,
      applied: false,
    };
  });

  const stageName = STAGE_DEFINITIONS[stageIndex]?.title ?? 'Idea & Value Proposition';

  const blindSpots = [
    {
      id: 'bs-1',
      title: 'Validazione della disponibilità a pagare (Willingness-to-Pay)',
      severity: 'high' as const,
      detail:
        'Il pricing ipotizzato non è ancora supportato da pre-ordini, lettere d’intenti o test su landing page con checkout simulato.',
    },
    {
      id: 'bs-2',
      title: 'Dipendenza da un solo canale di acquisizione',
      severity: 'medium' as const,
      detail:
        'Se il costo outbound o ADV aumenta del 40%, manca un canale organico o di partnership pronto ad assorbire il traffico.',
    },
    {
      id: 'bs-3',
      title: 'Metriche di retention nel trimestre iniziale',
      severity: 'medium' as const,
      detail:
        'È necessario definire la soglia di attivazione entro 7 giorni dal signup per prevenire churn precoce.',
    },
  ];

  const questions: CoachQuestion[] = [
    {
      id: 'q-1',
      question: 'Qual è l’obiezione numero 1 che i potenziali clienti hanno sollevato finora e come la superi?',
      hint: 'Es. "Costa troppo integrarlo" → Offriamo onboarding assistito gratuito in 48 ore.',
      answer: '',
    },
    {
      id: 'q-2',
      question: 'Quale canale ti permetterà di acquisire i prossimi 10 clienti al costo più basso nei prossimi 45 giorni?',
      hint: 'Es. Outbound su LinkedIn verso responsabili operations + 2 partnership con associazioni.',
      answer: '',
    },
    {
      id: 'q-3',
      question: 'Quale metrica singola dimostra che stai sbloccando lo stadio successivo rispetto a oggi?',
      hint: 'Es. Tasso di conversione trial->paid > 18% o 3 clienti annuali prepagati.',
      answer: '',
    },
  ];

  return {
    summary: `Analisi focalizzata sullo stadio "${stageName}". Le aree con maggiore margine di rafforzamento sono ${weakest.map((w) => SECTION_META[w.key].label).join(', ')}. Rispondi alle domande strategiche per evolvere il piano.`,
    actions,
    blindSpots,
    questions,
    generatedAt: new Date().toISOString(),
    source: 'local',
  };
}

export function generateDeterministicEvolution(
  currentVersion: PlanVersion,
  questions: CoachQuestion[],
  actions: CoachAction[]
): {
  nextSections: PlanSections;
  changeSummary: string;
  isMajorMilestone: boolean;
} {
  const answered = questions.filter((q) => q.answer.trim().length > 2);
  const nextSections: PlanSections = { ...currentVersion.sections };

  // Apply any unapplied actions that help strengthen weak sections, or refine with user answers
  const improvements: string[] = [];

  for (const action of actions) {
    if (!action.applied && !nextSections[action.targetSection].includes(action.suggestedText.trim())) {
      nextSections[action.targetSection] = `${nextSections[action.targetSection].trim()}${action.suggestedText}`;
      improvements.push(SECTION_META[action.targetSection].label);
    }
  }

  if (answered[0]) {
    nextSections.competitors = `${nextSections.competitors.trim()} Risposta alle obiezioni di mercato: ${answered[0].answer.trim()}.`;
    improvements.push('Competitor');
  }
  if (answered[1]) {
    nextSections.revenueChannels = `${nextSections.revenueChannels.trim()} Piano di acquisizione prioritario (45 giorni): ${answered[1].answer.trim()}.`;
    improvements.push('Canali di Ricavo');
  }
  if (answered[2]) {
    nextSections.executiveSummary = `${nextSections.executiveSummary.trim()} North Star Metric di fase: ${answered[2].answer.trim()}.`;
    improvements.push('Executive Summary');
  }

  // Ensure cost structure gains unit economics sharpness during evolution
  if (!/payback|margine/i.test(nextSections.costStructure)) {
    nextSections.costStructure = `${nextSections.costStructure.trim()} Focus su efficienza del capitale: monitoraggio mensile del rapporto LTV/CAC (target > 3.5x) e payback entro 5 mesi.`;
  }

  const uniqueImproved = Array.from(new Set(improvements));
  const isMajorMilestone = answered.length >= 2 || currentVersion.solidityScore >= 72;

  const changeSummary =
    uniqueImproved.length > 0
      ? `Evoluzione iterativa con rafforzamento di ${uniqueImproved.slice(0, 3).join(', ')} e integrazione di ${answered.length} risposte strategiche.`
      : 'Raffinamento strutturale delle metriche operative e allineamento degli unit economics.';

  return {
    nextSections,
    changeSummary,
    isMajorMilestone,
  };
}

export function generateDeterministicStressTest(
  sections: PlanSections,
  assumptions: FinancialAssumptions,
  scenario: StressTestScenario,
  customPrompt?: string
): StressTestResult {
  const effectiveScenario: StressTestScenario = customPrompt?.trim()
    ? {
        ...scenario,
        id: `custom-${Date.now()}`,
        title: customPrompt.trim(),
        category: 'Scenario Personalizzato',
        description: customPrompt.trim(),
        parameters: {
          cacMultiplier: /raddoppia|cac|costo/i.test(customPrompt) ? 1.8 : 1.35,
          conversionDeltaPct: -20,
          churnDeltaPct: /churn|abbandon|prezz/i.test(customPrompt) ? 4 : 1.5,
          burnMultiplier: /burn|ritardo|lancio/i.test(customPrompt) ? 1.25 : 1.1,
          launchDelayMonths: /6 mesi|ritardo/i.test(customPrompt) ? 2 : 0,
          horizonMonths: /6 mesi/i.test(customPrompt) ? 6 : 12,
        },
      }
    : scenario;

  const econ = calculateUnitEconomicsImpact(assumptions, effectiveScenario.parameters);

  const risks = [
    `Il rapporto LTV/CAC passa da ${econ.baselineLtvCac}x a ${econ.projectedLtvCac}x: sotto 2.5x l’acquisizione a pagamento brucia cassa troppo velocemente.`,
    `La runway stimata scende da ${econ.baselineRunwayMonths} a ${econ.projectedRunwayMonths} mesi con un net burn proiettato di ${econ.monthlyNetBurnProjected.toLocaleString('it-IT')} €/mese.`,
    sections.revenueChannels.length < 140
      ? 'Canali di ricavo poco diversificati: forte esposizione a variazioni improvvise di prezzo o conversione.'
      : 'Il ciclo di payback si allunga oltre i primi 6 mesi richiedendo pagamenti annuali anticipati per proteggere la liquidità.',
  ];

  const adaptations = [
    {
      id: `adp-${Date.now()}-1`,
      title: 'Introduci fatturazione annuale con incentivo cassa',
      detail: 'Offri 2 mesi gratuiti sul piano annuale per incassare subito 10 mesi di ricavo e compensare lo shock sul CAC.',
      targetSection: 'revenueChannels' as PlanSectionKey,
      suggestedAddition:
        ' Mitigazione Stress-Test: piano annuale prepagato (-16%) come opzione predefinita per finanziare il CAC fin dal mese 1.',
      applied: false,
    },
    {
      id: `adp-${Date.now()}-2`,
      title: 'Attiva un canale organico/referral a costo marginale quasi zero',
      detail: 'Affianca all’acquisizione a pagamento un programma di referral B2B o partnership per ridurre il CAC medio del 30%.',
      targetSection: 'targetCustomer' as PlanSectionKey,
      suggestedAddition:
        ' Strategia anti-shock CAC: attivazione programma referral tra clienti attivi e co-marketing con partner di filiera.',
      applied: false,
    },
    {
      id: `adp-${Date.now()}-3`,
      title: 'Taglio modulare del burn discrezionale sotto soglia runway',
      detail: 'Definisci un piano di contingenza automatico se la runway scende sotto i 7 mesi.',
      targetSection: 'costStructure' as PlanSectionKey,
      suggestedAddition:
        ' Clausola di resilienza: blocco spese marketing non performanti e congelamento costi non-core se la runway scende sotto 7 mesi.',
      applied: false,
    },
  ];

  const summary =
    econ.projectedLtvCac < 2
      ? `Attenzione critica nello scenario "${effectiveScenario.title}": l'equilibrio unitario scende a ${econ.projectedLtvCac}x e richiede un intervento immediato su pricing o canali organici.`
      : `Nello scenario "${effectiveScenario.title}", il modello regge ma comprime la runway a ${econ.projectedRunwayMonths} mesi. Le 3 contromisure proposte ripristinano il margine di sicurezza.`;

  return {
    id: `st-${Date.now()}`,
    scenarioId: effectiveScenario.id,
    scenarioTitle: effectiveScenario.title,
    summary,
    impactScoreDelta: econ.impactScoreDelta,
    baselineRunwayMonths: econ.baselineRunwayMonths,
    projectedRunwayMonths: econ.projectedRunwayMonths,
    baselineLtvCac: econ.baselineLtvCac,
    projectedLtvCac: econ.projectedLtvCac,
    projectedBreakEvenMonths: econ.projectedBreakEvenMonths,
    monthlyNetBurnProjected: econ.monthlyNetBurnProjected,
    risks,
    adaptations,
    source: 'local',
    generatedAt: new Date().toISOString(),
  };
}

export function createInitialProjectFromOnboarding(input: OnboardingInput): StartupProject {
  const { projectName, sections, assumptions } = generateDeterministicV1Plan(input);
  const now = new Date().toISOString();
  const initialScore = calculateSolidityScore(sections, 0, 0, 1);
  const { activeStageIndex } = computeStageProgress(sections, initialScore, 1);
  const coachAnalysis = generateDeterministicCoachAnalysis(sections, activeStageIndex);

  const v1: PlanVersion = {
    id: `ver-${Date.now()}`,
    versionLabel: 'v1.0',
    createdAt: now,
    stageIndex: activeStageIndex,
    solidityScore: initialScore,
    changeSummary: 'Generazione iniziale v1.0 da Onboarding Guidato.',
    sections,
    coachAnalysis,
  };

  return {
    id: `proj-${Date.now()}`,
    name: projectName,
    oneLiner: input.oneLiner.trim(),
    idealCustomer: input.idealCustomer.trim(),
    currentPhase: input.currentPhase,
    currentVersionId: v1.id,
    versions: [v1],
    assumptions,
    stressTests: [],
    quickNoteDraft: '',
    quickNotes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addQuickNote(project: StartupProject, rawText: string): StartupProject {
  const text = rawText.trim();
  if (!text) return project;

  const newNote: QuickNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    createdAt: new Date().toISOString(),
  };

  return {
    ...project,
    quickNoteDraft: '',
    quickNotes: [newNote, ...(project.quickNotes ?? [])],
  };
}

export function removeQuickNote(project: StartupProject, noteId: string): StartupProject {
  return {
    ...project,
    quickNotes: (project.quickNotes ?? []).filter((n) => n.id !== noteId),
  };
}

export function createDemoSeedProject(): StartupProject {
  return createInitialProjectFromOnboarding({
    projectName: 'LogiFlow AI',
    oneLiner: 'Piattaforma predittiva per ottimizzare le consegne ultimo miglio delle PMI manifatturiere',
    idealCustomer: 'Responsabili logistica di PMI italiane tra 20 e 150 dipendenti',
    currentPhase: 'mvp',
  });
}
