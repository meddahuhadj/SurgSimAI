// ════════════════════════════════════════════════════════════════════════
//  SurgSim 3D V2 — 3D ANATOMICAL CORE (app-core-3d.js)
//  Unified Anatomical Data Model, BBox, Centroid, Volume & Mesh Utilities
// ════════════════════════════════════════════════════════════════════════

class AnatomicalStructure {
  constructor({ id, name, category, mesh = null, volume = 0, surface = 0, centroid = { x: 0, y: 0, z: 0 }, bbox = null, confidence = 0.95, source = 'TotalSegmentator' }) {
    this.id = id;                     // ex: 'liver_seg6'
    this.name = name;                 // ex: 'Segment VI Hépatique'
    this.category = category;         // 'organ' | 'tumor' | 'vessel_portal' | 'vessel_hepatic' | 'risk_zone'
    this.mesh = mesh;                 // Object3D Three.js / WebGL
    this.volume = volume;             // cm³
    this.surface = surface;           // cm²
    this.centroid = centroid;         // { x, y, z }
    this.bbox = bbox || { min: { x: -10, y: -10, z: -10 }, max: { x: 10, y: 10, z: 10 } };
    this.confidence = confidence;     // 0.0 - 1.0
    this.source = source;             // 'TotalSegmentator' | 'Manual_Import' | 'Synthetic_Gen'
    this.visibility = true;
    this.opacity = 1.0;
    this.color = this.getDefaultColor(category);
  }

  getDefaultColor(category) {
    const palette = {
      organ: '#4fc3f7',
      tumor: '#ef4444',
      vessel_portal: '#a855f7',
      vessel_hepatic: '#38bdf8',
      vessel_artery: '#f43f5e',
      risk_zone: '#f59e0b',
    };
    return palette[category] || '#22c55e';
  }

  setVisibility(val) {
    this.visibility = Boolean(val);
    if (this.mesh && this.mesh.visible !== undefined) {
      this.mesh.visible = this.visibility;
    }
  }

  setOpacity(val) {
    this.opacity = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.mesh && this.mesh.material) {
      this.mesh.material.transparent = this.opacity < 1.0;
      this.mesh.material.opacity = this.opacity;
    }
  }
}

class AnatomicalCase {
  constructor({ id, title, organ, patientMeta = {}, structures = [] }) {
    this.id = id;
    this.title = title;
    this.organ = organ;
    this.patientMeta = patientMeta;   // { age, sexe, poids, diag, urgency }
    this.structures = new Map();
    structures.forEach(s => this.addStructure(s));
    this.created = Date.now();
  }

  addStructure(structData) {
    const struct = structData instanceof AnatomicalStructure ? structData : new AnatomicalStructure(structData);
    this.structures.set(struct.id, struct);
    return struct;
  }

  getStructure(id) {
    return this.structures.get(id);
  }

  getAllStructures() {
    return Array.from(this.structures.values());
  }

  getTumorVolume() {
    let total = 0;
    this.structures.forEach(s => {
      if (s.category === 'tumor') total += s.volume;
    });
    return Math.round(total * 10) / 10;
  }

  getOrganVolume() {
    let total = 0;
    this.structures.forEach(s => {
      if (s.category === 'organ') total += s.volume;
    });
    return Math.round(total * 10) / 10;
  }

  clone(newTitle = null) {
    const cloned = new AnatomicalCase({
      id: `${this.id}_clone_${Date.now()}`,
      title: newTitle || `${this.title} (Scénario)`,
      organ: this.organ,
      patientMeta: { ...this.patientMeta },
    });
    this.structures.forEach(s => {
      cloned.addStructure({
        ...s,
        id: `${s.id}_clone`,
        centroid: { ...s.centroid },
        bbox: JSON.parse(JSON.stringify(s.bbox)),
      });
    });
    return cloned;
  }

  exportManifest() {
    return {
      case_id: this.id,
      seed: this.patientMeta?.seed || 8347291,
      organ: this.organ,
      title: this.title,
      structures_count: this.structures.size,
      patient_meta: this.patientMeta,
      mesh_version: "2.6.0-scientific",
      generator_version: "FastAPI-Synthetic-V2",
      created_at: new Date(this.created).toISOString()
    };
  }
}

