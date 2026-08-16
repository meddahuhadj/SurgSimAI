// ════════════════════════════════════════════════════════════════════
//  SurgSim 3D — MODES ENGINE  (app-modes.js)
//  🧑‍🎓 Academic | 🧪 Research | 🥽 Simulation
//  Isolé — aucune régression sur les spécialités existantes
// ════════════════════════════════════════════════════════════════════

// ── État global ─────────────────────────────────────────────────────
const PLATFORM_MODE = {
  current: null,
  aiLevel: 2,
  activeCase: null,
  activeStudy: null,
  sessionStart: null,
  sessionMetrics: {},
  scenarios: [],
  currentScenario: 0,
  _academicTimer: null,
  _researchTimer: null,
  _simTimer: null,
  _researchClickHandler: null,
};

// ════════════════════════════════════════════════════════════════════
//  CAS ACADÉMIQUES
// ════════════════════════════════════════════════════════════════════
const ACADEMIC_CASES = [
  // NIVEAU FACILE (Débutant)
  {
    id:'CAS-F01-LIVER', organ:'Foie', emoji:'🫀',
    title:'Kyste biliaire simple segment IV',
    difficulty:'Facile', difficultyColor:'#22c55e',
    description:'Patient 45 ans, kyste biliaire symptomatique de 8cm au segment IV. Aucune proximité vasculaire majeure.',
    objectives:[
      'Identifier les segments hépatiques (Couinaud)',
      'Délimiter la lésion kystique',
      'Mesurer le volume du kyste',
      'Planifier une fenestration (dôme saillant)',
      'Évaluer la distance avec la bifurcation portale',
    ],
    referenceStrategy:{ procedure:'Fenestration laparoscopique', margin:'0 mm (contact kyste)', approach:'Laparoscopie', remnant:'98%' },
    referenceVolume:{ resected:10, remnant:1400, distanceMin:25.0, riskStructures:0 },
    timeLimit:10,
  },
  {
    id:'CAS-F02-LIVER', organ:'Foie', emoji:'🫀',
    title:'Hémangiome géant segment VI',
    difficulty:'Facile', difficultyColor:'#22c55e',
    description:'Patiente 52 ans, hémangiome de 12cm segment VI, douleurs abdominales. Indication opératoire retenue.',
    objectives:[
      'Identifier le segment VI',
      'Planifier une énucléation',
      'Évaluer la distance à la veine sus-hépatique droite',
    ],
    referenceStrategy:{ procedure:'Énucléation', margin:'0-2 mm', approach:'Laparotomie', remnant:'90%' },
    referenceVolume:{ resected:120, remnant:1300, distanceMin:15.0, riskStructures:1 },
    timeLimit:15,
  },
  // NIVEAU MOYEN (Intermédiaire)
  {
    id:'CAS-M01-LIVER', organ:'Foie', emoji:'🫀',
    title:'Tumeur hépatique du segment VI',
    difficulty:'Intermédiaire', difficultyColor:'#f59e0b',
    description:'Patient de 58 ans, CHC sur foie cirrhotique Child-Pugh A. Lésion de 3,2 cm au segment VI, à 8 mm de la VSH droite.',
    objectives:[
      'Identifier les structures vasculaires à risque',
      'Proposer une marge de sécurité (≥ 10 mm)',
      'Choisir le type de résection (Segmentectomie VI)',
      'Simuler la trajectoire de résection',
      'Comparer avec le plan de référence',
    ],
    referenceStrategy:{ procedure:'Segmentectomie VI', margin:'10 mm', approach:'Laparoscopie', remnant:'>40%' },
    referenceVolume:{ resected:186, remnant:923, distanceMin:8.0, riskStructures:2 },
    timeLimit:20,
  },
  {
    id:'CAS-M02-LIVER', organ:'Foie', emoji:'🫀',
    title:'Métastase hépatique segment II/III',
    difficulty:'Intermédiaire', difficultyColor:'#f59e0b',
    description:'Métastase unique de 4cm post-CCR. Proximité immédiate avec le pédicule portal gauche.',
    objectives:[
      'Planifier une lobectomie gauche',
      'Identifier le pédicule portal gauche',
      'Vérifier la préservation du pédicule droit',
    ],
    referenceStrategy:{ procedure:'Lobectomie gauche', margin:'5 mm', approach:'Laparoscopie', remnant:'70%' },
    referenceVolume:{ resected:350, remnant:1050, distanceMin:5.0, riskStructures:1 },
    timeLimit:20,
  },
  // NIVEAU AVANCÉ
  {
    id:'CAS-A01-LIVER', organ:'Foie', emoji:'🫀',
    title:'Métastase colorectale bifocale',
    difficulty:'Avancé', difficultyColor:'#ef4444',
    description:'Patient 67 ans, métastases synchrones segments IV-VIII. Réponse partielle post-chimio.',
    objectives:[
      'Cartographier les 2 lésions',
      'Évaluer le rapport lésion / veine sus-hépatique médiane',
      'Calculer le volume du futur foie restant (FLR)',
      'Décider de la stratégie (1 ou 2 temps)',
      'Simuler la résection combinée',
    ],
    referenceStrategy:{ procedure:'Bisegmentectomie IV-VIII + métastasectomie', margin:'8 mm', approach:'Laparotomie', remnant:'>30%' },
    referenceVolume:{ resected:312, remnant:720, distanceMin:3.2, riskStructures:3 },
    timeLimit:25,
  },
  // NIVEAU EXPERT
  {
    id:'CAS-E01-LIVER', organ:'Foie', emoji:'🫀',
    title:'Cholangiocarcinome péri-hilaire',
    difficulty:'Expert', difficultyColor:'#a855f7',
    description:'Tumeur de Klatskin Bismuth IIIb (extension à gauche). Nécessité d\'une hépatectomie gauche élargie au segment I.',
    objectives:[
      'Identifier la convergence biliaire principale',
      'Planifier une hépatectomie gauche + S1',
      'Évaluer la bifurcation portale et artérielle',
      'Estimer le volume résiduel droit avec précision',
    ],
    referenceStrategy:{ procedure:'Hépatectomie gauche élargie au caudé', margin:'R0 microscopique', approach:'Laparotomie + anastomose bilio-digestive', remnant:'45%' },
    referenceVolume:{ resected:600, remnant:650, distanceMin:1.0, riskStructures:4 },
    timeLimit:35,
  }
];

// ════════════════════════════════════════════════════════════════════
//  ÉTUDES DE RECHERCHE
// ════════════════════════════════════════════════════════════════════
const RESEARCH_STUDIES = {
  A:{ id:'A', emoji:'🔬', color:'#4fc3f7',
    title:'Segmentation Automatique vs Manuelle',
    hypothesis:'La segmentation IA réduit le temps de délimitation anatomique de ≥ 40% sans perte de précision cliniquement significative.',
    groups:['Groupe contrôle : segmentation manuelle','Groupe IA : TotalSegmentator automatique'],
    metrics:['Temps de segmentation (s)','Précision DSC (Dice)','Volume calculé (cm³)','Erreur de marge (mm)','Corrections manuelles'],
  },
  B:{ id:'B', emoji:'🎙️', color:'#eab308',
    title:'Interface Classique vs Voice-First',
    hypothesis:'L\'interface Voice-First réduit le temps de planification de ≥ 25% et améliore la stérilité du champ.',
    groups:['Groupe A : interface classique (clavier/souris)','Groupe B : Voice-First (commandes vocales)'],
    metrics:['Temps planification (s)','Nombre de clics','Erreurs interaction','Satisfaction (1-10)','Commandes vocales reconnues','Taux reconnaissance (%)'],
  },
  C:{ id:'C', emoji:'🤖', color:'#a855f7',
    title:'Chirurgien Seul vs Chirurgien + IA',
    hypothesis:'L\'assistance IA niveau 2 réduit les erreurs de planification de ≥ 30% et augmente la confiance décisionnelle.',
    groups:['Groupe contrôle : chirurgien seul (IA silencieuse)','Groupe IA : IA assistante active'],
    metrics:['Erreurs de planification','Distance min. structures critiques (mm)','Confiance décisionnelle (1-10)','Modifications du plan','Score final','Temps décision (s)'],
  },
  D:{ id:'D', emoji:'🥽', color:'#22c55e',
    title:'Modèle 3D Seul vs 3D + Simulation',
    hypothesis:'L\'ajout de la simulation de résection améliore la compréhension volumétrique et réduit les erreurs de marge de ≥ 35%.',
    groups:['Groupe A : modèle 3D + mesures uniquement','Groupe B : 3D + simulation de résection interactive'],
    metrics:['Erreur de volume réséqué (%)','Erreur de marge (mm)','Compréhension anatomique (QCM)','Temps planification (s)','Résultats avant/après simulation'],
  },
};

