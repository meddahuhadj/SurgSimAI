# -*- coding: utf-8 -*-
"""
tests/test_pkpd_anesthesia.py — Unit tests for Anesthesia PK/PD & Blood Loss router
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_pkpd_propofol_simulation():
    payload = {
        "patient": {
            "age": 45,
            "weight_kg": 75.0,
            "height_cm": 175.0,
            "sex": "M"
        },
        "drug": "propofol",
        "target_concentration_ug_ml": 3.5,
        "duration_minutes": 30
    }
    response = client.post("/anesthesia/simulate-pkpd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["drug"] == "propofol"
    assert data["target_concentration"] == 3.5
    assert len(data["time_series"]) == 31
    assert data["time_series"][-1]["ce_effect_site"] > 3.0


def test_pkpd_remifentanil_simulation():
    payload = {
        "patient": {
            "age": 60,
            "weight_kg": 65.0,
            "height_cm": 162.0,
            "sex": "F"
        },
        "drug": "remifentanil",
        "target_concentration_ug_ml": 4.0,
        "duration_minutes": 20
    }
    response = client.post("/anesthesia/simulate-pkpd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["drug"] == "remifentanil"
    assert data["unit"] == "ng/mL"


def _simulate(age, weight, height, sex, drug="propofol", target=4.0, duration=5):
    payload = {
        "patient": {"age": age, "weight_kg": weight, "height_cm": height, "sex": sex},
        "drug": drug,
        "target_concentration_ug_ml": target,
        "duration_minutes": duration,
    }
    r = client.post("/anesthesia/simulate-pkpd", json=payload)
    assert r.status_code == 200
    return r.json()


def test_pkpd_curve_is_patient_specific_not_a_universal_constant():
    """Avant correctif, Cp montait vers la cible avec une constante universelle (0.8/min)
    identique pour tout patient/médicament, sans lien avec CL1/V1 pourtant calculés et
    publiés dans la réponse. Deux patients très différents doivent désormais produire des
    courbes différentes (k10 = CL1/V1 propre à chacun)."""
    young = _simulate(25, 60.0, 165.0, "F")
    elderly = _simulate(85, 110.0, 190.0, "M")
    assert young["time_series"][2]["cp_plasma"] != elderly["time_series"][2]["cp_plasma"]


def test_pkpd_curve_converges_to_target_at_steady_state():
    data = _simulate(40, 70.0, 170.0, "M", target=3.0, duration=60)
    assert abs(data["time_series"][-1]["cp_plasma"] - 3.0) < 0.05
    assert abs(data["time_series"][-1]["ce_effect_site"] - 3.0) < 0.05


def test_pkpd_response_documents_model_limitations():
    data = _simulate(40, 70.0, 170.0, "M")
    assert "note" in data and "TCI" in data["note"] and "certifiée" in data["note"].lower()


def test_allowable_blood_loss():
    payload = {
        "patient": {
            "age": 50,
            "weight_kg": 80.0,
            "height_cm": 180.0,
            "sex": "M",
            "hb_initial_g_dl": 14.0,
            "hb_target_g_dl": 10.0
        }
    }
    response = client.post("/anesthesia/allowable-blood-loss", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ebv_ml"] == 5600.0  # 80 * 70
    assert data["mabl_ml"] == 1600.0 # 5600 * (14 - 10) / 14
    assert data["crystalloid_replacement_3to1_ml"] == 4800.0
