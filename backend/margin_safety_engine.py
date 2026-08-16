# -*- coding: utf-8 -*-
"""
margin_safety_engine.py — Moteur de Calcul des Marges Chirurgicales & Risque Vasculaire 3D.
========================================================================================
Calcule les distances 3D réelles et les risques d'invasion vasculaire/parenchymateuse :
  - Distance minimale 3D (Euclidienne / KDTree) entre la lésion et les structures à risque
  - Qualification de marge R0 / R1
  - Alertes d'invasion vasculaire peropératoire.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


@dataclass
class StructureProximityResult:
    structure_name: str
    min_distance_mm: float
    margin_status: str  # R0_SAFE | CAUTION_SUBOPTIMAL | R1_CRITICAL_HAZARD
    resection_status_label: str
    clinical_action_required: str


@dataclass
class SurgicalSafetyMarginReport:
    patient_id: str
    lesion_id: str
    overall_r0_feasible: bool
    global_min_margin_mm: float
    proximities: List[StructureProximityResult]
    recommendation: str


def compute_min_distance_3d(points_lesion: np.ndarray, points_structure: np.ndarray) -> float:
    """Calcule la distance 3D minimale absolue en millimètres entre deux nuages de points (KDTree)."""
    if len(points_lesion) == 0 or len(points_structure) == 0:
        return 999.0

    from scipy.spatial import cKDTree
    tree = cKDTree(points_structure)
    distances, _ = tree.query(points_lesion, k=1)
    return float(np.min(distances))


def _classify_distance(structure_name: str, dist: float) -> StructureProximityResult:
    """Seuils cliniques partagés par toutes les sources de distance (nuage de
    points ou mesh triangulé réel) :
      - > 10 mm : R0_SAFE (Marge de sécurité satisfaisante)
      - 5 mm - 10 mm : CAUTION_SUBOPTIMAL (Marge étroite, contrôle échographique peropératoire requis)
      - < 5 mm : R1_CRITICAL_HAZARD (Risque élevé de marge positive R1 / clampage/bipasse à prévoir)
    """
    if dist >= 10.0:
        status = "R0_SAFE"
        label = f"Marge de sécurité R0 préservée ({dist:.1f} mm)"
        action = "Poursuivre la dissection selon le plan standard."
    elif dist >= 5.0:
        status = "CAUTION_SUBOPTIMAL"
        label = f"Marge étroite avec {structure_name} ({dist:.1f} mm)"
        action = "Contrôle échographique peropératoire recommandé avant transection."
    else:
        status = "R1_CRITICAL_HAZARD"
        label = f"🔴 Danger d'invasion / Marge R1 probable avec {structure_name} ({dist:.1f} mm)"
        action = "Planifier contrôle vasculaire proximal/distal et hémostase renforcée."

    return StructureProximityResult(
        structure_name=structure_name,
        min_distance_mm=round(dist, 2),
        margin_status=status,
        resection_status_label=label,
        clinical_action_required=action
    )


def _build_report(patient_id: str, lesion_id: str, proximities: List[StructureProximityResult]) -> SurgicalSafetyMarginReport:
    global_min = min((p.min_distance_mm for p in proximities), default=999.0)
    overall_safe = global_min >= 5.0
    rec = ("Résection R0 chirurgicalement réalisable sans geste vasculaire complexe." if overall_safe
           else "Attention : Risque élevé de résection R1 ou d'embrochage vasculaire peropératoire.")

    return SurgicalSafetyMarginReport(
        patient_id=patient_id,
        lesion_id=lesion_id,
        overall_r0_feasible=overall_safe,
        global_min_margin_mm=round(global_min, 2) if global_min < 999.0 else 0.0,
        proximities=proximities,
        recommendation=rec
    )


def evaluate_surgical_margins(
    patient_id: str,
    lesion_id: str,
    points_lesion: np.ndarray,
    critical_structures_points: Dict[str, np.ndarray]
) -> SurgicalSafetyMarginReport:
    """Évalue la sécurité des marges à partir de nuages de points 3D bruts
    (ex. vertices déjà extraits). Voir `evaluate_surgical_margins_from_meshes`
    pour la variante qui part de maillages .glb réels sur disque."""
    proximities = [
        _classify_distance(name, compute_min_distance_3d(points_lesion, pts))
        for name, pts in critical_structures_points.items()
    ]
    return _build_report(patient_id, lesion_id, proximities)


def evaluate_surgical_margins_from_meshes(
    patient_id: str,
    lesion_id: str,
    lesion_mesh_path,
    critical_structures_mesh_paths: Dict[str, str]
) -> SurgicalSafetyMarginReport:
    """Variante qui calcule les distances sur de VRAIS maillages triangulés
    (.glb issus de la segmentation, voir `mesh_export.mask_to_glb`) au lieu de
    nuages de points fournis par l'appelant. Réutilise
    `mesh_export.mesh_distance_from_glb` (surface-à-surface, déjà testé dans
    `backend/tests/test_mesh_distance.py` et utilisé par
    `GET /segmentation/margin/{job_id}`) plutôt que le KDTree vertex-à-vertex
    de `compute_min_distance_3d` : plus précis sur un maillage décimé (points
    échantillonnés sur les triangles, pas seulement les sommets).

    Lève FileNotFoundError si un chemin de maillage est absent — à l'appelant
    de traduire ça en réponse HTTP honnête (422), jamais en une distance
    inventée."""
    from mesh_export import mesh_distance_from_glb

    proximities = []
    for name, path in critical_structures_mesh_paths.items():
        result = mesh_distance_from_glb(lesion_mesh_path, path)
        proximities.append(_classify_distance(name, result["min_distance_mm"]))
    return _build_report(patient_id, lesion_id, proximities)
