# -*- coding: utf-8 -*-
"""
test_clinical_benchmarks.py — Tests pour le moteur de validation clinique MDR (Dice, HD95, TRE).
"""
import pytest
import numpy as np
from clinical_validation_benchmarks import (
    compute_dice_coefficient,
    compute_hausdorff_distance_95,
    compute_target_registration_error,
    evaluate_clinical_cohort
)


def test_compute_dice_coefficient_perfect_match():
    mask_gt = np.ones((10, 10, 10), dtype=bool)
    mask_pred = np.ones((10, 10, 10), dtype=bool)
    dice = compute_dice_coefficient(mask_gt, mask_pred)
    assert dice == 1.0


def test_compute_dice_coefficient_partial_overlap():
    mask_gt = np.zeros((10, 10, 10), dtype=bool)
    mask_gt[0:5, 0:5, 0:5] = True  # 125 voxels

    mask_pred = np.zeros((10, 10, 10), dtype=bool)
    mask_pred[0:5, 0:5, 0:5] = True  # 125 voxels
    mask_pred[2:7, 2:7, 2:7] = True

    dice = compute_dice_coefficient(mask_gt, mask_pred)
    assert 0.0 < dice < 1.0


def test_compute_hausdorff_distance_95():
    pts_gt = np.array([[0, 0, 0], [1, 1, 1], [2, 2, 2]])
    pts_pred = np.array([[0, 0, 0.5], [1, 1, 1.5], [2, 2, 2.5]])
    hd95 = compute_hausdorff_distance_95(pts_gt, pts_pred)
    assert round(hd95, 2) == 0.5


def test_compute_target_registration_error():
    ref = np.array([[10.0, 20.0, 30.0], [40.0, 50.0, 60.0]])
    reg = np.array([[11.0, 20.0, 30.0], [40.0, 50.0, 62.0]])  # diff 1.0 and 2.0 mm
    tre = compute_target_registration_error(ref, reg)
    assert round(tre, 2) == 1.5


def test_evaluate_clinical_cohort_passed():
    report = evaluate_clinical_cohort(
        evaluation_id="eval-001",
        patient_id="pat-bench-1",
        structure_name="liver_parenchyma",
        dice_vals=[0.92, 0.90, 0.94, 0.91],
        hd95_vals_mm=[1.8, 2.1, 1.5, 1.9],
        tre_vals_mm=[1.2, 1.4, 1.0, 1.3]
    )
    assert report.overall_clinical_validation_passed
    assert report.dice_coefficient.passed
    assert report.hausdorff_distance_95_mm.passed
    assert report.target_registration_error_mm.passed
    assert report.sample_size == 4
    assert report.dice_coefficient.confidence_interval_95 is not None


def test_evaluate_clinical_cohort_single_sample_has_no_confidence_interval():
    """Une seule mesure ne permet PAS de calculer un intervalle de confiance —
    voir compute_mean_and_ci95 : ceci remplace l'ancien comportement qui
    affichait un IC fabriqué (valeur ± décalage arbitraire) même pour n=1."""
    report = evaluate_clinical_cohort(
        evaluation_id="eval-002", patient_id="pat-bench-2", structure_name="liver_tumor",
        dice_vals=[0.90], hd95_vals_mm=[2.0],
    )
    assert report.sample_size == 1
    assert report.dice_coefficient.confidence_interval_95 is None
    assert "n=1" in report.dice_coefficient.ci95_note
    assert report.target_registration_error_mm is None  # jamais inventé quand non fourni


def test_evaluate_clinical_cohort_rejects_empty_sample():
    with pytest.raises(ValueError):
        evaluate_clinical_cohort(evaluation_id="eval-003", patient_id="pat-bench-3",
                                  structure_name="liver_tumor", dice_vals=[], hd95_vals_mm=[1.0])