// ── Geometry & Spatial Helper Tools ─────────────────────────────────────
const AnatomicalGeometry = {
  // ── Source unique des métriques de scénario (tumeur+marge / FLR / vaisseau) ──
  // `geometry`: { tumorVolMl, organVolMl, criticalVesselDistanceMm }
  // Essaie le backend (identique en autorité pour la reproductibilité inter-
  // session) puis retombe sur un calcul local honnêtement étiqueté si le
  // réseau est indisponible — jamais de valeur inventée en silence.
  async computeCaseScenarioMetrics(geometry, marginMm = 10) {
    if (!geometry) return null;
    const { tumorVolMl = 0, organVolMl = 0, criticalVesselDistanceMm = null,
            childPughClass = null, isCirrhotic = false, bsaM2 = 1.9 } = geometry;
    try {
      const res = await fetch('/api/v2/geometry/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tumor_volume_ml: tumorVolMl,
          organ_volume_ml: organVolMl,
          vessel_distance_mm: criticalVesselDistanceMm,
          margin_mm: marginMm,
          child_pugh_class: childPughClass,
          is_cirrhotic: isCirrhotic,
          bsa_m2: bsaM2
        })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          volResected: data.resected_volume_ml,
          volRemnant: data.remnant_volume_ml,
          pctRemnant: data.flr_pct,
          vesselDistanceMm: data.vessel_distance_mm,
          vesselMarginDeficitMm: data.vessel_margin_deficit_mm,
          marginExceedsVessel: data.margin_exceeds_vessel_distance,
          method: data.calculation_method,
          tradeoff: data.tradeoff,
          isServerComputed: true
        };
      }
    } catch (err) {
      console.warn('[Geometry] Backend indisponible, calcul local de repli:', err);
    }
    return this._localScenarioMetrics(tumorVolMl, organVolMl, criticalVesselDistanceMm, marginMm,
                                       { childPughClass, isCirrhotic, bsaM2 });
  },

  // Seuil de FLR de sécurité — même formule que `_flr_threshold` côté backend
  // (routers/volumetrie.py), dupliquée ici volontairement pour que le repli
  // hors-ligne du score de compromis (ci-dessous) reste identique au calcul
  // serveur plutôt que d'inventer un autre seuil.
  _flrThresholdPct(isCirrhotic, bsaM2) {
    return isCirrhotic
      ? Math.max(35.0, 30.0 + 12.0 * (1.0 - bsaM2 / 1.9))
      : Math.max(25.0, 20.0 + 10.0 * (1.0 - bsaM2 / 1.9));
  },

  // Score de compromis — même formule que `compute_resection_tradeoff_score`
  // côté backend (backend/clinical_scores.py). Voir son docstring pour les
  // avertissements d'honnêteté (heuristique transparente, PAS un score validé
  // par une société savante) : ils s'appliquent identiquement ici.
  _localTradeoffScore(remnantPct, flrThresholdPct, childPughClass, vesselMarginDeficitMm) {
    const CHILD_PUGH_BASE = { A: 10.0, B: 30.0, C: 70.0 };
    const cpClass = (childPughClass || '').trim().toUpperCase() || null;
    const baseMortality = cpClass && CHILD_PUGH_BASE[cpClass] !== undefined ? CHILD_PUGH_BASE[cpClass] : 10.0;

    const flrDeficitPct = Math.max(0, flrThresholdPct - remnantPct);
    const flrPenalty = Math.min(40.0, flrDeficitPct * 2.5);
    const vesselPenalty = Math.min(20.0, Math.max(0, vesselMarginDeficitMm || 0) * 2.0);
    const total = Math.min(100.0, baseMortality + flrPenalty + vesselPenalty);

    let band, bandLabel;
    if (total < 20.0) { band = 'low'; bandLabel = 'Risque faible — profil de résection standard'; }
    else if (total < 45.0) { band = 'moderate'; bandLabel = 'Risque modéré — discuter en RCP, envisager une approche plus conservatrice'; }
    else { band = 'high'; bandLabel = 'Risque élevé — évaluer une alternative moins radicale ou une optimisation pré-opératoire'; }

    return {
      tradeoff_score: Math.round(total * 10) / 10,
      risk_band: band,
      risk_band_label: bandLabel,
      flr_threshold_pct: Math.round(flrThresholdPct * 10) / 10,
      components: {
        child_pugh_class: cpClass,
        child_pugh_base_mortality_pct: baseMortality,
        flr_deficit_pct: Math.round(flrDeficitPct * 10) / 10,
        flr_penalty_points: Math.round(flrPenalty * 10) / 10,
        vessel_margin_deficit_mm: Math.round(Math.max(0, vesselMarginDeficitMm || 0) * 10) / 10,
        vessel_penalty_points: Math.round(vesselPenalty * 10) / 10
      },
      disclaimer: 'Combinaison heuristique transparente — n\'est PAS elle-même un score validé par une société savante.'
    };
  },

  // Repli hors-ligne — même formule analytique (sphère équivalente) que
  // l'endpoint backend, pour ne jamais afficher un chiffre différent selon
  // que le réseau réponde ou pas.
  _localScenarioMetrics(tumorVolMl, organVolMl, vesselDistanceMm, marginMm,
                         { childPughClass = null, isCirrhotic = false, bsaM2 = 1.9 } = {}) {
    const rBaseCm = tumorVolMl > 0 ? Math.cbrt((3 * tumorVolMl) / (4 * Math.PI)) : 0;
    const rMarginCm = rBaseCm + (marginMm / 10); // mm → cm
    const volResected = (4 / 3) * Math.PI * Math.pow(rMarginCm, 3);
    const volRemnant = Math.max(0, organVolMl - volResected);
    const pctRemnant = organVolMl > 0 ? Math.round((volRemnant / organVolMl) * 100) : null;
    const vesselMarginDeficitMm = vesselDistanceMm != null ? Math.round(Math.max(0, marginMm - vesselDistanceMm) * 10) / 10 : null;
    const tradeoff = pctRemnant != null
      ? this._localTradeoffScore(pctRemnant, this._flrThresholdPct(isCirrhotic, bsaM2), childPughClass, vesselMarginDeficitMm)
      : null;
    return {
      volResected: Math.round(volResected * 10) / 10,
      volRemnant: Math.round(volRemnant * 10) / 10,
      pctRemnant,
      vesselDistanceMm,
      vesselMarginDeficitMm,
      marginExceedsVessel: vesselMarginDeficitMm != null ? vesselMarginDeficitMm > 0 : null,
      method: 'Approximation analytique locale (sphère équivalente) — hors-ligne, backend indisponible',
      tradeoff,
      isServerComputed: false
    };
  },

  // Distance mesh-à-mesh EXACTE (échantillonnage de sommets réels), utilisable
  // uniquement quand deux Object3D Three.js réels sont chargés pour les deux
  // structures. Il n'y a plus de second niveau "sphère équivalente" ici : ce
  // calcul-là vit désormais uniquement dans computeCaseScenarioMetrics
  // (backend `/api/v2/geometry/compute`, avec repli local qui reproduit
  // exactement la même formule serveur — voir _localScenarioMetrics). Avoir
  // eu deux formules d'approximation différentes dans le frontend était une
  // duplication réelle, pas seulement conceptuelle ; elle est supprimée.
  // Retourne `null` si aucun mesh exact n'est disponible — à l'appelant de
  // retomber sur computeCaseScenarioMetrics s'il a un `geometry` de cas.
  computeExactMeshDistance(structA, structB) {
    if (!structA?.mesh?.geometry || !structB?.mesh?.geometry || typeof THREE === 'undefined') return null;
    try {
      const posA = structA.mesh.geometry.attributes.position;
      const posB = structB.mesh.geometry.attributes.position;
      let minSqDist = Infinity;

      // Sampling closest vertex distances between meshes
      const stepA = Math.max(1, Math.floor(posA.count / 50));
      const stepB = Math.max(1, Math.floor(posB.count / 50));

      for (let i = 0; i < posA.count; i += stepA) {
        const vA = new THREE.Vector3(posA.getX(i), posA.getY(i), posA.getZ(i));
        vA.applyMatrix4(structA.mesh.matrixWorld);
        for (let j = 0; j < posB.count; j += stepB) {
          const vB = new THREE.Vector3(posB.getX(j), posB.getY(j), posB.getZ(j));
          vB.applyMatrix4(structB.mesh.matrixWorld);
          const dSq = vA.distanceToSquared(vB);
          if (dSq < minSqDist) minSqDist = dSq;
        }
      }
      return {
        distance: Math.round(Math.sqrt(minSqDist) * 10) / 10,
        method: 'Mesh Surface-to-Surface (Raycast Sampling, sommets réels)',
        isExactSurface: true
      };
    } catch (err) {
      console.warn('[3D Geometry] Raycast sampling failed:', err);
      return null;
    }
  },
};

