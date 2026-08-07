# -*- coding: utf-8 -*-
"""
test_clinical_scores.py — Scores cliniques de réanimation/USI (backend/clinical_scores.py).

Tests unitaires purs des tables de scores (NEWS2 RCP 2017, SOFA, Glasgow, bilan net,
alerte Sepsis-3). Les seuils reproduisent les grilles cliniques officielles — toute
modification de score doit passer par cette suite avant d'impacter l'API.
"""

import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from clinical_scores import (  # noqa: E402
    compute_bilan_net,
    compute_glasgow,
    compute_news2,
    compute_sofa,
    news2_escalation,
    sepsis_organ_dysfunction,
)


# ---------------------------------------------------------------------------
# SOFA
# ---------------------------------------------------------------------------


def test_sofa_sums_six_subscores():
    assert compute_sofa(1, 2, 0, 3, 1, 2) == 9


def test_sofa_ignores_missing_and_returns_none_when_empty():
    assert compute_sofa(1, None, None, 3, None, None) == 4
    assert compute_sofa(None, None, None, None, None, None) is None


# ---------------------------------------------------------------------------
# Glasgow
# ---------------------------------------------------------------------------


def test_glasgow_fully_alert_15():
    assert compute_glasgow(4, 5, 6) == 15


def test_glasgow_coma_threshold():
    assert compute_glasgow(1, 1, 2) == 4


def test_glasgow_partial_and_none():
    assert compute_glasgow(4, 5, None) == 9
    assert compute_glasgow(None, None, None) is None


# ---------------------------------------------------------------------------
# Bilan hydrique net
# ---------------------------------------------------------------------------


def test_bilan_net_positive_and_negative():
    assert compute_bilan_net(2500, 1200) == 1300
    assert compute_bilan_net(500, 2100) == -1600


def test_bilan_net_none_when_no_data():
    assert compute_bilan_net(None, None) is None
    assert compute_bilan_net(None, 300) == -300


# ---------------------------------------------------------------------------
# Alerte Sepsis-3 (dysfonction organique SOFA >= 2)
# ---------------------------------------------------------------------------


def test_sepsis_alert_threshold():
    assert sepsis_organ_dysfunction(1) is False
    assert sepsis_organ_dysfunction(2) is True
    assert sepsis_organ_dysfunction(12) is True


def test_sepsis_alert_no_data():
    assert sepsis_organ_dysfunction(None) is False


# ---------------------------------------------------------------------------
# NEWS2 — respiratoire
# ---------------------------------------------------------------------------


def test_news2_respiratory_rate_table():
    cases = {6: 3, 9: 1, 14: 0, 22: 2, 30: 3}
    for rpm, expected in cases.items():
        total = compute_news2(resp_rate_rpm=rpm)
        assert total == expected, f"Fr {rpm}/min -> {total}, attendu {expected}"


# ---------------------------------------------------------------------------
# NEWS2 — oxygénation (SpO2 + oxygène supplémentaire)
# ---------------------------------------------------------------------------


def test_news2_spo2_table():
    cases = {88: 3, 92: 2, 94: 1, 96: 0, 100: 0}
    for spo2, expected in cases.items():
        total = compute_news2(spo2_pct=spo2)
        assert total == expected, f"SpO2 {spo2}% -> {total}, attendu {expected}"


def test_news2_supplemental_oxygen_adds_two():
    assert compute_news2(spo2_pct=95, supplemental_o2=False) == 1
    assert compute_news2(spo2_pct=95, supplemental_o2=True) == 3


# ---------------------------------------------------------------------------
# NEWS2 — hémodynamique (PAS + FC)
# ---------------------------------------------------------------------------


def test_news2_systolic_bp_table():
    cases = {85: 3, 95: 2, 105: 1, 140: 0, 200: 0, 230: 3}
    for bp, expected in cases.items():
        total = compute_news2(systolic_bp_mmhg=bp)
        assert total == expected, f"PAS {bp} -> {total}, attendu {expected}"


def test_news2_heart_rate_table():
    cases = {38: 3, 45: 1, 60: 0, 100: 1, 120: 2, 140: 3}
    for hr, expected in cases.items():
        total = compute_news2(heart_rate_bpm=hr)
        assert total == expected, f"FC {hr} -> {total}, attendu {expected}"


# ---------------------------------------------------------------------------
# NEWS2 — température + conscience (AVPU)
# ---------------------------------------------------------------------------


def test_news2_temperature_table():
    cases = {34.5: 3, 35.5: 1, 37.0: 0, 38.5: 1, 39.5: 2}
    for temp, expected in cases.items():
        total = compute_news2(temperature_c=temp)
        assert total == expected, f"T {temp}°C -> {total}, attendu {expected}"


def test_news2_avpu_only_alert_scores():
    assert compute_news2(avpu="A") == 0
    assert compute_news2(avpu="V") == 3
    assert compute_news2(avpu="P") == 3
    assert compute_news2(avpu="U") == 3
    assert compute_news2(avpu="v") == 3  # insensible à la casse


# ---------------------------------------------------------------------------
# NEWS2 — cas composites et escalade
# ---------------------------------------------------------------------------


def test_news2_fully_alert_supplemented_composite():
    """Patient stable mais sous O2 : SpO2 96% (0) + O2 (2) = 2/20."""
    assert compute_news2(resp_rate_rpm=16, spo2_pct=96, supplemental_o2=True,
                         systolic_bp_mmhg=118, heart_rate_bpm=72,
                         temperature_c=36.8, avpu="A") == 2


def test_news2_septic_shock_like_composite():
    """Choc septique : polymée 28 (3) + SpO2 90% (3) + O2 (2) + PAS 88 (3)
    + FC 132 (3) + T 39.4 (2) + conscience U (3) = 19/20."""
    assert compute_news2(resp_rate_rpm=28, spo2_pct=90, supplemental_o2=True,
                         systolic_bp_mmhg=88, heart_rate_bpm=132,
                         temperature_c=39.4, avpu="U") == 19


def test_news2_absent_parameters_do_not_contribute():
    assert compute_news2(resp_rate_rpm=10) == 1  # seul paramètre renseigné
    assert compute_news2() == 0


def test_news2_escalation_levels():
    assert news2_escalation(0)["level"] == "low"
    assert news2_escalation(4)["level"] == "low"
    assert news2_escalation(5)["level"] == "medium"
    assert news2_escalation(6)["level"] == "medium"
    assert news2_escalation(7)["level"] == "high"
    assert news2_escalation(20)["level"] == "high"
    assert news2_escalation(None)["level"] == "low"