// ════════════════════════════════════════════════════════════════════
//  BIBLIOTHÈQUE CAS SIMULATION
// ════════════════════════════════════════════════════════════════════
// Chaque cas porte un champ `geometry` : volumes/distance SYNTHÉTIQUES mais
// FIXES (dérivés de la description clinique, pas mesurés sur imagerie réelle
// — ce catalogue reste un texte narratif, pas une segmentation). Objectif :
// que les métriques de scénario (compareSimScenarios, panneau Résection)
// dépendent du cas chargé au lieu d'un Math.random() par clic. À remplacer
// par de vraies valeurs issues de la segmentation dès qu'un pipeline DICOM
// réel alimentera ce catalogue.
const CASE_LIBRARY = {
  foie:[
    { id:'SIM-001', title:'Hépatectomie droite réglée', difficulty:'Avancé', type:'Cas synthétique', emoji:'🫀', desc:'CHC S6-S7, rapport proche de la VSH droite.',
      geometry:{ tumorVolMl:65.4, organVolMl:1500, criticalVesselDistanceMm:4, criticalVesselName:'Veine sus-hépatique droite' } },
    { id:'SIM-002', title:'Métastase unique S4', difficulty:'Intermédiaire', type:'Cas généré IA', emoji:'🫀', desc:'Métastase colorectale 2,8 cm, S4, contact VSH médiane.',
      geometry:{ tumorVolMl:11.5, organVolMl:1400, criticalVesselDistanceMm:1, criticalVesselName:'Veine sus-hépatique médiane' } },
    { id:'SIM-003', title:'Résection atypique guidée IA', difficulty:'Expert', type:'Cas anonymisé réel', emoji:'🫀', desc:'CHC bifocal S5-S6, cirrhotique Child A, FLR 34%.',
      geometry:{ tumorVolMl:50.0, organVolMl:600, criticalVesselDistanceMm:6, criticalVesselName:'Branche portale droite' } },
  ],
  pancreas:[
    { id:'SIM-101', title:'Whipple pour ADK céphalique', difficulty:'Expert', type:'Cas synthétique', emoji:'🫁', desc:'AMS au contact < 180°, dilatation voies biliaires.',
      geometry:{ tumorVolMl:14.1, organVolMl:80, criticalVesselDistanceMm:0.5, criticalVesselName:'Artère mésentérique supérieure' } },
    { id:'SIM-102', title:'TIPMP kystique corps-queue', difficulty:'Intermédiaire', type:'Cas généré IA', emoji:'🫁', desc:'Tumeur intracanalaire papillaire mucineuse, pancréatectomie distale.',
      geometry:{ tumorVolMl:20.6, organVolMl:80, criticalVesselDistanceMm:12, criticalVesselName:'Veine splénique' } },
  ],
  rein:[
    { id:'SIM-201', title:'Néphrectomie partielle T1b', difficulty:'Débutant', type:'Cas synthétique', emoji:'🫘', desc:'Carcinome 4,8 cm, exophytique, score RENAL 6.',
      geometry:{ tumorVolMl:57.9, organVolMl:150, criticalVesselDistanceMm:10, criticalVesselName:'Artère rénale' } },
    { id:'SIM-202', title:'Tumeur hilaire complexe T2a', difficulty:'Expert', type:'Cas anonymisé réel', emoji:'🫘', desc:'Rapport à l\'artère polaire supérieure, ischémie prévisible > 25 min.',
      geometry:{ tumorVolMl:113.1, organVolMl:150, criticalVesselDistanceMm:2, criticalVesselName:'Artère polaire supérieure' } },
  ],
  gyno:[
    { id:'SIM-301', title:'Myomectomie multi-fibromes', difficulty:'Intermédiaire', type:'Cas synthétique', emoji:'🧬', desc:'3 myomes utérins, préservation cavité endométriale.',
      geometry:{ tumorVolMl:120.0, organVolMl:150, criticalVesselDistanceMm:15, criticalVesselName:'Artère utérine' } },
    { id:'SIM-302', title:'Hystérectomie laparoscopique T2', difficulty:'Avancé', type:'Cas généré IA', emoji:'🧬', desc:'Carcinome endomètre, curage bilatéral, préservation uretères.',
      geometry:{ tumorVolMl:30.0, organVolMl:90, criticalVesselDistanceMm:5, criticalVesselName:'Uretère' } },
  ],
  pediatrie:[
    { id:'SIM-401', title:'Tumeur de Wilms stade II', difficulty:'Expert', type:'Cas anonymisé réel', emoji:'👶', desc:'Néphroblastome 8 cm post-chimio, rapports vasculaires complexes.',
      geometry:{ tumorVolMl:268.1, organVolMl:120, criticalVesselDistanceMm:3, criticalVesselName:'Veine cave inférieure' } },
    { id:'SIM-402', title:'Hépatoblastome pédiatrique', difficulty:'Avancé', type:'Cas synthétique', emoji:'👶', desc:'Hépatoblastome stade III, résection S4-S8 chez enfant 6 ans.',
      geometry:{ tumorVolMl:180.0, organVolMl:500, criticalVesselDistanceMm:4, criticalVesselName:'Veine cave rétro-hépatique' } },
  ],
};

// ════════════════════════════════════════════════════════════════════
//  MODE MANAGER
// ════════════════════════════════════════════════════════════════════
function selectPlatformMode(mode) {
  PLATFORM_MODE.current = mode;
  const hub = document.getElementById('hub');
  if (hub) {
    hub.classList.add('fade-out');
    setTimeout(() => { hub.classList.add('hidden'); showModeHub(mode); }, 400);
  }
}

function showModeHub(mode) {
  const modeHub = document.getElementById('mode-hub-overlay');
  if (!modeHub) return;
  modeHub.setAttribute('data-mode', mode);
  modeHub.classList.remove('hidden');
  void modeHub.offsetWidth;
  modeHub.classList.remove('fade-out');
  const content = document.getElementById('mode-hub-content');
  if (!content) return;
  if (mode === 'academic') renderAcademicHub(content);
  else if (mode === 'research') renderResearchHub(content);
  else if (mode === 'simulation') renderSimulationHub(content);
}

function closeModeHub() {
  const modeHub = document.getElementById('mode-hub-overlay');
  if (!modeHub) return;
  modeHub.classList.add('fade-out');
  setTimeout(() => {
    modeHub.classList.add('hidden');
    PLATFORM_MODE.current = null;
    const hub = document.getElementById('hub');
    if (hub) { hub.classList.remove('hidden'); void hub.offsetWidth; hub.classList.remove('fade-out'); }
  }, 400);
}

// ════════════════════════════════════════════════════════════════════
//  ACADEMIC — Hub render
// ════════════════════════════════════════════════════════════════════
// Traduit un libellé de difficulte / organe qui vient d'ACADEMIC_CASES ou
// CASE_LIBRARY (enum ferme en francais dans les donnees source) vers la
// langue active, via modes.difficulty.* / modes.organs.* — repli sur le
// libelle brut si jamais une valeur hors enum apparaissait.
const DIFFICULTY_KEY_BY_FR = { 'Facile':'beginner', 'Débutant':'beginner', 'Intermédiaire':'intermediate', 'Avancé':'advanced', 'Expert':'expert' };
const ORGAN_KEY_BY_FR = { 'Foie':'liver', 'Pancréas':'pancreas', 'Rein':'kidney', 'Gynécologie':'gynecology', 'Pédiatrie':'pediatrics' };
const CASE_TYPE_KEY_BY_FR = { 'Cas synthétique':'synthetic', 'Cas généré IA':'ai', 'Cas anonymisé réel':'real' };
function tDifficulty(fr) { const k = DIFFICULTY_KEY_BY_FR[fr]; return k && typeof I18N !== 'undefined' ? I18N.t('modes.difficulty.' + k) : fr; }
function tOrgan(fr) { const k = ORGAN_KEY_BY_FR[fr]; return k && typeof I18N !== 'undefined' ? I18N.t('modes.organs.' + k) : fr; }
function tCaseType(fr) { const k = CASE_TYPE_KEY_BY_FR[fr]; return k && typeof I18N !== 'undefined' ? I18N.t('modes.caseType.' + k) : fr; }

