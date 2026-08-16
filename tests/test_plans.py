# -*- coding: utf-8 -*-
"""
test_plans.py — Cycle de planification réelle : plans chirurgicaux versionnés.

Couverture du router /patients/{id}/plans :
  - création avec auto-incrément de version par patient
  - liste (versions décroissantes) / consultation
  - modification : draft uniquement + auteur uniquement (403 sinon)
  - cycle draft → reviewed → validated (signature) | rejected (motif obligatoire)
  - un plan validé est figé (409 si re-modification/re-validation)
  - validation d'audit trail sur chaque étape sensible
"""

import uuid

# ---------------------------------------------------------------------------
# Helpers (mêmes conventions que test_segments_volumetrie_interop.py)
# ---------------------------------------------------------------------------


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _register_and_login(client, *, username=None, password: str = "TestPass123", institution_id=None):
    username = username or _unique("user")
    payload = {"username": username, "password": password, "full_name": "Test Surgeon"}
    if institution_id:
        payload["institution_id"] = institution_id
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 200, r.text
    r = client.post("/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return username, {"Authorization": f"Bearer {r.json()['access_token']}"}


def _create_patient(client, headers) -> str:
    patient_id = _unique("pat")
    r = client.post("/patients", json={
        "id": patient_id, "nom": "Plan Test Patient", "age": 55, "sexe": "F",
        "poids_kg": 68.0, "taille_cm": 165.0, "diagnostic": "CHC",
        "chirurgien": "Dr. Test", "specialty": "hbp", "urgence": "vert",
    }, headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


def _make_plan(client, headers, patient_id, version_snapshot=None) -> dict:
    r = client.post(f"/patients/{patient_id}/plans", json={
        "procedure": "Hépatectomie droite",
        "snapshot": version_snapshot or {"flr_pct": 42.0, "cut": {"mode": "segments", "segments": ["V", "VI"]}},
        "notes": "Plan de test",
    }, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ---------------------------------------------------------------------------
# Création / versionnement
# ---------------------------------------------------------------------------


def test_create_plan_auto_increments_version(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)

    v1 = _make_plan(client, headers, patient_id)
    v2 = _make_plan(client, headers, patient_id)

    assert v1["version"] == 1
    assert v2["version"] == 2
    assert v1["status"] == "draft"
    assert v1["author_name"] == "Test Surgeon"
    assert v1["snapshot"]["flr_pct"] == 42.0


def test_create_plan_on_unknown_patient_returns_404(client):
    _, headers = _register_and_login(client)
    r = client.post(f"/patients/{_unique('ghost')}/plans", json={"procedure": "X"}, headers=headers)
    assert r.status_code == 404


def test_create_plan_retries_on_version_collision(client, monkeypatch):
    """Deux créations concurrentes peuvent calculer le MÊME numéro de version
    (SELECT puis INSERT avec UNIQUE(patient_id, version)). Le router doit
    rejouer la transaction et réussir avec le numéro suivant, au lieu de
    renvoyer un 500 IntegrityError non géré. On simule la collision en forçant
    _next_version à renvoyer 1 (déjà pris) une seule fois."""
    import routers.plans as plans_mod

    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    _make_plan(client, headers, patient_id)  # v1 déjà en base

    real_next = plans_mod._next_version
    calls = {"n": 0}

    def colliding_next(db, patient_id):
        calls["n"] += 1
        return 1 if calls["n"] == 1 else real_next(db, patient_id)

    monkeypatch.setattr(plans_mod, "_next_version", colliding_next)

    r = client.post(f"/patients/{patient_id}/plans", json={"procedure": "P2"}, headers=headers)
    assert r.status_code == 201, r.text
    assert r.json()["version"] == 2
    assert calls["n"] == 2  # première tentative collée + retry réussi


def test_list_plans_descending_and_get_one(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    v1 = _make_plan(client, headers, patient_id)
    v2 = _make_plan(client, headers, patient_id)

    listed = client.get(f"/patients/{patient_id}/plans", headers=headers).json()
    assert [p["version"] for p in listed] == [2, 1]

    got = client.get(f"/patients/{patient_id}/plans/{v1['id']}", headers=headers)
    assert got.status_code == 200
    assert got.json()["version"] == 1


def test_get_plan_unknown_returns_404(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    r = client.get(f"/patients/{patient_id}/plans/{_unique('ghost-plan')}", headers=headers)
    assert r.status_code == 404


def test_plans_require_authentication(client):
    patient_id = _unique("pat")
    r = client.get(f"/patients/{patient_id}/plans")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Modification : draft + auteur uniquement
# ---------------------------------------------------------------------------


def test_update_draft_by_author(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)

    r = client.put(f"/patients/{patient_id}/plans/{plan['id']}", json={
        "snapshot": {"flr_pct": 47.0}, "notes": "Marge augmentée"
    }, headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["snapshot"]["flr_pct"] == 47.0


def test_update_draft_by_non_author_forbidden(client):
    import models
    from db import get_db

    import licensing

    author_username, h1 = _register_and_login(client, username=_unique("author"))
    db_session = next(get_db())
    author = db_session.query(models.User).filter(models.User.username == author_username).first()
    # L'institution personnelle de l'auteur naît en plan 'trial' (1 siège,
    # voir tenancy.py) — la relever est nécessaire avant qu'un second
    # utilisateur puisse la rejoindre (voir backend/licensing.py).
    lic = licensing.get_or_create_license(db_session, author.institution_id)
    lic.max_seats = 2
    db_session.commit()
    # "other" doit être dans la MÊME institution que l'auteur pour isoler ce
    # test sur la règle testée (auteur uniquement) — sinon get_scoped_patient
    # renverrait 404 (tenants différents) avant même d'atteindre la
    # vérification d'auteur, ce qui ne serait pas ce que ce test vérifie.
    _, h2 = _register_and_login(client, username=_unique("other"), institution_id=author.institution_id)
    patient_id = _create_patient(client, h1)
    plan = _make_plan(client, h1, patient_id)

    r = client.put(f"/patients/{patient_id}/plans/{plan['id']}", json={"notes": "tentative"}, headers=h2)
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Cycle de validation
# ---------------------------------------------------------------------------


def test_review_then_validate_freezes_plan(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)

    reviewed = client.post(f"/patients/{patient_id}/plans/{plan['id']}/review",
                           json={"comment": "FLR conforme"}, headers=headers)
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "reviewed"

    validated = client.post(f"/patients/{patient_id}/plans/{plan['id']}/validate",
                            json={"comment": "OK bloc"}, headers=headers)
    assert validated.status_code == 200
    body = validated.json()
    assert body["status"] == "validated"
    assert body["signed_by"] == "Test Surgeon"
    assert body["signed_at"] is not None

    # Un plan validé est figé : ni modification, ni re-validation, ni rejet.
    frozen = client.put(f"/patients/{patient_id}/plans/{plan['id']}", json={"notes": "non"}, headers=headers)
    assert frozen.status_code == 409
    again = client.post(f"/patients/{patient_id}/plans/{plan['id']}/validate", json={}, headers=headers)
    assert again.status_code == 409
    rejected = client.post(f"/patients/{patient_id}/plans/{plan['id']}/reject",
                           json={"comment": "trop tard"}, headers=headers)
    assert rejected.status_code == 409


def test_validate_plan_requires_comment_capable_flow(client):
    """Un draft peut être validé directement (sans passer par review)."""
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)

    validated = client.post(f"/patients/{patient_id}/plans/{plan['id']}/validate", json={}, headers=headers)
    assert validated.status_code == 200
    assert validated.json()["status"] == "validated"


def test_reject_requires_motif(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)

    no_motif = client.post(f"/patients/{patient_id}/plans/{plan['id']}/reject", json={"comment": "  "}, headers=headers)
    assert no_motif.status_code == 400

    rejected = client.post(f"/patients/{patient_id}/plans/{plan['id']}/reject",
                           json={"comment": "Tumeur non résécable, voir RCP"}, headers=headers)
    assert rejected.status_code == 200
    body = rejected.json()
    assert body["status"] == "rejected"
    assert "RCP" in body["comment"]


def test_plan_workflow_writes_audit_trail(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)
    client.post(f"/patients/{patient_id}/plans/{plan['id']}/validate", json={}, headers=headers)

    # /audit est réservé aux rôles admin/dpo : on lit le journal en admin (seed d'usine).
    login = client.post("/auth/token", data={"username": "dr.hadj", "password": "changeme"})
    assert login.status_code == 200, login.text
    admin_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    audit = client.get("/audit", params={"patient_id": patient_id}, headers=admin_headers)
    assert audit.status_code == 200
    actions = [entry["action"] for entry in audit.json()]
    assert any("Création plan chirurgical" in a for a in actions)
    assert any("Validation plan chirurgical" in a for a in actions)


def test_export_plan_fhir(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    plan = _make_plan(client, headers, patient_id)

    res = client.get(f"/patients/{patient_id}/plans/{plan['id']}/export/fhir", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["resourceType"] == "Bundle"
    assert len(data["entry"]) == 2
    assert data["entry"][0]["resource"]["resourceType"] == "CarePlan"
    assert data["entry"][1]["resource"]["resourceType"] == "Procedure"
