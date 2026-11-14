import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addQuickNote,
  calculateSectionCompleteness,
  calculateSolidityScore,
  calculateUnitEconomicsImpact,
  computeNextVersionLabel,
  computeSectionDiff,
  computeStageProgress,
  createInitialProjectFromOnboarding,
  generateDeterministicEvolution,
  PRESET_SCENARIOS,
  removeQuickNote,
} from './planLogic';

test('onboarding creates v1.0 with all 7 populated sections and non-zero solidity score', () => {
  const project = createInitialProjectFromOnboarding({
    oneLiner: 'Software per automatizzare la rendicontazione energetica negli edifici commerciali',
    idealCustomer: 'Energy manager e studi di ingegneria in Italia',
    currentPhase: 'mvp',
  });

  assert.equal(project.versions.length, 1);
  assert.equal(project.versions[0].versionLabel, 'v1.0');
  assert.ok(project.versions[0].solidityScore >= 40);
  assert.ok(project.versions[0].sections.executiveSummary.length > 30);
  assert.ok(project.versions[0].coachAnalysis);
  assert.equal(project.versions[0].coachAnalysis?.actions.length, 3);
  assert.equal(project.versions[0].coachAnalysis?.questions.length, 3);
});

test('solidity score increases as sections are enriched and questions/actions are completed', () => {
  const emptySections = {
    executiveSummary: '',
    problem: '',
    solution: '',
    targetCustomer: '',
    competitors: '',
    revenueChannels: '',
    costStructure: '',
  };
  assert.equal(calculateSolidityScore(emptySections, 0, 0, 1), 0);

  const project = createInitialProjectFromOnboarding({
    oneLiner: 'Marketplace B2B per ricambi industriali rigenerati',
    idealCustomer: 'Direttori manutenzione impianti manifatturieri',
    currentPhase: 'traction',
  });
  const v1 = project.versions[0];
  const baseScore = calculateSolidityScore(v1.sections, 0, 0, 1);
  const boostedScore = calculateSolidityScore(v1.sections, 3, 2, 2);

  assert.ok(boostedScore > baseScore, `Expected ${boostedScore} > ${baseScore}`);
});

test('next version label increments minor versions and promotes to v2.0 on major milestones', () => {
  assert.equal(computeNextVersionLabel('v1.0', false), 'v1.1');
  assert.equal(computeNextVersionLabel('v1.1', false), 'v1.2');
  assert.equal(computeNextVersionLabel('v1.1', true), 'v2.0');
  assert.equal(computeNextVersionLabel('v1.3', false), 'v2.0');
});

test('evolution incorporates answered coach questions and produces clear section diffs', () => {
  const project = createInitialProjectFromOnboarding({
    oneLiner: 'CRM verticale per cliniche dentali indipendenti',
    idealCustomer: 'Titolari di studi odontoiatrici con 3-10 poltrone',
    currentPhase: 'idea',
  });
  const v1 = project.versions[0];
  const coach = v1.coachAnalysis!;
  const answeredQuestions = coach.questions.map((q, i) => ({
    ...q,
    answer: `Risposta strategica dettagliata numero ${i + 1} con metriche 25% e 120 €`,
  }));

  const evolution = generateDeterministicEvolution(v1, answeredQuestions, coach.actions);
  const diffs = computeSectionDiff(v1.sections, evolution.nextSections);

  const changed = diffs.filter((d) => d.status !== 'unchanged');
  assert.ok(changed.length >= 3);
  assert.ok(changed.some((d) => d.wordDelta > 0));
  assert.equal(evolution.isMajorMilestone, true);
});

test('stage progress stays coherent across the 5 timeline steps', () => {
  const project = createInitialProjectFromOnboarding({
    oneLiner: 'Piattaforma AI per gestione scorte farmacie',
    idealCustomer: 'Farmacie indipendenti urbane',
    currentPhase: 'mvp',
  });
  const v1 = project.versions[0];
  const progress = computeStageProgress(v1.sections, v1.solidityScore, 1);

  assert.equal(progress.stages.length, 5);
  assert.ok(progress.globalProgressPct > 0 && progress.globalProgressPct <= 100);
  const activeStages = progress.stages.filter((s) => s.status === 'active');
  assert.equal(activeStages.length, 1);
});

test('unit economics stress test halves LTV/CAC when CAC doubles', () => {
  const cacDoubleScenario = PRESET_SCENARIOS.find((s) => s.id === 'cac-double')!;
  const impact = calculateUnitEconomicsImpact(
    {
      cacEur: 300,
      ltvEur: 1500,
      monthlyBurnEur: 8000,
      cashReserveEur: 80000,
      monthlyRevenueEur: 2000,
    },
    cacDoubleScenario.parameters
  );

  assert.equal(impact.baselineLtvCac, 5);
  assert.equal(impact.projectedLtvCac, 2.5);
  assert.ok(impact.projectedRunwayMonths < impact.baselineRunwayMonths);
});

test('section completeness rewards concrete quantitative metrics', () => {
  const vague = calculateSectionCompleteness('Vogliamo vendere software alle aziende.');
  const detailed = calculateSectionCompleteness(
    'Offriamo un abbonamento SaaS B2B a 199 €/mese con payback CAC in 4 mesi e risparmio di 18 ore a settimana per team operativi di 15 persone.'
  );
  assert.ok(detailed > vague + 25);
});

test('quick notes add and delete personal reflections without affecting formal plan or solidity score', () => {
  const project = createInitialProjectFromOnboarding({
    oneLiner: 'Software di previsione domanda per panifici artigianali',
    idealCustomer: 'Titolari di panifici e pasticcerie multi-punto',
    currentPhase: 'idea',
  });
  const initialScore = project.versions[0].solidityScore;
  const initialSections = { ...project.versions[0].sections };

  const withNote = addQuickNote(project, 'Verificare interesse con 3 fornai di quartiere questa settimana');
  assert.equal(withNote.quickNotes?.length, 1);
  assert.equal(withNote.quickNoteDraft, '');
  assert.equal(withNote.versions[0].solidityScore, initialScore);
  assert.deepEqual(withNote.versions[0].sections, initialSections);

  const noteId = withNote.quickNotes![0].id;
  const afterDelete = removeQuickNote(withNote, noteId);
  assert.equal(afterDelete.quickNotes?.length, 0);
});