function renderAcademicHub(container) {
  container.innerHTML = `
    <div class="mode-hub-header academic">
      <div class="mode-hub-badge academic-badge">🧑‍🎓 ${I18N.t('modes.academic.badge')}</div>
      <h2>${I18N.t('modes.academic.heading')}</h2>
      <p>${I18N.t('modes.academic.subtitle')}</p>
    </div>
    <div class="mode-hub-section">
      <div class="mode-section-title">${I18N.t('modes.academic.libraryTitle')}</div>
      <div class="academic-cases-grid">
        ${ACADEMIC_CASES.map((c, i) => `
          <div class="academic-case-card" onclick="launchAcademicCase('${c.id}')" style="animation-delay:${i*0.07}s">
            <div class="case-card-glow"></div>
            <div class="case-card-header">
              <span class="case-emoji">${c.emoji}</span>
              <div><div class="case-id">${c.id}</div><div class="case-organ">${tOrgan(c.organ)}</div></div>
              <span class="case-difficulty-badge" style="background:${c.difficultyColor}20;color:${c.difficultyColor};border-color:${c.difficultyColor}40">${tDifficulty(c.difficulty)}</span>
            </div>
            <div class="case-title">${c.title}</div>
            <div class="case-desc">${c.description.substring(0,100)}…</div>
            <div class="case-footer">
              <span class="case-meta">⏱ ${c.timeLimit} min</span>
              <span class="case-meta">📋 ${I18N.t('modes.academic.objectivesCount', { count: c.objectives.length })}</span>
              <span class="case-cta">${I18N.t('modes.academic.startCase')}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="mode-hub-section">
      <div class="mode-section-title">${I18N.t('modes.academic.leaderboardTitle')}</div>
      <div class="leaderboard-card" id="leaderboard-container"><div class="leaderboard-empty">${I18N.t('modes.academic.noSessions')}</div></div>
    </div>`;
  loadAcademicLeaderboard();
}

function launchAcademicCase(caseId) {
  const cas = ACADEMIC_CASES.find(c => c.id === caseId);
  if (!cas) return;
  PLATFORM_MODE.activeCase = cas;
  PLATFORM_MODE.sessionStart = Date.now();
  PLATFORM_MODE.sessionMetrics = { stepCompleted:[], score:0, timeSpent:0 };
  const modeHub = document.getElementById('mode-hub-overlay');
  if (modeHub) {
    modeHub.classList.add('fade-out');
    setTimeout(() => {
      modeHub.classList.add('hidden');
      if (typeof selectModule === 'function') selectModule(caseToModule(cas.organ));
      setTimeout(() => showAcademicOverlay(cas), 1200);
    }, 400);
  }
}

function caseToModule(organ) {
  const map = { 'Foie':'hbp', 'Pancréas':'hbp', 'Rein':'urologie', 'Gynécologie':'hbp', 'Pédiatrie':'hbp' };
  return map[organ] || 'hbp';
}

function showAcademicOverlay(cas) {
  const overlay = document.getElementById('academic-mode-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  const t = document.getElementById('academic-case-title');
  if (t) t.textContent = `${cas.emoji} ${cas.id} — ${cas.title}`;
  renderAcademicStepper(cas);
  startAcademicTimer(cas.timeLimit);
  showModeIndicator('academic');
}

function renderAcademicStepper(cas) {
  const c = document.getElementById('academic-stepper');
  if (!c) return;
  c.innerHTML = cas.objectives.map((obj, i) => `
    <div class="academic-step" id="astep-${i}" onclick="toggleAcademicStep(${i},'${cas.id}')">
      <div class="astep-num">${i+1}</div><div class="astep-label">${obj}</div><div class="astep-check">○</div>
    </div>`).join('');
}

function toggleAcademicStep(idx, caseId) {
  const step = document.getElementById(`astep-${idx}`);
  if (!step) return;
  const m = PLATFORM_MODE.sessionMetrics;
  if (step.classList.contains('done')) {
    step.classList.remove('done'); m.stepCompleted = m.stepCompleted.filter(s => s !== idx); step.querySelector('.astep-check').textContent = '○';
  } else {
    step.classList.add('done'); if (!m.stepCompleted.includes(idx)) m.stepCompleted.push(idx); step.querySelector('.astep-check').textContent = '✓';
  }
  const cas = ACADEMIC_CASES.find(c => c.id === caseId);
  if (cas) {
    const pct = Math.round((m.stepCompleted.length / cas.objectives.length) * 100);
    const bar = document.getElementById('academic-progress-bar');
    const pctEl = document.getElementById('academic-progress-pct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }
}

function startAcademicTimer(limitMin) {
  if (PLATFORM_MODE._academicTimer) clearInterval(PLATFORM_MODE._academicTimer);
  const end = Date.now() + limitMin * 60000;
  const timerEl = document.getElementById('academic-timer');
  if (!timerEl) return;
  PLATFORM_MODE._academicTimer = setInterval(() => {
    const rem = Math.max(0, end - Date.now());
    timerEl.textContent = `${String(Math.floor(rem/60000)).padStart(2,'0')}:${String(Math.floor((rem%60000)/1000)).padStart(2,'0')}`;
    if (rem <= 60000) timerEl.style.color = '#ef4444';
    if (rem === 0) { clearInterval(PLATFORM_MODE._academicTimer); submitAcademicSession(PLATFORM_MODE.activeCase.id); }
  }, 1000);
}

function submitAcademicSession(caseId) {
  if (PLATFORM_MODE._academicTimer) clearInterval(PLATFORM_MODE._academicTimer);
  const cas = ACADEMIC_CASES.find(c => c.id === caseId);
  if (!cas) return;
  
  const modal = document.getElementById('modal-academic-score');
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  body.innerHTML = `
    <div style="padding:10px 20px;">
      <h3 style="color:#4fc3f7; margin-bottom:12px;">${I18N.t('modes.academic.justifTitle')}</h3>
      <p style="font-size:12px; color:var(--text2); margin-bottom:16px;">${I18N.t('modes.academic.justifDesc')}</p>
      <textarea id="academic-justification-text" style="width:100%; height:120px; background:var(--bg1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:12px; font-family:inherit; margin-bottom:16px; resize:vertical;" placeholder="${I18N.t('modes.academic.justifPlaceholder')}"></textarea>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button style="background:none; border:1px solid #eab308; color:#eab308; padding:8px 12px; border-radius:6px; cursor:pointer;" onclick="alert(I18N.t('modes.academic.voiceRecordingStarted'))">${I18N.t('modes.common.voiceDictation')}</button>
        <button onclick="finalizeAcademicScore('${caseId}')" style="padding:8px 20px; background:#4fc3f7; color:#000; font-weight:bold; border:none; border-radius:6px; cursor:pointer;">${I18N.t('modes.academic.submitEvaluate')}</button>
      </div>
    </div>
  `;
  if (typeof openModal === 'function') openModal('modal-academic-score');
}

function finalizeAcademicScore(caseId) {
  const justif = document.getElementById('academic-justification-text')?.value || "";
  if(justif.length < 10) { alert(I18N.t('modes.academic.justifTooShort')); return; }
  
  const cas = ACADEMIC_CASES.find(c => c.id === caseId);
  const m = PLATFORM_MODE.sessionMetrics;
  m.justification = justif;
  m.timeSpent = Math.round((Date.now() - PLATFORM_MODE.sessionStart) / 1000);
  
  // Connect to V2 6D Score Engine if loaded
  if (window.AcademicMode) {
    window.AcademicMode.activeSession = { caseId: caseId, startTime: PLATFORM_MODE.sessionStart };
    m.structuresIdentified = m.stepCompleted.length;
    m.measurementsTaken = m.stepCompleted.length; // simulate
    m.trajectoryDefined = m.stepCompleted.length > 0;
    m.safetyMargin = 12; 
    
    const result = window.AcademicMode.calculate6DScore(m);
    m.score = result.global;
    saveAcademicSession(caseId, m);
    window.AcademicMode.showScoreModal(result, m.timeSpent * 1000);
  } else {
    alert(I18N.t('modes.academic.engineNotLoaded'));
  }
}

function saveAcademicSession(caseId, m) {
  try {
    const key = 'surgsim_academic_sessions';
    const all = JSON.parse(localStorage.getItem(key)||'[]');
    all.push({ caseId, date:new Date().toISOString(), score:m.score, timeSpent:m.timeSpent, stepsCompleted:m.stepCompleted.length });
    localStorage.setItem(key, JSON.stringify(all));
  } catch(e) {}
}

function loadAcademicLeaderboard() {
  const el = document.getElementById('leaderboard-container');
  if (!el) return;
  try {
    const all = JSON.parse(localStorage.getItem('surgsim_academic_sessions')||'[]');
    if (all.length === 0) return;
    const sorted = [...all].sort((a,b)=>b.score-a.score).slice(0,8);
    el.innerHTML = `<table class="leaderboard-table"><thead><tr><th>${I18N.t('modes.academic.tableRank')}</th><th>${I18N.t('modes.academic.tableCase')}</th><th>${I18N.t('modes.academic.tableScore')}</th><th>${I18N.t('modes.academic.tableTime')}</th><th>${I18N.t('modes.academic.tableDate')}</th></tr></thead><tbody>${sorted.map((s,i)=>`<tr><td>${['🥇','🥈','🥉'][i]||i+1}</td><td>${s.caseId}</td><td style="color:${s.score>=75?'#22c55e':'#f59e0b'};font-weight:700">${s.score}/100</td><td>${Math.floor(s.timeSpent/60)}m ${s.timeSpent%60}s</td><td style="color:var(--text3)">${new Date(s.date).toLocaleDateString(I18N.currentIntl())}</td></tr>`).join('')}</tbody></table>`;
  } catch(e) {}
}

function exportAcademicReport(caseId) {
  const data = JSON.parse(localStorage.getItem('surgsim_academic_sessions')||'[]').filter(x=>x.caseId===caseId);
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `academic_report_${caseId}_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
}

