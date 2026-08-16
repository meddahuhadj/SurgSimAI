# -*- coding: utf-8 -*-
"""
test_twin_elastography_2fa.py — Tests pour la calibration élastographie et le 2FA obligatoire en prod.
"""
import os
import uuid
import pytest
import models
from db import get_db


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _register_and_login(client, username=None, password="TestPass123"):
    username = username or _unique("user")
    client.post("/auth/register", json={"username": username, "password": password, "full_name": "Dr. Test"})
    r = client.post("/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return username, {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_elastography_ingest_calibrates_twin(client):
    username, headers = _register_and_login(client)
    db_session = next(get_db())
    user = db_session.query(models.User).filter(models.User.username == username).first()
    pid = _unique("pat-elasto")
    pat = models.Patient(id=pid, nom="Test Elasto", age=60, sexe="M", poids_kg=70, taille_cm=170,
                          diagnostic="CHC", chirurgien="Dr. Elasto", institution_id=user.institution_id)
    db_session.add(pat)
    db_session.commit()

    payload = {
        "tissue_type": "liver_parenchyma",
        "mean_shear_stiffness_kpa": 6.8,
        "frequency_hz": 50.0,
        "elastography_type": "mre_50hz"
    }

    res = client.post(f"/patients/{pid}/twin/elastography", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["source"] == "patient_elastography"
    assert data["parameters"]["C10_kpa"] == 3.4
    assert data["parameters"]["measured_shear_kpa"] == 6.8


def test_mandatory_2fa_in_production(client, monkeypatch):
    username, headers = _register_and_login(client)

    # In normal environment (development), requests succeed
    res_dev = client.get("/patients", headers=headers)
    assert res_dev.status_code == 200

    # In production environment, requests without 2FA enabled fail with 403
    monkeypatch.setenv("APP_ENV", "production")
    res_prod = client.get("/patients", headers=headers)
    assert res_prod.status_code == 403
    assert "Double authentification" in res_prod.json()["detail"]
