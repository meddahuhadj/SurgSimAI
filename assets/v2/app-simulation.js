// ════════════════════════════════════════════════════════════════════════
//  SurgSim 3D V2 — SIMULATION MODE (app-simulation.js)
//  Scenario Manager, Comparison Engine, Voice-First 2.0, 3 AI Personalities
// ════════════════════════════════════════════════════════════════════════

const SimulationMode = {
  activeScenarios: new Map(),
  currentScenarioId: null,
  aiLevel: 2, // 1: Observer, 2: Assistant, 3: Reviewer/Adversary

  // ── Scenario Graph Engine (Versioned A/B/C Nodes) ───────────────────
  scenarioGraph: new Map(), // nodeId -> ScenarioNode

  async createScenario(baseCase, name, parentId = null, marginMm = 10, geometry = null) {
    if (!baseCase) return null;
    const newScen = baseCase.clone(name);
    this.activeScenarios.set(newScen.id, newScen);

    // Géométrie du cas : passée explicitement (CASE_LIBRARY.geometry côté
    // Mode Simulation) ou dérivée des vraies structures du cas si présentes.
    // Jamais de secours en dur — si l'info manque, calculatedMetrics reste
    // null et l'UI doit l'afficher comme "non calculé", pas comme un chiffre.
    const geo = geometry || this._deriveGeometryFromCase(baseCase);

    const node = {
      id: newScen.id,
      parentId: parentId || this.currentScenarioId || 'root',
      name: name,
      timestamp: Date.now(),
      baseCaseId: baseCase.id,
      resectionMarginMm: marginMm,
      calculatedMetrics: geo ? await window.AnatomicalGeometry?.computeCaseScenarioMetrics(geo, marginMm) : null,
      aiDebrief: null
    };

    this.scenarioGraph.set(newScen.id, node);
    this.currentScenarioId = newScen.id;
    console.info(`[Scenario Graph] Node created: ${node.id} (Parent: ${node.parentId})`);

    if (window.ResearchMode) {
      window.ResearchMode.logEvent('SCENARIO_GRAPH_NODE_CREATED', node);
    }

    return newScen;
  },

  // Best-effort : reconstruit un objet géométrie {tumorVolMl, organVolMl,
  // criticalVesselDistanceMm} à partir des AnatomicalStructure du cas, pour
  // les cas qui ont de vraies structures chargées (pas le catalogue
  // CASE_LIBRARY texte-only du Mode Simulation, qui fournit `geometry`
  // explicitement à la place). La distance au vaisseau n'est renseignée que
  // si un mesh Three.js exact existe pour les deux structures — sinon elle
  // reste `null` (honnête) plutôt que d'être approximée par une seconde
  // formule sphère-équivalente redondante avec celle du backend.
  _deriveGeometryFromCase(caseObj) {
    if (!caseObj?.getAllStructures) return null;
    const structs = caseObj.getAllStructures();
    const tumor = structs.find(s => s.category === 'tumor');
    const vessel = structs.find(s => s.category?.includes('vessel'));
    if (!tumor) return null;
    const exactDist = vessel ? window.AnatomicalGeometry?.computeExactMeshDistance(tumor, vessel) : null;
    return {
      tumorVolMl: tumor.volume,
      organVolMl: caseObj.getOrganVolume?.() || 0,
      criticalVesselDistanceMm: exactDist ? exactDist.distance : null,
      // Fonction hépatique du cas, si documentée (voir compute_resection_tradeoff_score
      // côté backend) — absente par défaut, jamais devinée.
      childPughClass: caseObj.patientMeta?.childPughClass || null,
      isCirrhotic: !!caseObj.patientMeta?.isCirrhotic,
      bsaM2: caseObj.patientMeta?.bsaM2 || 1.9
    };
  },

  switchScenario(scenarioId) {
    if (this.activeScenarios.has(scenarioId) || this.scenarioGraph.has(scenarioId)) {
      this.currentScenarioId = scenarioId;
      console.info(`[Scenario Graph] Switched to node: ${scenarioId}`);
      if (window.ResearchMode) window.ResearchMode.logEvent('SCENARIO_SWITCHED', { id: scenarioId });
    }
  },

  // ── 3D Comparison Engine ────────────────────────────────────────────
  // Lit les métriques déjà calculées à la création de chaque nœud du
  // Scenario Graph (`createScenario`) — ne recalcule jamais avec des valeurs
  // par défaut inventées. Si un nœud n'a pas encore de métriques (géométrie
  // indisponible pour ce cas), la carte l'affiche explicitement au lieu
  // d'un chiffre de repli.
  compareScenarios(idA, idB) {
    const nodeA = this.scenarioGraph.get(idA);
    const nodeB = this.scenarioGraph.get(idB);
    if (!nodeA || !nodeB) {
      console.warn('[Simulation] Comparaison impossible : nœud(s) introuvable(s) dans le Scenario Graph.', { idA, idB });
      return;
    }

    console.info(`[Simulation] Comparaison Scenario Graph: ${idA} vs ${idB}`);

    const renderCard = (node, accentColor) => {
      const m = node.calculatedMetrics;
      const marginLabel = I18N.t('modes.simulation.marginParenLabel', { mm: node.resectionMarginMm });
      if (!m) {
        return `
          <div style="flex:1; background:var(--bg2); padding:16px; border-radius:8px; border:1px solid ${accentColor};">
            <h4 style="color:${accentColor}; margin-bottom:12px;">${node.name} ${marginLabel}</h4>
            <div style="font-size:11px; color:var(--text3);">${I18N.t('modes.simulation.metricsUnavailableV2')}</div>
          </div>`;
      }
      const distColor = m.vesselDistanceMm != null && m.vesselDistanceMm < 6 ? '#ef4444' : '#22c55e';
      const bandColor = { low: '#22c55e', moderate: '#f59e0b', high: '#ef4444' }[m.tradeoff?.risk_band] || '#94a3b8';
      const tradeoffBlock = m.tradeoff ? `
          <div style="font-size:11px; margin:10px 0 8px; padding:8px; border-radius:6px; background:var(--bg1); border-left:3px solid ${bandColor};">
            <div>${I18N.t('modes.simulation.tradeoffScoreLabel')} <strong style="color:${bandColor}">${m.tradeoff.tradeoff_score}/100 (${m.tradeoff.risk_band})</strong></div>
            <div style="font-size:9px; color:var(--text3); margin-top:4px;">${m.tradeoff.risk_band_label}</div>
            <div style="font-size:8px; color:var(--text3); margin-top:4px;">⚠️ ${m.tradeoff.disclaimer}</div>
          </div>` : '';
      return `
        <div style="flex:1; background:var(--bg2); padding:16px; border-radius:8px; border:1px solid ${accentColor};">
          <h4 style="color:${accentColor}; margin-bottom:12px;">${node.name} ${marginLabel}</h4>
          <div style="font-size:11px; margin-bottom:8px;">${I18N.t('modes.simulation.volResectedEstColon')} <strong>${m.volResected} cm³</strong></div>
          <div style="font-size:11px; margin-bottom:8px;">${I18N.t('modes.simulation.volRemnantEstColon')} <strong>${m.volRemnant} cm³ ${m.pctRemnant != null ? `(${m.pctRemnant}%)` : ''}</strong></div>
          <div style="font-size:11px; margin-bottom:8px;">${I18N.t('modes.simulation.criticalVesselFixedColon')} <strong style="color:${distColor}">${m.vesselDistanceMm != null ? m.vesselDistanceMm + ' mm' : I18N.t('modes.common.notAvailable')}</strong></div>
          ${m.marginExceedsVessel ? `<div style="font-size:10px; color:#ef4444; margin-bottom:6px;">${I18N.t('modes.simulation.marginExceedsColonDeficit', { n: m.vesselMarginDeficitMm })}</div>` : ''}
          ${tradeoffBlock}
          <div style="font-size:8px; color:var(--text3);">${m.method}${m.isServerComputed ? '' : ' ' + I18N.t('modes.simulation.offlineSuffix')}</div>
        </div>`;
    };

    const modal = document.getElementById('modal-sim-comparison');
    if (modal) {
      const body = modal.querySelector('.modal-body');
      body.innerHTML = `<div style="display:flex; gap:20px; text-align:center;">${renderCard(nodeA, '#4fc3f7')}${renderCard(nodeB, '#a855f7')}</div>`;
      modal.classList.add('open');
    }

    if (window.ResearchMode) window.ResearchMode.logEvent('SCENARIOS_COMPARED', { idA, idB, metricsA: nodeA.calculatedMetrics, metricsB: nodeB.calculatedMetrics });
  },

  // ── Voice-First Intent Parser (Structured Constraints) ──────────
  // Volontairement non traduit (comme dans app-modes.js) : le parsing ci-dessous
  // et le dialogue de confirmation vocale ("oui"/"non"/"confirme"/"annule") ne
  // reconnaissent que du francais, quelle que soit la langue de l'interface.
  parseVoiceIntent(transcript) {
    const text = transcript.toLowerCase();
    const intent = { action: 'UNKNOWN', params: {}, raw: transcript };
    
    if (text.includes('crée') || text.includes('scénario')) {
      intent.action = 'CREATE_SCENARIO';
      const marginMatch = text.match(/marge (\d+)/);
      if (marginMatch) intent.params.margin_mm = parseInt(marginMatch[1]);
    } else if (text.includes('mesure') || text.includes('distance')) {
      intent.action = 'MEASURE_DISTANCE';
    } else if (text.includes('compare')) {
      intent.action = 'COMPARE_SCENARIOS';
    }
    
    console.info('[Voice Intent Parser] Structured Intent:', intent);
    return intent;
  },

  pendingVoiceAction: null,

  handleVoiceCommand(transcript) {
    const text = transcript.toLowerCase();

    // Check for active vocal confirmation response ("oui" / "non")
    if (this.pendingVoiceAction) {
      if (text.includes('oui') || text.includes('confirme')) {
        console.info('[Voice Confirmation] Action confirmed by user:', this.pendingVoiceAction);
        const action = this.pendingVoiceAction;
        this.pendingVoiceAction = null;
        if (action.action === 'CREATE_SCENARIO') {
          const current = window.AnatomicalCore?.currentCase;
          if (current) this.createScenario(current, `Scénario Vocale (${action.params.margin_mm || 10}mm)`);
        }
        return true;
      } else if (text.includes('non') || text.includes('annule')) {
        console.info('[Voice Confirmation] Action cancelled by user.');
        this.pendingVoiceAction = null;
        return true;
      }
    }

    const intent = this.parseVoiceIntent(transcript);
    
    if (window.ResearchMode) {
      window.ResearchMode.logEvent('VOICE_COMMAND_PARSED', intent);
    }
    
    if (intent.action === 'CREATE_SCENARIO') {
      const margin = intent.params.margin_mm || 10;
      this.pendingVoiceAction = intent;
      const confirmText = `🎙️ CONFIRMATION VOCALE REQUISE:\nCréer le Scénario avec une marge de ${margin} mm ?\n(Dites "Oui" pour confirmer ou "Non" pour annuler)`;
      console.info(`[Voice Engine] Prompting user: ${confirmText}`);
      if (typeof openModal === 'function') {
        const modal = document.getElementById('modal-research-summary');
        if (modal) {
          const body = modal.querySelector('.modal-body');
          if (body) body.innerHTML = `<div style="padding:20px; text-align:center;"><h3>🎙️ Confirmation Vocale</h3><p style="font-size:14px; margin:16px 0;">${confirmText}</p><div style="display:flex; gap:10px; justify-center;"><button onclick="SimulationMode.handleVoiceCommand('oui'); closeModal('modal-research-summary');" style="padding:8px 16px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:700;">Oui (Confirmer)</button><button onclick="SimulationMode.handleVoiceCommand('non'); closeModal('modal-research-summary');" style="padding:8px 16px; background:#ef4444; color:#fff; border:none; border-radius:6px;">Non (Annuler)</button></div></div>`;
          openModal('modal-research-summary');
        }
      }
      return true;
    }
    
    return false;
  }
};

window.SimulationMode = SimulationMode;
console.info('[SurgSim 3D V2] Simulation Mode loaded.');
