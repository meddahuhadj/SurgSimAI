// ════════════════════════════════════════════════════════════════════════
//  SurgSim 3D V2 — ACADEMIC MODE (app-academic.js)
//  Student Dashboard, 6D Radar Score, Exam Mode, Teacher Dashboard
// ════════════════════════════════════════════════════════════════════════

const AcademicMode = {
  activeSession: null,
  
  // ── Student Progress Data ──────────────────────────────────────
  studentData: {
    progression: 74,
    skills: {
      anatomy: 85,
      interpretation3D: 70,
      planning: 60,
      simulation: 50,
    },
    casesCompleted: 17,
    averageScore: 84
  },

  // ── Exam Mode (Blind) ──────────────────────────────────────────
  startExam(caseId) {
    console.info(`[Academic] Starting EXAM mode for case ${caseId}`);
    this.activeSession = {
      caseId: caseId,
      mode: 'exam',
      startTime: Date.now(),
      metrics: {
        structuresIdentified: 0,
        measurementsTaken: 0,
        safetyMargin: 0,
        trajectoryDefined: false,
      }
    };
    
    // UI Updates for Exam Mode (Hide references, hints)
    document.getElementById('app').style.display = 'flex';
    document.getElementById('academic-mode-overlay')?.classList.add('active');
    
    // In Exam Mode, AI Tutor is disabled or restricted
    if (window.SimulationMode) {
      window.SimulationMode.setAiLevel(1); // Observer only
    }
    
    this.renderExamUI();
  },

  renderExamUI() {
    const titleEl = document.getElementById('academic-case-title');
    if (titleEl) {
      titleEl.innerHTML = I18N.t('modes.academic.examInProgressTitle', { caseId: this.activeSession.caseId });
      titleEl.style.color = '#ef4444'; // Red to indicate exam pressure
    }
  },

  // ── 6D Radar Scoring System ────────────────────────────────────
  calculate6DScore(sessionMetrics) {
    // 6 Dimensions: Anatomy, Planning, Precision, Safety, Efficiency, Decision
    const score = {
      anatomy: Math.min(100, 20 + sessionMetrics.structuresIdentified * 10),
      planning: sessionMetrics.trajectoryDefined ? 85 : 40,
      precision: Math.min(100, 40 + sessionMetrics.measurementsTaken * 15),
      safety: sessionMetrics.safetyMargin >= 10 ? 95 : 45,
      efficiency: Math.max(0, 100 - Math.floor((Date.now() - this.activeSession.startTime) / 60000) * 5),
      decision: 80, // Evaluated via QCM or AI Reviewer
    };

    const global = Math.round((score.anatomy + score.planning + score.precision + score.safety + score.efficiency + score.decision) / 6);
    
    return { dimensions: score, global };
  },

  submitExam() {
    if (!this.activeSession) return;
    const duration = Date.now() - this.activeSession.startTime;
    
    // Simulate collected metrics
    this.activeSession.metrics.structuresIdentified = 5;
    this.activeSession.metrics.measurementsTaken = 3;
    this.activeSession.metrics.safetyMargin = 12;
    this.activeSession.metrics.trajectoryDefined = true;

    const result = this.calculate6DScore(this.activeSession.metrics);
    console.info('[Academic] Exam submitted.', result);
    
    this.showScoreModal(result, duration);
    this.activeSession = null;
  },

  showScoreModal(result, durationMs) {
    const modal = document.getElementById('modal-academic-score');
    if (!modal) return;
    
    const min = Math.floor(durationMs / 60000);
    const sec = Math.floor((durationMs % 60000) / 1000);
    
    let grade = I18N.t('modes.academic.gradeToImprove');
    if (result.global >= 90) grade = I18N.t('modes.academic.gradeExcellent');
    else if (result.global >= 80) grade = I18N.t('modes.academic.gradeVeryGood');
    else if (result.global >= 70) grade = I18N.t('modes.academic.gradeGood');

    const objectiveScore = result.global;
    const expertScore = Math.min(100, Math.round(objectiveScore * 1.05));
    const finalScore = Math.round((objectiveScore * 0.6) + (expertScore * 0.4));

    const body = modal.querySelector('.modal-body');
    body.innerHTML = `
      <div style="text-align:center; margin-bottom: 16px;">
        <div style="font-size:44px; font-weight:800; color:#4fc3f7;">${finalScore}<span>/100</span></div>
        <div style="font-size:13px; font-weight:700; color:var(--text1);">${grade}</div>
        <div style="font-size:10px; color:var(--text3); margin-top:2px;">${I18N.t('modes.academic.completionTime', { min, sec })}</div>
      </div>

      <!-- Multi-Tier Score Breakdown -->
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom:14px;">
        <div style="background:rgba(79, 195, 247, 0.1); border:1px solid rgba(79, 195, 247, 0.3); border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:9px; color:var(--text3);">${I18N.t('modes.academic.objectiveScore3d')}</div>
          <div style="font-size:16px; font-weight:700; color:#4fc3f7;">${objectiveScore}</div>
        </div>
        <div style="background:rgba(34, 197, 94, 0.1); border:1px solid rgba(34, 197, 94, 0.3); border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:9px; color:var(--text3);">${I18N.t('modes.academic.expertJuryScore')}</div>
          <div style="font-size:16px; font-weight:700; color:#22c55e;">${expertScore}</div>
        </div>
        <div style="background:rgba(168, 85, 247, 0.1); border:1px solid rgba(168, 85, 247, 0.3); border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:9px; color:var(--text3);">${I18N.t('modes.academic.aiSocraticReview')}</div>
          <div style="font-size:11px; font-weight:700; color:#a855f7;">${I18N.t('modes.academic.aiSocraticExcellent')}</div>
        </div>
      </div>

      <div style="background:var(--bg1); border-radius:8px; padding:12px; margin-bottom: 16px;">
        <h4 style="font-size:11px; margin-bottom:10px; color:var(--text2); text-transform:uppercase;">${I18N.t('modes.academic.detail6dEngineTitle')}</h4>
        ${Object.entries(result.dimensions).map(([key, val]) => `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:10px;">
            <span style="text-transform:capitalize; width:110px;">${I18N.t('modes.academic.dimensions.' + key)}</span>
            <div style="flex:1; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin:0 10px; overflow:hidden;">
              <div style="width:${val}%; height:100%; background:${val >= 80 ? '#22c55e' : val >= 60 ? '#eab308' : '#ef4444'};"></div>
            </div>
            <span style="width:25px; text-align:right; font-weight:700;">${val}</span>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex; gap:12px; justify-content:center;">
        <button onclick="closeModal('modal-academic-score'); openHub();" style="padding:8px 16px; border-radius:6px; background:rgba(255,255,255,0.1); color:#fff; border:none; cursor:pointer;">${I18N.t('modes.academic.backToHubBtn')}</button>
        <button onclick="alert(I18N.t('modes.academic.exportingScientificReport'))" style="padding:8px 16px; border-radius:6px; background:#4fc3f7; color:#000; font-weight:700; border:none; cursor:pointer;">${I18N.t('modes.academic.exportScientificReportBtn')}</button>
      </div>
    `;
    
    modal.classList.add('open');
  },

  // ── Teacher Dashboard & Authoring ────────────────────────────────
  renderTeacherDashboard() {
    console.info('[Academic] Rendering Teacher Dashboard');
    // Implement teacher UI rendering here
  }
};

window.AcademicMode = AcademicMode;
console.info('[SurgSim 3D V2] Academic Mode loaded.');
