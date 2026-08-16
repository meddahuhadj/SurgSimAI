// ════════════════════════════════════════════════════════════════════════
//  SurgSim 3D V2 — RESEARCH MODE (app-research.js)
//  Protocol Manager, Event Logger, Analytics, Synthetic Generator
// ════════════════════════════════════════════════════════════════════════

const ResearchMode = {
  activeProtocol: null,
  sessionLog: [],
  sessionStartTime: 0,
  
  // ── Protocol Manager (Strict Server-Side Lock) ─────────────────────
  async startProtocol(protocolId, participantId, isOfficialStudy = true) {
    let assignedGroup = null;
    let seeds = [8347291];
    let serverLocked = false;
    
    // Server-side randomization call for scientific rigor
    try {
      const res = await fetch('/api/v2/synthetic/randomize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId, study_id: protocolId })
      });
      if (res.ok) {
        const data = await res.json();
        assignedGroup = data.assigned_group;
        seeds = data.case_seeds;
        serverLocked = true;
        console.info(`[Research Lock] Participant ${participantId} locked into group: ${assignedGroup}`);
      }
    } catch (err) {
      if (isOfficialStudy) {
        console.error('[Research Lock Failure] Official study requires backend FastAPI server lock!', err);
        alert(I18N.t('modes.research.lockRequiredAlert', { protocolId }));
        return false;
      }
      console.warn('[Research Demo] Fallback to deterministic client seed assignment:', err);
      const groups = ['A_Classic_Mouse', 'B_VoiceFirst', 'C_VoiceAndAI'];
      const seedNum = (participantId || 'P000').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      assignedGroup = groups[seedNum % groups.length];
    }
    
    this.activeProtocol = {
      id: protocolId,
      participant: participantId,
      group: assignedGroup,
      seeds: seeds,
      serverLocked: serverLocked,
      status: 'RUNNING',
      metrics: { clicks: 0, voiceCommands: 0, aiRequests: 0, errors: 0 }
    };
    
    console.info(`[Research] Protocol ${protocolId} started. Group locked: ${assignedGroup}`);
    this.startSession();
  },

  // ── High-Freq Event Logger ───────────────────────────────────────
  startSession() {
    this.sessionStartTime = performance.now();
    this.sessionLog = [];
    this.logEvent('SESSION_START', { protocol: this.activeProtocol.id, group: this.activeProtocol.group });
  },

  logEvent(eventName, eventData = {}) {
    if (!this.activeProtocol) return;
    
    const timestamp = Math.round(performance.now() - this.sessionStartTime);
    const logEntry = {
      ts: timestamp,
      event: eventName,
      data: eventData
    };
    
    this.sessionLog.push(logEntry);
    
    // Update metrics
    if (eventName === 'VOICE_COMMAND') this.activeProtocol.metrics.voiceCommands++;
    if (eventName === 'AI_REQUEST') this.activeProtocol.metrics.aiRequests++;
    if (eventName.includes('ERROR')) this.activeProtocol.metrics.errors++;
  },

  endSession() {
    if (!this.activeProtocol) return;
    this.logEvent('SESSION_END', {});
    
    const durationMs = Math.round(performance.now() - this.sessionStartTime);
    console.info(`[Research] Session ended. Duration: ${durationMs}ms`, this.activeProtocol.metrics);
    
    this.generateAnalyticsReport();
    this.activeProtocol = null;
  },

  // ── Research Analytics ───────────────────────────────────────────
  generateAnalyticsReport() {
    const modal = document.getElementById('modal-research-summary');
    if (!modal) return;
    
    const metrics = this.activeProtocol.metrics;
    const body = modal.querySelector('.modal-body');
    body.innerHTML = `
      <div style="background:var(--bg1); border-radius:8px; padding:16px; margin-bottom: 20px;">
        <h4 style="color:#a855f7; margin-bottom:12px;">${I18N.t('modes.research.analyticsSessionSummaryTitle')}</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span>${I18N.t('modes.research.assignedGroupLabel')}</span> <strong>${this.activeProtocol.group}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span>${I18N.t('modes.research.loggedEventsLabel')}</span> <strong>${this.sessionLog.length}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span>${I18N.t('modes.research.voiceCommandsLabelV2')}</span> <strong style="color:#eab308">${metrics.voiceCommands}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span>${I18N.t('modes.research.uiErrorsLabel')}</span> <strong style="color:#ef4444">${metrics.errors}</strong>
        </div>
      </div>

      <div style="display:flex; gap:12px; justify-content:center;">
        <button onclick="closeModal('modal-research-summary'); openHub();" style="padding:8px 16px; border-radius:6px; background:rgba(255,255,255,0.1); color:#fff; border:none; cursor:pointer;">${I18N.t('modes.research.endStudyBtn')}</button>
        <button onclick="window.ResearchMode.exportDataset()" style="padding:8px 16px; border-radius:6px; background:#a855f7; color:#fff; font-weight:700; border:none; cursor:pointer;">${I18N.t('modes.research.exportDatasetJsonBtn')}</button>
      </div>
    `;
    modal.classList.add('open');
  },

  exportDataset() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.sessionLog, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `research_session_${Date.now()}.json`);
    dlAnchorElem.click();
    console.info('[Research] Dataset exported.');
  },

  // ── Session Replayer Engine ──────────────────────────────────────
  replayer: {
    isPlaying: false,
    currentIndex: 0,
    timer: null,
    log: [],
    
    loadSession(sessionLog) {
      this.log = sessionLog || [];
      this.currentIndex = 0;
      console.info(`[Replayer] Loaded session with ${this.log.length} events.`);
    },
    
    play(onStepCallback) {
      if (!this.log.length) return;
      this.isPlaying = true;
      console.info('[Replayer] ▶ 3D State Playback started.');
      
      this.timer = setInterval(() => {
        if (this.currentIndex >= this.log.length) {
          this.pause();
          console.info('[Replayer] 🏁 3D Playback completed.');
          return;
        }
        const ev = this.log[this.currentIndex];
        
        // Restore 3D State according to event type
        if (ev.event === 'SCENARIO_SWITCHED' && window.SimulationMode) {
          window.SimulationMode.switchScenario(ev.data?.id);
        } else if (ev.event === 'CAMERA_ROTATE' && window.viewport3D) {
          window.viewport3D.setCameraAngle?.(ev.data?.angle || 0);
        } else if (ev.event === 'STRUCTURE_HIDE' && window.AnatomicalCore?.currentCase) {
          const struct = window.AnatomicalCore.currentCase.getStructure(ev.data?.id);
          if (struct) struct.setVisibility(false);
        }
        
        if (onStepCallback) onStepCallback(ev, this.currentIndex, this.log.length);
        this.currentIndex++;
      }, 500);
    },
    
    pause() {
      this.isPlaying = false;
      if (this.timer) clearInterval(this.timer);
      console.info('[Replayer] ⏸ Playback paused.');
    },
    
    reset() {
      this.pause();
      this.currentIndex = 0;
    },

    timeJump(timestamp) {
      const targetIndex = window.ResearchMode.sessionLog.findIndex(e => e.timestamp >= timestamp);
      if (targetIndex !== -1) {
        this.currentIndex = targetIndex;
        console.info(`[3D Scientific Replay] Jumped to event #${targetIndex} (Timestamp: ${timestamp})`);
        const event = window.ResearchMode.sessionLog[targetIndex];
        if (event.data?.scenarioId && window.SimulationMode) {
          window.SimulationMode.switchScenario(event.data.scenarioId);
        }
      }
    }
  },

  generateExperimentFingerprint(caseObj, seed, protocolId = 'R-001') {
    const caseId = caseObj?.id || 'CAS-UNSET';
    const raw = `${caseId}_${seed}_V3.0_TotalSegV2_XPBDV3_SimV3_GeminiV1.5_${protocolId}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const fingerprint = `EXP-FP-${Math.abs(hash).toString(16).toUpperCase()}`;
    console.info(`[Experiment Fingerprint] Generated: ${fingerprint}`);
    return fingerprint;
  },

  // ── Synthetic Case Generator (Seeded) ────────────────────────────
  generateSyntheticCase(params = {}) {
    const seed = params.seed || Math.floor(Math.random() * 8999999) + 1000000;
    console.info(`[Research] Generating synthetic case... Seed: ${seed}, Organ: ${params.organ || 'Foie'}`);
    
    // Pseudo-random deterministic generator using seed
    const pseudoRandom = (offset) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
    
    const organVol = 1100 + Math.round(pseudoRandom(1) * 300);
    const tumorVol = params.tumorVol || Math.round((20 + pseudoRandom(2) * 40) * 10) / 10;
    
    const syntheticCase = new window.AnatomicalCase({
      id: `SYNTH-${seed}`,
      title: `Cas Synthétique Reproductible (Seed #${seed})`,
      organ: params.organ || 'Foie',
      patientMeta: { diag: 'Génération Procédurale', isSynthetic: true, seed: seed, fingerprint: this.generateExperimentFingerprint(null, seed) },
      structures: [
        { id: 'synth_organ', name: 'Foie Synthétique', category: 'organ', volume: organVol, centroid: {x:0, y:0, z:0}, source: 'Synthetic_Gen' },
        { id: 'synth_tumor', name: 'Tumeur Cible', category: 'tumor', volume: tumorVol, centroid: {x: Math.round(pseudoRandom(3)*40 - 20), y: Math.round(pseudoRandom(4)*40 - 20), z: Math.round(pseudoRandom(5)*40 - 20)}, source: 'Synthetic_Gen' },
        { id: 'synth_vessel', name: 'Structure à Risque', category: 'vessel_portal', volume: 60, centroid: {x: Math.round(pseudoRandom(6)*30 - 15), y: Math.round(pseudoRandom(7)*30 - 15), z: Math.round(pseudoRandom(8)*30 - 15)}, source: 'Synthetic_Gen' }
      ]
    });
    
    if (window.AnatomicalCore) {
      window.AnatomicalCore.loadCase(syntheticCase);
    }
    
    return syntheticCase;
  }
};

window.ResearchMode = ResearchMode;

// Bind a global click listener for research metrics (Mouse clicks)
document.addEventListener('click', (e) => {
  if (window.ResearchMode && window.ResearchMode.activeProtocol) {
    const target = e.target.closest('button, .mode-card, .sim-scenario-chip, .academic-step, .vp-btn');
    if (target) {
      window.ResearchMode.logEvent('UI_CLICK', {
        targetClass: target.className,
        targetId: target.id,
        text: target.innerText?.substring(0,30)
      });
      window.ResearchMode.activeProtocol.metrics.clicks++;
    }
  }
});

console.info('[SurgSim 3D V2] Research Mode loaded.');
