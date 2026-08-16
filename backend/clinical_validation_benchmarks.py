# -*- coding: utf-8 -*-
"""
clinical_validation_benchmarks.py — Moteur d'évaluation clinique et métriques de validation (MDR Classe IIb).
===========================================================================================================
Implémente les calculs quantitatifs requis par le dossier technique d'évaluation clinique (MEDDEV 2.7/1 rev4 / MDCG) :
  1. Coefficient de similitude de Dice (DSC - 3D Volume Overlap)
  2. Distance d'Hausdorff à 95% (HD95 - Contour Precision en mm)
  3. Erreur de Localisation Cible (TRE - Target Registration Error en mm sur amers anatomiques)
  4. Génération de rapport d'évaluation clinique certifié avec intervalles de confiance à 95%.
"""

import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


@dataclass
class ClinicalMetricResult:
    metric_name: str
    value: float
    unit: str
    acceptance_threshold: float
    passed: bool
    sample_size: int
    confidence_interval_95: Optional[Tuple[float, float]]
    ci95_note: str
    clinical_note: str


@dataclass
class ClinicalEvaluationReport:
    evaluation_id: str
    patient_id: str
    structure_name: str
    sample_size: int
    dice_coefficient: ClinicalMetricResult
    hausdorff_distance_95_mm: ClinicalMetricResult
    target_registration_error_mm: Optional[ClinicalMetricResult]
    overall_clinical_validation_passed: bool
    evaluation_timestamp: str


def compute_dice_coefficient(mask_ground_truth: np.ndarray, mask_predicted: np.ndarray) -> float:
    """Calcul du coefficient de Dice entre la segmentation de référence (expert anapath/radiologue) et la cible."""
    gt = np.asarray(mask_ground_truth, dtype=bool)
    pred = np.asarray(mask_predicted, dtype=bool)

    intersection = np.logical_and(gt, pred).sum()
    total_voxels = gt.sum() + pred.sum()

    if total_voxels == 0:
        return 1.0
    return float(2.0 * intersection / total_voxels)


