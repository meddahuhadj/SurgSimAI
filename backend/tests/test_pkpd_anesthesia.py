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
