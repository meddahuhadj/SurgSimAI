# -*- coding: utf-8 -*-
"""
test_margin_safety_engine.py — Tests pour le moteur de calcul des marges chirurgicales 3D.
"""
import pytest
import numpy as np
from margin_safety_engine import compute_min_distance_3d, evaluate_surgical_margins


def test_compute_min_distance_3d():
    lesion = np.array([[0, 0, 0]])
    vessel = np.array([[10, 0, 0]])
    dist = compute_min_distance_3d(lesion, vessel)
    assert round(dist, 2) == 10.0


def test_evaluate_surgical_margins_r0_safe():
    lesion = np.array([[0, 0, 0]])
    vessel = np.array([[15, 0, 0]])
    report = evaluate_surgical_margins(
        patient_id="pat-01",
        lesion_id="lesion-01",
        points_lesion=lesion,
        critical_structures_points={"Vaine Hépatique Droite": vessel}
    )

    assert report.overall_r0_feasible
    assert report.global_min_margin_mm == 15.0
    assert report.proximities[0].margin_status == "R0_SAFE"


def test_evaluate_surgical_margins_critical_hazard():
    lesion = np.array([[0, 0, 0]])
    vessel = np.array([[2, 0, 0]])
    report = evaluate_surgical_margins(
        patient_id="pat-02",
        lesion_id="lesion-02",
        points_lesion=lesion,
        critical_structures_points={"Vaine Porte Droite": vessel}
    )

    assert not report.overall_r0_feasible
    assert report.global_min_margin_mm == 2.0
    assert report.proximities[0].margin_status == "R1_CRITICAL_HAZARD"