def compute_hausdorff_distance_95(points_ground_truth: np.ndarray, points_predicted: np.ndarray, voxel_spacing_mm: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> float:
    """Calcul de la distance d'Hausdorff à 95% (HD95) en millimètres entre deux nuages de points 3D de contours."""
    if len(points_ground_truth) == 0 or len(points_predicted) == 0:
        return 0.0

    gt_pts = np.asarray(points_ground_truth, dtype=float) * np.asarray(voxel_spacing_mm)
    pred_pts = np.asarray(points_predicted, dtype=float) * np.asarray(voxel_spacing_mm)

    # Distances minimales de gt_pts vers pred_pts
    dist_gt_to_pred = np.min(np.linalg.norm(gt_pts[:, None, :] - pred_pts[None, :, :], axis=2), axis=1)
    # Distances minimales de pred_pts vers gt_pts
    dist_pred_to_gt = np.min(np.linalg.norm(pred_pts[:, None, :] - gt_pts[None, :, :], axis=2), axis=1)

    all_distances = np.concatenate([dist_gt_to_pred, dist_pred_to_gt])
    return float(np.percentile(all_distances, 95))


def compute_target_registration_error(landmarks_ref: np.ndarray, landmarks_registered: np.ndarray) -> float:
    """Calcul de l'erreur moyenne de localisation cible (TRE) sur des amers anatomiques repérés en 3D (mm)."""
    ref = np.asarray(landmarks_ref, dtype=float)
    reg = np.asarray(landmarks_registered, dtype=float)

    if ref.shape != reg.shape or len(ref) == 0:
        raise ValueError("Les nuages d'amers anatomiques doivent avoir la même dimension et être non vides.")

    errors = np.linalg.norm(ref - reg, axis=1)
    return float(np.mean(errors))


def compute_mean_and_ci95(values: List[float]) -> Tuple[float, Optional[Tuple[float, float]], str]:
    """Moyenne et intervalle de confiance à 95% RÉELS d'un échantillon de mesures
    (une valeur par cas/structure évalué·e), via l'approximation normale de
    l'erreur standard (mean ± 1.96 * std / sqrt(n)).

    ⚠️ Remplace l'ancien comportement de `evaluate_clinical_cohort` (avant cette
    correction), qui affichait un "intervalle de confiance à 95%" calculé comme
    `valeur ± décalage fixe arbitraire` sur une SEULE mesure (`sample_size=1`
    codé en dur) — un IC n'a de sens statistique que sur un échantillon d'au
    moins 2 mesures indépendantes ; en dessous, on le dit explicitement plutôt
    que d'inventer une fourchette.

    Retourne (moyenne, IC95 ou None, note explicative). L'approximation
    normale est une simplification usuelle mais suppose n suffisamment grand
    pour être fiable (n >= ~10 en pratique) — la note le précise pour n < 10.
    """
    n = len(values)
    if n == 0:
        raise ValueError("Échantillon vide : aucune mesure à évaluer.")
    mean = float(np.mean(values))
    if n < 2:
        return mean, None, "n=1 : intervalle de confiance non calculable (nécessite >= 2 mesures indépendantes)."

    std = float(np.std(values, ddof=1))  # écart-type de l'échantillon (ddof=1, pas de population)
    sem = std / math.sqrt(n)
    ci = (mean - 1.96 * sem, mean + 1.96 * sem)
    note = (f"Approximation normale (mean ± 1.96×SEM), n={n}."
            + (" n < 10 : fiabilité de l'approximation normale limitée, à interpréter avec prudence." if n < 10 else ""))
    return mean, ci, note


def evaluate_clinical_cohort(
    evaluation_id: str,
    patient_id: str,
    structure_name: str,
    dice_vals: List[float],
    hd95_vals_mm: List[float],
    tre_vals_mm: Optional[List[float]] = None
) -> ClinicalEvaluationReport:
    """
    Évalue une VRAIE cohorte de mesures (une valeur de Dice/HD95/TRE par cas ou
    par structure comparée à sa référence experte — pas une mesure unique
    présentée comme un échantillon) selon les critères d'acceptabilité MDR
    Classe IIb, sur la MOYENNE de la cohorte :
      - Dice >= 0.85 (seuil de précision volumétrique)
      - HD95 <= 3.0 mm (seuil d'écart de contour)
      - TRE <= 2.0 mm (seuil de tolérance chirurgicale)

    `dice_vals` et `hd95_vals_mm` sont requis et non vides. `tre_vals_mm` est
    optionnel (aucune infrastructure d'amers anatomiques appariés n'existe
    encore dans ce dépôt pour la calculer systématiquement — voir
    routers/compliance.py) : quand absent, la case TRE du rapport est `None`,
    jamais une valeur inventée.
    """
    if not dice_vals or not hd95_vals_mm:
        raise ValueError("dice_vals et hd95_vals_mm doivent être des listes non vides.")

    def _metric(name: str, values: List[float], unit: str, threshold: float, higher_is_better: bool, note_pass: str, note_fail: str) -> ClinicalMetricResult:
        mean, ci, ci_note = compute_mean_and_ci95(values)
        passed = (mean >= threshold) if higher_is_better else (mean <= threshold)
        return ClinicalMetricResult(
            metric_name=name, value=round(mean, 4 if unit.startswith("index") else 2), unit=unit,
            acceptance_threshold=threshold, passed=passed, sample_size=len(values),
            confidence_interval_95=(round(ci[0], 4 if unit.startswith("index") else 2),
                                     round(ci[1], 4 if unit.startswith("index") else 2)) if ci else None,
            ci95_note=ci_note, clinical_note=note_pass if passed else note_fail,
        )

    dice_res = _metric("Dice Similarity Coefficient (DSC)", dice_vals, "index [0-1]", 0.85, True,
                        "Conforme aux critères de précision volumétrique", "Précision volumétrique insuffisante")
    hd_res = _metric("Hausdorff Distance 95% (HD95)", hd95_vals_mm, "mm", 3.0, False,
                      "Précision de contour conforme aux marges chirurgicales", "Écart de contour supérieur au seuil toléré")

    tre_res = None
    tre_pass = True
    if tre_vals_mm:
        tre_res = _metric("Target Registration Error (TRE)", tre_vals_mm, "mm", 2.0, False,
                           "Erreur de recalage conforme à la sécurité peropératoire", "Décalage d'amers supérieur au seuil de sécurité")
        tre_pass = tre_res.passed

    overall_pass = dice_res.passed and hd_res.passed and tre_pass
    import datetime

    return ClinicalEvaluationReport(
        evaluation_id=evaluation_id,
        patient_id=patient_id,
        structure_name=structure_name,
        sample_size=len(dice_vals),
        dice_coefficient=dice_res,
        hausdorff_distance_95_mm=hd_res,
        target_registration_error_mm=tre_res,
        overall_clinical_validation_passed=overall_pass,
        evaluation_timestamp=datetime.datetime.utcnow().isoformat()
    )
