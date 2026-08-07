# -*- coding: utf-8 -*-
"""
tests/test_anesthesia_production_guard.py — Garde-fou production du module anesthésie simulée
=================================================================================================
Vérifie que `/api/v2/or-monitor/*` (constantes sinus/cosinus SIMULÉES, règles heuristiques)
répond 503 quand APP_ENV=production, et fonctionne normalement en development.

Lancer : cd backend && pytest tests/test_anesthesia_production_guard.py -v
"""
import importlib
import os

from fastapi import FastAPI
from fastapi.testclient import TestClient

BASE_URL = "/api/v2/or-monitor"


def _client_with_env(app_env: str) -> TestClient:
    os.environ["APP_ENV"] = app_env
    mod = importlib.import_module("hl7_anesthesia_service")
    importlib.reload(mod)
    app = FastAPI()
    app.include_router(mod.router)
    return TestClient(app)


def test_hemodynamics_blocked_in_production():
    client = _client_with_env("production")
    response = client.get(f"{BASE_URL}/hemodynamics/twin-1")
    assert response.status_code == 503
    assert "désactivé en production" in response.json()["detail"]


def test_simulate_clamping_blocked_in_production():
    client = _client_with_env("production")
    response = client.post(
        f"{BASE_URL}/simulate-clamping",
        json={"twin_id": "twin-1", "vessel_name": "Pédicule hépatique", "clamping_duration_min": 18, "specialty": "HBP"},
    )
    assert response.status_code == 503


def test_hemodynamics_works_in_development():
    client = _client_with_env("development")
    response = client.get(f"{BASE_URL}/hemodynamics/twin-1")
    assert response.status_code == 200
    data = response.json()
    assert data["data_source"] == "SIMULATED_WAVEFORM"
    assert "vitals" in data


def test_simulate_clamping_works_in_development():
    client = _client_with_env("development")
    response = client.post(
        f"{BASE_URL}/simulate-clamping",
        json={"twin_id": "twin-1", "vessel_name": "Pédicule hépatique", "clamping_duration_min": 18, "specialty": "HBP"},
    )
    assert response.status_code == 200
    assert response.json()["model_type"] == "rule_based_heuristic_fixed_thresholds_not_clinically_validated"