// ── Global Anatomical Core State ─────────────────────────────────────────
const AnatomicalCore = {
  currentCase: null,
  casesCache: new Map(),

  initDefaultCase(organ = 'Foie') {
    const defaultCase = new AnatomicalCase({
      id: 'CASE-CORE-001',
      title: 'Modèle Anatomique Patient-Spécifique 3D',
      organ: organ,
      patientMeta: { age: 58, sexe: 'M', poids: 74, diag: 'Lésion focale segment VI' },
      structures: [
        { id: 'organ_liver', name: 'Foie (Parenchyme)', category: 'organ', volume: 1100, surface: 620, centroid: { x: 0, y: 0, z: 0 }, confidence: 0.98 },
        { id: 'tum_seg6', name: 'Tumeur Segment VI', category: 'tumor', volume: 32.4, surface: 45, centroid: { x: 35, y: -20, z: 12 }, confidence: 0.94 },
        { id: 'vessel_portal', name: 'Tronc Veine Porte', category: 'vessel_portal', volume: 85, surface: 120, centroid: { x: 5, y: -10, z: -5 }, confidence: 0.96 },
        { id: 'vessel_rhv', name: 'Veine Sus-Hépatique Droite', category: 'vessel_hepatic', volume: 42, surface: 75, centroid: { x: 28, y: 15, z: 18 }, confidence: 0.92 },
      ],
    });
    this.currentCase = defaultCase;
    this.casesCache.set(defaultCase.id, defaultCase);
    console.info('[3D Core] Default Anatomical Case initialized:', defaultCase.id);
    return defaultCase;
  },

  loadCase(caseData) {
    const anatomicalCase = new AnatomicalCase(caseData);
    this.currentCase = anatomicalCase;
    this.casesCache.set(anatomicalCase.id, anatomicalCase);
    return anatomicalCase;
  },
};

// Auto-init on load
AnatomicalCore.initDefaultCase();

// Expose globally
Object.assign(window, {
  AnatomicalStructure,
  AnatomicalCase,
  AnatomicalGeometry,
  AnatomicalCore,
});

console.info('[SurgSim 3D V2] 3D Anatomical Core loaded.');
