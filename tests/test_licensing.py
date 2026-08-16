# -*- coding: utf-8 -*-
"""
test_licensing.py — Vérifie backend/licensing.py + routers/institution.py :
entitlement (plan/sièges/modules) par-dessus le multi-tenant introduit plus
tôt dans cette session (models.Institution, deps.get_scoped_patient).

⚠️ Ceci teste un système d'ENTITLEMENT, pas de facturation — aucun paiement
n'est vérifié ici, voir l'avertissement en tête de backend/licensing.py.
"""
from test_or_planning import _register_and_login, _unique
from test_auth_patients_dicom import _patient_payload, _demo_login


def _create_patient(client, headers) -> str:
    patient_id = _unique("pat")
    r = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


# ---------------------------------------------------------------------------
# Attribution automatique d'une licence 'trial' à une nouvelle institution
# ---------------------------------------------------------------------------
def test_new_personal_institution_gets_a_trial_license(client):
    _, headers = _register_and_login(client)
    r = client.get("/institution/license", headers=headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["plan"] == "trial"
    assert data["max_seats"] == 1
    assert data["enabled_modules"] == ["core"]
    assert data["seats_used"] == 1
    assert data["is_valid"] is True


def test_institution_license_requires_authentication(client):
    assert client.get("/institution/license").status_code == 401


# ---------------------------------------------------------------------------
# Quota de sièges
# ---------------------------------------------------------------------------
def test_seat_quota_blocks_joining_a_full_institution_via_register(client):
    username, headers = _register_and_login(client)  # trial, max_seats=1, 1 déjà utilisé
    import models
    from db import get_db
    db_session = next(get_db())
    user = db_session.query(models.User).filter(models.User.username == username).first()

    r = client.post("/auth/register", json={
        "username": _unique("colleague"), "password": "TestPass123",
        "full_name": "Colleague", "institution_id": user.institution_id,
    })
    assert r.status_code == 400, r.text
    assert "siège" in r.text.lower()


def test_seat_quota_blocks_admin_creating_user_when_full(client):
    # institution démo partagée avec dr.benali et tout compte créé par
    # d'autres tests de cette même session pytest (client session-scoped) —
    # le nombre de sièges déjà utilisés n'est donc PAS fixe, on le lit avant
    # de fixer le quota juste à cette valeur (jamais un nombre codé en dur).
    admin_headers = _demo_login(client, "dr.hadj")
    seats_now = client.get("/institution/license", headers=admin_headers).json()["seats_used"]

    r = client.patch("/institution/license", json={"max_seats": seats_now}, headers=admin_headers)
    assert r.status_code == 200, r.text
    assert r.json()["seats_used"] == seats_now

    r = client.post("/users", json={"username": _unique("overflow"), "password": "OverflowPass123"},
                     headers=admin_headers)
    assert r.status_code == 402, r.text

    # Remonter le quota débloque la création.
    client.patch("/institution/license", json={"max_seats": seats_now + 1}, headers=admin_headers)
    r = client.post("/users", json={"username": _unique("nowfits"), "password": "NowFitsPass123"},
                     headers=admin_headers)
    assert r.status_code == 201, r.text


# ---------------------------------------------------------------------------
# Gating de module (require_module) — /twin/deform réservé à 'digital_twin'
# ---------------------------------------------------------------------------
def test_trial_plan_cannot_use_digital_twin_module(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)

    r = client.post(f"/patients/{patient_id}/twin/deform", json={
        "job_id": "does-not-matter", "structure": "liver_total", "tissue_type": "liver_parenchyma",
        "grab_point_mm": [0, 0, 0], "target_delta_mm": [1, 0, 0],
    }, headers=headers)
    assert r.status_code == 403, r.text
    assert "digital_twin" in r.text


def test_upgrading_plan_unlocks_digital_twin_module(client):
    _, headers = _register_and_login(client)

    r = client.patch("/institution/license", json={"enabled_modules": ["core", "digital_twin"]}, headers=headers)
    assert r.status_code == 403, r.text  # rôle surgeon (self-registration) — pas admin

    # Les comptes de démo dr.hadj sont admin de leur propre institution.
    admin_headers = _demo_login(client, "dr.hadj")
    r = client.patch("/institution/license",
                      json={"plan": "research_lab", "reset_to_plan_defaults": True}, headers=admin_headers)
    assert r.status_code == 200, r.text
    assert "digital_twin" in r.json()["enabled_modules"]

    patient_id = _create_patient(client, admin_headers)
    r = client.post(f"/patients/{patient_id}/twin/deform", json={
        "job_id": "does-not-exist", "structure": "liver_total", "tissue_type": "liver_parenchyma",
        "grab_point_mm": [0, 0, 0], "target_delta_mm": [1, 0, 0],
    }, headers=admin_headers)
    # Le module est maintenant autorisé : la requête est bien reçue par le
    # handler (body valide, dépendance require_module satisfaite) et échoue
    # pour une raison métier différente (job_id inexistant -> 404), jamais
    # 403 "module non inclus".
    assert r.status_code == 404, r.text


# ---------------------------------------------------------------------------
# PATCH /institution/license — validations
# ---------------------------------------------------------------------------
def test_patch_license_requires_admin_role(client):
    _, headers = _register_and_login(client)  # role="surgeon" par défaut
    r = client.patch("/institution/license", json={"plan": "enterprise"}, headers=headers)
    assert r.status_code == 403


def test_patch_license_rejects_unknown_plan(client):
    admin_headers = _demo_login(client, "dr.hadj")
    r = client.patch("/institution/license", json={"plan": "not-a-real-plan"}, headers=admin_headers)
    assert r.status_code == 400


def test_patch_license_rejects_unknown_module(client):
    admin_headers = _demo_login(client, "dr.hadj")
    r = client.patch("/institution/license", json={"enabled_modules": ["core", "time_travel"]}, headers=admin_headers)
    assert r.status_code == 400


def test_patch_license_rejects_max_seats_below_current_usage(client):
    admin_headers = _demo_login(client, "dr.hadj")  # au moins 2 sièges déjà utilisés (dr.hadj + dr.benali)
    r = client.patch("/institution/license", json={"max_seats": 1}, headers=admin_headers)
    assert r.status_code == 400