// ════════════════════════════════════════════════════════════════════
//  RESEARCH — Hub render
// ════════════════════════════════════════════════════════════════════
function renderResearchHub(container) {
  container.innerHTML = `
    <div class="mode-hub-header research">
      <div class="mode-hub-badge research-badge">🧪 ${I18N.t('modes.research.badge')}</div>
      <h2>${I18N.t('modes.research.heading')}</h2>
      <p>${I18N.t('modes.research.subtitle')}</p>
    </div>
    <div class="mode-hub-section">
      <div class="mode-section-title">${I18N.t('modes.research.studiesTitle')}</div>
      <div class="research-studies-grid">
        ${Object.values(RESEARCH_STUDIES).map((s,i)=>`
          <div class="research-study-card" style="--study-color:${s.color};animation-delay:${i*0.1}s" onclick="launchResearchStudy('${s.id}')">
            <div class="study-card-header"><div class="study-emoji">${s.emoji}</div><div class="study-label">${I18N.t('modes.research.studyLabel', { id: s.id })}</div></div>
            <div class="study-title">${s.title}</div>
            <div class="study-hypothesis">${s.hypothesis.substring(0,130)}…</div>
            <div class="study-metrics-preview">${s.metrics.slice(0,3).map(m=>`<span class="study-metric-chip">${m}</span>`).join('')}${s.metrics.length>3?`<span class="study-metric-chip more">+${s.metrics.length-3}</span>`:''}</div>
            <div class="study-groups">${s.groups.map(g=>`<div class="study-group-item">◦ ${g}</div>`).join('')}</div>
            <div class="study-cta">${I18N.t('modes.research.launchStudy')}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="mode-hub-section">
      <div class="mode-section-title">${I18N.t('modes.research.sessionsTitle')}</div>
      <div id="research-sessions-list"></div>
    </div>`;
  renderResearchSessions();
}

function launchResearchStudy(studyId) {
  const study = RESEARCH_STUDIES[studyId];
  if (!study) return;
  PLATFORM_MODE.activeStudy = study;
  PLATFORM_MODE.sessionStart = Date.now();
  PLATFORM_MODE.sessionMetrics = { studyId, group:Math.random()<0.5?'A':'B', metrics:{}, events:[], voiceCommands:0, planModifications:0, errors:0, userConfidence:null };
  const modeHub = document.getElementById('mode-hub-overlay');
  if (modeHub) {
    modeHub.classList.add('fade-out');
    setTimeout(() => {
      modeHub.classList.add('hidden');
      if (typeof selectModule === 'function') selectModule('hbp');
      setTimeout(() => showResearchOverlay(study), 1200);
    }, 400);
  }
}

function showResearchOverlay(study) {
  const overlay = document.getElementById('research-mode-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  const m = PLATFORM_MODE.sessionMetrics;
  const titleEl = document.getElementById('research-study-title');
  const groupBadge = document.getElementById('research-group-badge');
  const groupDesc = document.getElementById('research-group-desc');
  if (titleEl) titleEl.textContent = `${I18N.t('modes.research.studyLabel', { id: study.id })} — ${study.title}`;
  if (groupBadge) groupBadge.textContent = I18N.t('modes.research.groupLabel', { group: m.group });
  if (groupDesc) groupDesc.textContent = study.groups[m.group==='A'?0:1];
  startResearchTimer();
  showModeIndicator('research');
  hookResearchMetrics();
}

function startResearchTimer() {
  if (PLATFORM_MODE._researchTimer) clearInterval(PLATFORM_MODE._researchTimer);
  const timerEl = document.getElementById('research-timer');
  const start = PLATFORM_MODE.sessionStart;
  PLATFORM_MODE._researchTimer = setInterval(() => {
    if (!timerEl) return;
    const e = Math.floor((Date.now()-start)/1000);
    timerEl.textContent = `${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}`;
  }, 1000);
}

function hookResearchMetrics() {
  const appEl = document.getElementById('app');
  if (!appEl || PLATFORM_MODE._researchClickHandler) return;
  PLATFORM_MODE._researchClickHandler = () => {
    if (PLATFORM_MODE.current !== 'research') return;
    const m = PLATFORM_MODE.sessionMetrics;
    m.metrics.clicks = (m.metrics.clicks||0) + 1;
    const el = document.getElementById('research-metric-clicks');
    if (el) el.textContent = m.metrics.clicks;
  };
  appEl.addEventListener('click', PLATFORM_MODE._researchClickHandler, { passive:true });
}

function recordResearchEvent(type, data={}) {
  if (!PLATFORM_MODE.sessionMetrics || PLATFORM_MODE.current !== 'research') return;
  PLATFORM_MODE.sessionMetrics.events.push({ type, ts:Date.now()-PLATFORM_MODE.sessionStart, ...data });
  if (type==='voice_command') {
    PLATFORM_MODE.sessionMetrics.voiceCommands++;
    const el = document.getElementById('research-metric-voice'); if (el) el.textContent = PLATFORM_MODE.sessionMetrics.voiceCommands;
  }
  if (type==='plan_modification') {
    PLATFORM_MODE.sessionMetrics.planModifications++;
    const el = document.getElementById('research-metric-plans'); if (el) el.textContent = PLATFORM_MODE.sessionMetrics.planModifications;
  }
}

function submitResearchSession() {
  if (PLATFORM_MODE._researchTimer) clearInterval(PLATFORM_MODE._researchTimer);
  const m = PLATFORM_MODE.sessionMetrics;
  const study = PLATFORM_MODE.activeStudy;
  m.timeSpent = Math.floor((Date.now()-PLATFORM_MODE.sessionStart)/1000);
  const conf = prompt(I18N.t('modes.research.confidencePrompt'));
  m.userConfidence = parseInt(conf)||5;
  saveResearchSession(m);
  showResearchSummaryModal(m, study);
}

function showResearchSummaryModal(m, study) {
  const modal = document.getElementById('modal-research-summary');
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  if (!body) return;
  const e = m.timeSpent;
  body.innerHTML = `
    <div class="research-summary">
      <div class="research-summary-header">
        <div class="research-emoji">${study.emoji}</div>
        <div><div class="research-summary-title">${I18N.t('modes.research.sessionCompleteTitle', { id: study.id })}</div>
          <div class="research-summary-sub">${I18N.t('modes.research.groupLabel', { group: m.group })} · ${new Date().toLocaleDateString(I18N.currentIntl())}</div></div>
      </div>
      <div class="research-metrics-grid">
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricTime')}</div><div class="rmb-value">${Math.floor(e/60)}m ${e%60}s</div></div>
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricClicks')}</div><div class="rmb-value">${m.metrics.clicks||0}</div></div>
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricVoice')}</div><div class="rmb-value">${m.voiceCommands}</div></div>
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricPlanMods')}</div><div class="rmb-value">${m.planModifications}</div></div>
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricErrors')}</div><div class="rmb-value">${m.errors}</div></div>
        <div class="research-metric-box"><div class="rmb-label">${I18N.t('modes.research.metricConfidence')}</div><div class="rmb-value">${m.userConfidence}/10</div></div>
      </div>
      <div class="research-hypothesis-display"><strong>${I18N.t('modes.research.hypothesisLabel')}</strong> ${study.hypothesis}</div>
      <div class="research-actions">
        <button class="btn-research-export" onclick="exportResearchDataset('${study.id}')">${I18N.t('modes.research.exportDataset')}</button>
        <button class="btn-research-close" onclick="if(typeof closeModal==='function')closeModal('modal-research-summary');closeModeApp()">${I18N.t('modes.common.back')}</button>
      </div>
    </div>`;
  if (typeof openModal === 'function') openModal('modal-research-summary');
}

function saveResearchSession(m) {
  try {
    const key = `surgsim_research_${m.studyId}`;
    const all = JSON.parse(localStorage.getItem(key)||'[]');
    all.push({ ...m, date:new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(all));
  } catch(e) {}
}

function renderResearchSessions() {
  const el = document.getElementById('research-sessions-list');
  if (!el) return;
  let html = '<div class="research-sessions-grid">', total = 0;
  Object.keys(RESEARCH_STUDIES).forEach(sid => {
    const sessions = JSON.parse(localStorage.getItem(`surgsim_research_${sid}`)||'[]');
    total += sessions.length;
    if (sessions.length>0) html += `<div class="research-session-summary"><strong>${I18N.t('modes.research.studyLabel', { id: sid })}</strong> — ${I18N.t('modes.research.sessionCount', { count: sessions.length })}<button onclick="exportResearchDataset('${sid}')" class="btn-tiny-export">${I18N.t('modes.common.export')}</button></div>`;
  });
  if (total===0) html += `<div class="research-empty">${I18N.t('modes.research.noSessions')}</div>`;
  el.innerHTML = html + '</div>';
}

function exportResearchDataset(studyId) {
  const data = JSON.parse(localStorage.getItem(`surgsim_research_${studyId}`)||'[]');
  const jsonBlob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a1 = document.createElement('a'); a1.href = URL.createObjectURL(jsonBlob);
  a1.download = `research_study_${studyId}_${Date.now()}.json`; a1.click();
  if (!data.length) return;
  const headers = ['studyId','group','date','timeSpent','clicks','voiceCommands','planModifications','errors','userConfidence'];
  const rows = data.map(d => headers.map(h=>h==='clicks'?d.metrics?.clicks||0:d[h]??'').join(','));
  const csvBlob = new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv'});
  const a2 = document.createElement('a'); a2.href = URL.createObjectURL(csvBlob);
  a2.download = `research_study_${studyId}_${Date.now()}.csv`;
  setTimeout(()=>a2.click(), 500);
}

// ════════════════════════════════════════════════════════════════════
//  SIMULATION — Hub render
// ════════════════════════════════════════════════════════════════════
function renderSimulationHub(container) {
  // Libelles (emoji + couleur) constants ; le nom d'organe traduit vient de
  // modes.organs.* — les commandes vocales d'exemple restent volontairement
  // en francais (voir commentaire plus bas : la reconnaissance vocale reelle
  // ne matche que du francais, quelle que soit la langue de l'interface).
  const cats = [
    {key:'foie',emoji:'🫀',organKey:'liver',color:'#4fc3f7'},
    {key:'pancreas',emoji:'🫁',organKey:'pancreas',color:'#a855f7'},
    {key:'rein',emoji:'🫘',organKey:'kidney',color:'#22c55e'},
    {key:'gyno',emoji:'🧬',organKey:'gynecology',color:'#f472b6'},
    {key:'pediatrie',emoji:'👶',organKey:'pediatrics',color:'#f59e0b'},
  ];
  container.innerHTML = `
    <div class="mode-hub-header simulation">
      <div class="mode-hub-badge simulation-badge">🥽 ${I18N.t('modes.simulation.badge')}</div>
      <h2>${I18N.t('modes.simulation.heading')}</h2>
      <p>${I18N.t('modes.simulation.subtitle')}<br>
        <strong>${I18N.t('modes.simulation.disclaimer')}</strong></p>
    </div>
    <div class="mode-hub-cols">
      <div class="mode-hub-section" style="flex:2">
        <div class="mode-section-title">${I18N.t('modes.simulation.libraryTitle')}</div>
        <div class="sim-library">
          ${cats.map((cat,ci)=>`
            <div class="sim-category" style="--cat-color:${cat.color}">
              <div class="sim-cat-header">${cat.emoji} ${I18N.t('modes.organs.' + cat.organKey)}</div>
              <div class="sim-cat-cases">
                ${(CASE_LIBRARY[cat.key]||[]).map((c,i)=>`
                  <div class="sim-case-card" onclick="launchSimCase('${c.id}')" style="animation-delay:${(ci*0.1+i*0.05)}s">
                    <div class="sim-case-header"><span class="sim-case-id">${c.id}</span><span class="sim-case-type ${c.type.includes('anonymisé')?'type-real':c.type.includes('IA')?'type-ai':'type-synth'}">${tCaseType(c.type)}</span></div>
                    <div class="sim-case-title">${c.title}</div><div class="sim-case-desc">${c.desc}</div>
                    <div class="sim-case-footer"><span class="sim-difficulty">${tDifficulty(c.difficulty)}</span><span class="sim-cta">${I18N.t('modes.simulation.launchCase')}</span></div>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:16px">
        <div class="mode-hub-section">
          <div class="mode-section-title">${I18N.t('modes.simulation.aiLevelTitle')}</div>
          <div class="ai-level-selector">
            ${[{n:1,k:'observer'},{n:2,k:'assistant'},{n:3,k:'adversary'}].map(l=>`
              <div class="ai-level-card ${PLATFORM_MODE.aiLevel===l.n?'active':''}" onclick="setAILevel(${l.n})">
                <div class="ai-level-num">${l.n}</div><div class="ai-level-title">${I18N.t('modes.aiLevel.' + l.k + '.title')}</div><div class="ai-level-desc">${I18N.t('modes.aiLevel.' + l.k + '.desc')}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="mode-hub-section">
          <div class="mode-section-title">${I18N.t('modes.simulation.voiceCommandsTitle')}</div>
          <div class="sim-voice-commands">
            <!-- Phrases d'exemple volontairement non traduites : handleSimVoiceCommand()
                 ci-dessous ne reconnait que des tournures francaises (lower.includes('nouveau
                 scénario'), etc.) quelle que soit la langue de l'interface — afficher une
                 traduction anglaise/neerlandaise/arabe donnerait une fausse attente a
                 l'utilisateur puisque seule la formulation francaise declenche la commande.
                 Limitation connue et documentee, pas un oubli. -->
            ${[['Crée un nouveau scénario','Nouveau scénario'],['Structures vasculaires uniquement','Filtre les organes'],['Tumeur en transparence','Vue alpha'],['Résection à 10 mm','Calcule la marge'],['Compare avec le précédent','Diff scénarios']].map(([cmd,desc])=>`
              <div class="sim-voice-cmd"><span class="sim-voice-quote">« ${cmd} »</span><span class="sim-voice-desc">${desc}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function launchSimCase(caseId) {
  let simCase = null;
  Object.values(CASE_LIBRARY).forEach(arr => { const f = arr.find(c=>c.id===caseId); if(f) simCase=f; });
  if (!simCase) return;
  PLATFORM_MODE.activeCase = simCase;
  PLATFORM_MODE.sessionStart = Date.now();
  PLATFORM_MODE.scenarios = [{ id:0, name:'Scénario A', actions:[], created:Date.now(), marginMm:10, metrics:null }];
  PLATFORM_MODE.currentScenario = 0;
  refreshSimScenarioMetrics(0);
  PLATFORM_MODE.sessionMetrics = { caseId, timeSpent:0, voiceCommands:0, scenariosCreated:1, totalActions:0 };
  const modeHub = document.getElementById('mode-hub-overlay');
  if (modeHub) {
    modeHub.classList.add('fade-out');
    setTimeout(() => {
      modeHub.classList.add('hidden');
      if (typeof selectModule === 'function') selectModule('hbp');
      setTimeout(() => showSimulationOverlay(simCase), 1200);
    }, 400);
  }
}

function showSimulationOverlay(simCase) {
  const overlay = document.getElementById('simulation-mode-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  const t = document.getElementById('sim-case-title');
  const tp = document.getElementById('sim-case-type-badge');
  if (t) t.textContent = `${simCase.emoji} ${simCase.id} — ${simCase.title}`;
  if (tp) tp.textContent = simCase.type;
  renderSimScenarioBar();
  startSimTimer();
  showModeIndicator('simulation');
  triggerAILevelMessage();
  
  const timelinePanel = document.getElementById('simulation-timeline-panel');
  if (timelinePanel) timelinePanel.style.display = 'block';

  recordSimAction('start', { label: I18N.t('modes.simulation.caseLoadedLabel') });
}

function startSimTimer() {
  if (PLATFORM_MODE._simTimer) clearInterval(PLATFORM_MODE._simTimer);
  const timerEl = document.getElementById('sim-timer');
  const start = PLATFORM_MODE.sessionStart;
  PLATFORM_MODE._simTimer = setInterval(() => {
    if (!timerEl || PLATFORM_MODE.current !== 'simulation') { clearInterval(PLATFORM_MODE._simTimer); return; }
    const e = Math.floor((Date.now()-start)/1000);
    timerEl.textContent = `${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}`;
  }, 1000);
}

function renderSimScenarioBar() {
  const bar = document.getElementById('sim-scenario-bar');
  if (!bar) return;
  bar.innerHTML = PLATFORM_MODE.scenarios.map((sc,i) => `<div class="sim-scenario-chip ${i===PLATFORM_MODE.currentScenario?'active':''}" onclick="switchSimScenario(${i})">${sc.name}</div>`).join('') + `<button class="sim-add-scenario" onclick="createSimScenario()">${I18N.t('modes.simulation.addScenario')}</button>`;
  renderSimTimeline();
}

function createSimScenario(name) {
  const currentSc = PLATFORM_MODE.scenarios[PLATFORM_MODE.currentScenario];
  const forkedActions = currentSc ? JSON.parse(JSON.stringify(currentSc.actions)) : [];
  const n = name || I18N.t('modes.simulation.scenarioDefaultName', { letter: String.fromCharCode(65+PLATFORM_MODE.scenarios.length) });

  const marginInput = prompt(I18N.t('modes.simulation.marginPrompt'), String(currentSc?.marginMm ?? 10));
  const marginMm = marginInput != null && !isNaN(parseFloat(marginInput)) ? parseFloat(marginInput) : (currentSc?.marginMm ?? 10);
  const parentName = currentSc ? currentSc.name : I18N.t('modes.simulation.scenarioOrigin');

  PLATFORM_MODE.scenarios.push({
    id: PLATFORM_MODE.scenarios.length,
    name: n,
    actions: forkedActions,
    created: Date.now(),
    parent: currentSc ? currentSc.name : null,
    marginMm,
    metrics: null
  });

  const newIdx = PLATFORM_MODE.scenarios.length - 1;
  PLATFORM_MODE.currentScenario = newIdx;
  PLATFORM_MODE.sessionMetrics.scenariosCreated++;

  recordSimAction('fork', { label: I18N.t('modes.simulation.forkLabel', { parent: parentName, margin: marginMm }) });
  renderSimScenarioBar();
  refreshSimScenarioMetrics(newIdx);
  simNotify(I18N.t('modes.simulation.scenarioCreatedNotify', { name: n, parent: parentName, margin: marginMm }));
}

function switchSimScenario(idx) {
  PLATFORM_MODE.currentScenario = idx;
  renderSimScenarioBar();
  simNotify(I18N.t('modes.simulation.scenarioSwitchNotify', { name: PLATFORM_MODE.scenarios[idx].name }));
}

// Calcule et met en cache les métriques d'un scénario (volume réséqué/
// restant, distance au vaisseau critique) à partir de la géométrie RÉELLE
// du cas chargé (CASE_LIBRARY[...].geometry) et de la marge de CE scénario —
// source unique : window.AnatomicalGeometry.computeCaseScenarioMetrics
// (voir assets/v2/app-core-3d.js). Ne génère jamais de nombre aléatoire.
async function refreshSimScenarioMetrics(idx) {
  const sc = PLATFORM_MODE.scenarios[idx];
  const geometry = PLATFORM_MODE.activeCase?.geometry;
  if (!sc || !geometry || !window.AnatomicalGeometry) {
    if (sc) sc.metrics = null;
    return null;
  }
  sc.metrics = await window.AnatomicalGeometry.computeCaseScenarioMetrics(geometry, sc.marginMm);
  if (idx === PLATFORM_MODE.currentScenario) renderSimTimeline();
  return sc.metrics;
}

function recordSimAction(type, data={}) {
  if (PLATFORM_MODE.current !== 'simulation') return;
  const sc = PLATFORM_MODE.scenarios[PLATFORM_MODE.currentScenario];
  if (!sc) return;
  sc.actions.push({ type, ts: Date.now() - PLATFORM_MODE.sessionStart, ...data });
  PLATFORM_MODE.sessionMetrics.totalActions++;
  renderSimTimeline();
  checkAILevelResponse(type, data);
}

function renderSimTimeline() {
  const sc = PLATFORM_MODE.scenarios[PLATFORM_MODE.currentScenario];
  const titleEl = document.getElementById('sim-timeline-title');
  const eventsEl = document.getElementById('sim-timeline-events');
  if (titleEl && sc) titleEl.textContent = sc.name;
  if (!eventsEl || !sc) return;
  
  eventsEl.innerHTML = sc.actions.map(act => {
    const sec = Math.floor(act.ts / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const timeStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const label = act.label || act.type;
    return `
      <div style="display:flex;align-items:center;gap:6px;font-size:9px;color:var(--text2);padding:4px 6px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:2px solid #ff6b35;">
        <span style="font-family:var(--mono);color:var(--text3);font-size:8px;">${timeStr}</span>
        <span style="flex:1;">${label}</span>
      </div>
    `;
  }).join('') || `<div style="font-size:9px;color:var(--text3);text-align:center;padding:8px;">${I18N.t('modes.simulation.noActionsRecorded')}</div>`;
}

function compareSimScenariosDialog() {
  if (PLATFORM_MODE.scenarios.length < 2) {
    alert(I18N.t('modes.simulation.needTwoScenariosAlert'));
    return;
  }
  compareSimScenarios(0, 1);
}

async function compareSimScenarios(idxA, idxB) {
  const a = PLATFORM_MODE.scenarios[idxA], b = PLATFORM_MODE.scenarios[idxB];
  if (!a || !b) { simNotify(I18N.t('modes.simulation.needTwoScenariosNotify')); return; }

  // Recalcule si pas encore en cache (ex: cas chargé sans geometry, ou marge modifiée depuis).
  if (!a.metrics) await refreshSimScenarioMetrics(idxA);
  if (!b.metrics) await refreshSimScenarioMetrics(idxB);

  const modal = document.getElementById('modal-sim-comparison');
  if (!modal) return;
  const body = modal.querySelector('.modal-body'); if (!body) return;

  const renderCol = (sc, color) => {
    const m = sc.metrics;
    if (!m) {
      return `
        <div class="sim-comp-col">
          <div class="sim-comp-header" style="color:${color}">${sc.name} (${sc.marginMm}mm)</div>
          <div class="sim-comp-row"><span>${I18N.t('modes.simulation.actionsLabel')}</span><strong>${sc.actions.length}</strong></div>
          <div class="sim-comp-row"><span>${I18N.t('modes.simulation.geometryUnavailable')}</span></div>
        </div>`;
    }
    const distColor = m.vesselDistanceMm != null && m.vesselDistanceMm < 6 ? '#ef4444' : '#22c55e';
    return `
      <div class="sim-comp-col">
        <div class="sim-comp-header" style="color:${color}">${sc.name} (${sc.marginMm}mm)</div>
        <div class="sim-comp-row"><span>${I18N.t('modes.simulation.actionsLabel')}</span><strong>${sc.actions.length}</strong></div>
        <div class="sim-comp-row"><span>${I18N.t('modes.simulation.volResectedLabel')}</span><strong>${m.volResected} cm³</strong></div>
        <div class="sim-comp-row"><span>${I18N.t('modes.simulation.volRemnantLabel')}</span><strong>${m.volRemnant} cm³${m.pctRemnant != null ? ` (${m.pctRemnant}%)` : ''}</strong></div>
        <div class="sim-comp-row"><span>${I18N.t('modes.simulation.distanceToVessel', { vessel: PLATFORM_MODE.activeCase?.geometry?.criticalVesselName || I18N.t('modes.simulation.criticalVesselFallback') })}</span><strong style="color:${distColor}">${m.vesselDistanceMm != null ? m.vesselDistanceMm + ' mm' : I18N.t('modes.common.notAvailable')}</strong></div>
        ${m.marginExceedsVessel ? `<div class="sim-comp-row"><span style="color:#ef4444">${I18N.t('modes.simulation.marginDeficit', { n: m.vesselMarginDeficitMm })}</span></div>` : ''}
      </div>`;
  };

  const verdict = (a.metrics && b.metrics)
    ? (a.metrics.volResected < b.metrics.volResected
        ? `<span style="color:#22c55e">✅ ${I18N.t('modes.simulation.preservesTissue', { name: a.name })}</span>`
        : `<span style="color:#22c55e">✅ ${I18N.t('modes.simulation.preservesTissue', { name: b.name })}</span>`)
    : '';

  body.innerHTML = `
    <div class="sim-comparison">
      <h3>${I18N.t('modes.simulation.comparisonTitle')}</h3>
      <div class="sim-comp-grid">
        ${renderCol(a, '#4fc3f7')}
        ${renderCol(b, '#ff6b35')}
      </div>
      <div class="sim-comp-verdict">${verdict}</div>
      <div class="sim-disclaimer">${I18N.t('modes.simulation.comparisonDisclaimer')}</div>
    </div>`;
  if (typeof openModal === 'function') openModal('modal-sim-comparison');
}

async function generateSimReport() {
  if (PLATFORM_MODE._simTimer) clearInterval(PLATFORM_MODE._simTimer);
  const m = PLATFORM_MODE.sessionMetrics;
  const elapsed = Math.floor((Date.now()-PLATFORM_MODE.sessionStart)/1000);
  m.timeSpent = elapsed;

  // Métriques du scénario courant + comptage réel des violations de marge
  // vasculaire sur TOUS les scénarios de la session (au lieu d'erreurs
  // tirées au hasard) : une "erreur" ici = une marge demandée qui dépasse
  // la place réellement disponible avant la structure critique du cas.
  const current = PLATFORM_MODE.scenarios[PLATFORM_MODE.currentScenario];
  if (current && !current.metrics) await refreshSimScenarioMetrics(PLATFORM_MODE.currentScenario);
  const cm = current?.metrics || null;
  const violations = PLATFORM_MODE.scenarios.filter(sc => sc.metrics?.marginExceedsVessel).length;

  const vol = cm ? cm.volResected : null;
  const rem = cm ? cm.volRemnant : null;
  const dist = cm && cm.vesselDistanceMm != null ? cm.vesselDistanceMm : null;
  const errors = violations;
  const score = cm ? Math.max(60, 100 - errors*8 - (dist != null && dist < 6 ? 10 : 0)) : null;

  const modal = document.getElementById('modal-sim-report');
  if (!modal) return;
  const body = modal.querySelector('.modal-body'); if (!body) return;
  const mins=Math.floor(elapsed/60), secs=elapsed%60;
  const NA = I18N.t('modes.common.notAvailable');
  body.innerHTML = `
    <div class="sim-report">
      <div class="sim-report-header">
        <div class="sim-report-title">${I18N.t('modes.simulation.reportTitle')}</div>
        <div class="sim-report-sub">${PLATFORM_MODE.activeCase?.title||I18N.t('modes.simulation.caseFallback')} · ${new Date().toLocaleDateString(I18N.currentIntl())}</div>
      </div>
      <div class="sim-report-grid">
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportTime')}</div><div class="srg-value">${mins}m ${secs}s</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportVolResected')}</div><div class="srg-value">${vol != null ? vol + ' cm³' : NA}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportVolRemnant')}</div><div class="srg-value">${rem != null ? rem + ' cm³' : NA}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportDistance')}</div><div class="srg-value" style="color:${dist != null && dist<6?'#ef4444':'#22c55e'}">${dist != null ? dist + ' mm' : NA}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportUnsafeMargins')}</div><div class="srg-value">${violations}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportErrors')}</div><div class="srg-value">${errors}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportVoiceCmds')}</div><div class="srg-value">${m.voiceCommands}</div></div>
        <div class="srg-box"><div class="srg-label">${I18N.t('modes.simulation.reportScenarios')}</div><div class="srg-value">${m.scenariosCreated}</div></div>
      </div>
      <div class="sim-report-score">
        <div class="srg-score-label">${I18N.t('modes.simulation.scoreFinal')}</div>
        <div class="srg-score-value" style="color:${score>=80?'#22c55e':score>=65?'#f59e0b':'#ef4444'}">${score != null ? score : NA}${score != null ? '<span>/100</span>' : ''}</div>
      </div>
      <div class="sim-disclaimer">${I18N.t('modes.simulation.reportDisclaimer')}</div>
      <div class="sim-report-actions">
        <button onclick="exportSimReport(${vol},${rem},${dist},${errors},${score},${elapsed})" class="btn-sim-export">${I18N.t('modes.simulation.exportJson')}</button>
        <button onclick="if(typeof closeModal==='function')closeModal('modal-sim-report');closeModeApp()" class="btn-sim-close">${I18N.t('modes.common.back')}</button>
      </div>
    </div>`;
  if (typeof openModal === 'function') openModal('modal-sim-report');
}

function exportSimReport(vol, rem, dist, errors, score, time) {
  const data = { case:PLATFORM_MODE.activeCase?.id, date:new Date().toISOString(), timeSpent:time, volumeResected_cm3:vol, volumeRemaining_cm3:rem, minDistanceCritical_mm:parseFloat(dist), errorsCount:errors, score, scenariosCreated:PLATFORM_MODE.sessionMetrics?.scenariosCreated, voiceCommands:PLATFORM_MODE.sessionMetrics?.voiceCommands, aiLevel:PLATFORM_MODE.aiLevel, disclaimer:'SIMULATED - NOT FOR CLINICAL USE' };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `sim_report_${PLATFORM_MODE.activeCase?.id||'case'}_${Date.now()}.json`; a.click();
}

// Reconnaissance + retour vocal volontairement non traduits (voir le commentaire
// dans renderSimulationHub) : le matching ci-dessous ne comprend que des
// tournures francaises (lower.includes('vasculaires'), 'transparence', etc.),
// donc le message de confirmation reste francais lui aussi, quelle que soit
// la langue de l'interface — traduire un seul des deux cotes serait trompeur.
function handleSimVoiceCommand(cmd) {
  if (PLATFORM_MODE.current !== 'simulation') return false;
  const lower = cmd.toLowerCase();
  PLATFORM_MODE.sessionMetrics.voiceCommands++;
  const vc = document.getElementById('sim-voice-count'); if (vc) vc.textContent = PLATFORM_MODE.sessionMetrics.voiceCommands;
  if (lower.includes('nouveau scénario')||lower.includes('crée un scénario')||lower.includes('new scenario')) { createSimScenario(); return true; }
  if (lower.includes('vasculaires')||lower.includes('vasculaire')) { simNotify('🩸 Affichage structures vasculaires uniquement. [SIMULÉ]'); recordSimAction('voice_filter',{filter:'vascular'}); return true; }
  if (lower.includes('transparence')||lower.includes('transparent')) { simNotify('🔍 Tumeur en transparence. [SIMULÉ]'); recordSimAction('voice_transparency',{target:'tumor'}); return true; }
  if (lower.includes('résection') && (lower.includes('mm')||lower.includes('marge'))) {
    const match = lower.match(/(\d+)\s*mm/);
    const margin = match?match[1]:'10';
    const vol = parseInt(margin)*18+Math.round(Math.random()*30);
    simNotify(`✂️ Résection simulée à ${margin} mm. Volume : ${vol} cm³. Restant : ${1100-vol} cm³. [SIMULÉ]`);
    recordSimAction('voice_resection',{margin,vol}); return true;
  }
  if (lower.includes('compare')||lower.includes('comparaison')||lower.includes('précédent')) {
    if (PLATFORM_MODE.scenarios.length>=2) compareSimScenarios(PLATFORM_MODE.currentScenario-1, PLATFORM_MODE.currentScenario);
    else simNotify('⚠ Créez au moins 2 scénarios pour les comparer.');
    return true;
  }
  return false;
}

function triggerAILevelMessage() {
  const msgs = {1:I18N.t('modes.simulation.aiMsgObserver'),2:I18N.t('modes.simulation.aiMsgAssistant'),3:I18N.t('modes.simulation.aiMsgAdversary')};
  simNotify(msgs[PLATFORM_MODE.aiLevel]||'');
}

function checkAILevelResponse(type, data) {
  if (PLATFORM_MODE.aiLevel===1) return;
  const dist = (4+Math.random()*10).toFixed(1);
  let msg = null;
  if (PLATFORM_MODE.aiLevel===2 && (type==='resection'||type==='voice_resection'))
    msg = parseFloat(dist)<6?I18N.t('modes.simulation.aiCheckAssistantWarn',{dist}):I18N.t('modes.simulation.aiCheckAssistantOk',{dist});
  if (PLATFORM_MODE.aiLevel===3 && (type==='resection'||type==='voice_resection'))
    msg = I18N.t('modes.simulation.aiCheckAdversary', { dist: (parseFloat(dist)+2).toFixed(1) });
  if (msg) setTimeout(() => simNotify(msg), 1500);
}

function setAILevel(level) {
  PLATFORM_MODE.aiLevel = level;
  document.querySelectorAll('.ai-level-card').forEach((el,i) => el.classList.toggle('active', i+1===level));
  const aiEl = document.getElementById('sim-ai-level-display');
  const levelKey = ['observer','assistant','adversary'][level-1];
  if (aiEl) aiEl.textContent = I18N.t('modes.simulation.aiLevelStatus', { level, name: I18N.t('modes.aiLevel.' + levelKey + '.title') });
  if (PLATFORM_MODE.current==='simulation') triggerAILevelMessage();
  if (typeof notify==='function') notify(I18N.t('modes.simulation.aiLevelActivatedNotify', { level }), 'ok');
}

// ════════════════════════════════════════════════════════════════════
//  UTILITAIRES COMMUNS
// ════════════════════════════════════════════════════════════════════
function showModeIndicator(mode) {
  const el = document.getElementById('mode-platform-indicator');
  if (!el) return;
  // Reutilise les libelles de mode deja traduits dans le namespace hub.* (ecran
  // d'accueil) plutot que de dupliquer une nouvelle cle — meme mot, un seul endroit a tenir a jour.
  const labels={academic:'🧑‍🎓 '+I18N.t('hub.academic.title'),research:'🧪 '+I18N.t('hub.research.title'),simulation:'🥽 '+I18N.t('hub.simulation.title')};
  const colors={academic:'#4fc3f7',research:'#a855f7',simulation:'#ff6b35'};
  el.textContent = labels[mode]||''; el.style.display='flex';
  el.style.background=(colors[mode]||'#fff')+'20'; el.style.color=colors[mode]||'#fff'; el.style.borderColor=(colors[mode]||'#fff')+'60';
}

function simNotify(msg) {
  const log = document.getElementById('sim-activity-log');
  if (log) {
    const entry = document.createElement('div'); entry.className='sim-log-entry';
    entry.innerHTML = `<span class="sim-log-time">${new Date().toLocaleTimeString()}</span> ${msg}`;
    log.insertBefore(entry, log.firstChild);
    while (log.children.length>20) log.removeChild(log.lastChild);
  }
  if (typeof notify==='function') notify(msg.replace(/\[SIMULÉ\]/g,'').replace(/\[sim\.\]/gi,'').trim().substring(0,90), 'info');
}

function closeModeApp() {
  ['academic-mode-overlay','research-mode-overlay','simulation-mode-overlay'].forEach(id => {
    const el=document.getElementById(id); if(el) el.classList.remove('active');
  });
  if (PLATFORM_MODE._academicTimer) { clearInterval(PLATFORM_MODE._academicTimer); PLATFORM_MODE._academicTimer=null; }
  if (PLATFORM_MODE._researchTimer) { clearInterval(PLATFORM_MODE._researchTimer); PLATFORM_MODE._researchTimer=null; }
  if (PLATFORM_MODE._simTimer) { clearInterval(PLATFORM_MODE._simTimer); PLATFORM_MODE._simTimer=null; }
  if (PLATFORM_MODE._researchClickHandler) {
    const appEl=document.getElementById('app');
    if (appEl) appEl.removeEventListener('click', PLATFORM_MODE._researchClickHandler);
    PLATFORM_MODE._researchClickHandler=null;
  }
  const modeInd=document.getElementById('mode-platform-indicator'); if (modeInd) modeInd.style.display='none';
  const prevMode = PLATFORM_MODE.current;
  PLATFORM_MODE.activeCase=null; PLATFORM_MODE.activeStudy=null;
  if (prevMode && typeof openHub==='function') { openHub(); setTimeout(()=>{ if(prevMode) selectPlatformMode(prevMode); }, 600); }
  else if (typeof openHub==='function') openHub();
}

// ════════════════════════════════════════════════════════════════════
//  PATCH MOTEUR VOCAL
// ════════════════════════════════════════════════════════════════════
(function patchVoiceEngine() {
  const tryPatch = () => {
    if (typeof window.processVoiceCommand === 'function') {
      const orig = window.processVoiceCommand;
      window.processVoiceCommand = function(cmd, ...args) {
        if (PLATFORM_MODE.current==='simulation') { if (handleSimVoiceCommand(cmd)) return; }
        if (PLATFORM_MODE.current==='research') recordResearchEvent('voice_command',{cmd});
        return orig.call(this, cmd, ...args);
      };
      console.info('[SurgSim Modes] Voice engine patched.');
    } else { setTimeout(tryPatch, 1000); }
  };
  setTimeout(tryPatch, 2000);
})();

function openClinicalAccessModal() {
  const modal = document.getElementById('modal-clinical-restricted');
  if (modal) {
    modal.classList.add('open');
    return;
  }
  if (typeof openModal === 'function') openModal('clinical-restricted');
}

// Expose globalement
Object.assign(window, {
  selectPlatformMode, closeModeHub, launchAcademicCase, toggleAcademicStep,
  submitAcademicSession, exportAcademicReport, launchResearchStudy,
  submitResearchSession, exportResearchDataset, launchSimCase, createSimScenario,
  switchSimScenario, compareSimScenarios, generateSimReport, exportSimReport,
  setAILevel, closeModeApp, renderAcademicHub, renderResearchHub, renderSimulationHub,
  recordSimAction, recordResearchEvent, openClinicalAccessModal
});

console.info('[SurgSim 3D] Modes Engine v1.0 — 🧑‍🎓 Academic | 🧪 Research | 🥽 Simulation');
