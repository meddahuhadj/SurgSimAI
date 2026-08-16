# -*- coding: utf-8 -*-
"""
test_multi_tenant_isolation.py — Vérifie l'isolation par institution (tenant)
introduite dans models.Institution / backend/tenancy.py / deps.get_scoped_patient.

Deux utilisateurs enregistrés séparément via /auth/register obtiennent chacun
leur PROPRE institution personnelle (voir tenancy.resolve_institution_id) —
c'est ce qui rend ces deux comptes utilisables directement comme "deux
tenants différents" sans configuration supplémentaire. Pour le cas "même
institution", on utilise le compte de démo admin (dr.hadj) pour créer un
second utilisateur via POST /users, qui hérite de son institution (voir
routers/users.py::create_user).

⚠️ Portée volontairement limitée à ce que routers/patients.py,
routers/volumetrie.py et routers/plans.py appliquent réellement (voir
l'avertissement dans deps.get_scoped_patient) — ne teste pas les routers pas
encore migrés (compliance, twin, commercial_suite, dicom, pacs, or_readiness,
anesthesie).
"""
from test_auth_patients_dicom import _demo_login, _patient_payload, _register_and_login, _unique


def _create_patient(client, headers) -> str:
    patient_id = _unique("pat")
    r = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


# ---------------------------------------------------------------------------
# Deux utilisateurs enregistrés séparément = deux institutions différentes
# ---------------------------------------------------------------------------
def test_two_self_registered_users_get_different_institutions_and_cannot_see_each_others_patients(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)

    patient_id = _create_patient(client, headers_a)

    # B ne voit pas le patient de A — 404, pas 403 (ne révèle pas l'existence).
    r = client.get(f"/patients/{patient_id}", headers=headers_b)
    assert r.status_code == 404, r.text

    r = client.get("/patients", headers=headers_b)
    assert r.status_code == 200
    assert all(p["id"] != patient_id for p in r.json())

    # A voit bien son propre patient.
    r = client.get(f"/patients/{patient_id}", headers=headers_a)
    assert r.status_code == 200


def test_cross_tenant_cannot_update_or_delete_patient(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    r = client.put(f"/patients/{patient_id}", json={"nom": "Renommé par B"}, headers=headers_b)
    assert r.status_code == 404

    r = client.delete(f"/patients/{patient_id}", headers=headers_b)
    assert r.status_code == 404

    # Le patient existe toujours pour A, inchangé.
    r = client.get(f"/patients/{patient_id}", headers=headers_a)
    assert r.status_code == 200
    assert r.json()["nom"] == "Test Patient"


def test_cross_tenant_cannot_add_segments(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    r = client.post(f"/patients/{patient_id}/segments",
                     json={"id": _unique("seg"), "type": "organe", "volume_ml": 1000.0, "label": "Foie"},
                     headers=headers_b)
    assert r.status_code == 404

    r = client.get(f"/patients/{patient_id}/segments", headers=headers_b)
    assert r.status_code == 404


def test_cross_tenant_cannot_access_volumetrie_or_margin_safety(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    assert client.get(f"/patients/{patient_id}/volumetrie", headers=headers_b).status_code == 404
    assert client.post(f"/patients/{patient_id}/margin-safety", headers=headers_b).status_code == 404

    # A, en revanche, peut (le calcul peut échouer plus loin pour d'autres
    # raisons honnêtes — mais pas un 404 "patient introuvable").
    assert client.get(f"/patients/{patient_id}/volumetrie", headers=headers_a).status_code == 200


def test_cross_tenant_cannot_access_or_create_plans(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    r = client.post(f"/patients/{patient_id}/plans",
                     json={"procedure": "Intervention", "snapshot": {}}, headers=headers_b)
    assert r.status_code == 404

    assert client.get(f"/patients/{patient_id}/plans", headers=headers_b).status_code == 404

    # A peut créer un plan, puis B ne peut pas le consulter en devinant son id.
    created = client.post(f"/patients/{patient_id}/plans",
                           json={"procedure": "Intervention", "snapshot": {}}, headers=headers_a)
    assert created.status_code == 201, created.text
    plan_id = created.json()["id"]
    assert client.get(f"/patients/{patient_id}/plans/{plan_id}", headers=headers_b).status_code == 404
    assert client.get(f"/patients/{patient_id}/plans/{plan_id}", headers=headers_a).status_code == 200


# ---------------------------------------------------------------------------
# Même institution = accès partagé (pas une isolation par utilisateur, par tenant)
# ---------------------------------------------------------------------------
def test_users_in_the_same_institution_share_patients(client):
    admin_headers = _demo_login(client, "dr.hadj")  # dr.hadj + dr.benali partagent une institution (voir main.py)
    patient_id = _create_patient(client, admin_headers)

    colleague_headers = _demo_login(client, "dr.benali")
    r = client.get(f"/patients/{patient_id}", headers=colleague_headers)
    assert r.status_code == 200, r.text


def test_admin_created_user_inherits_creators_institution_and_shares_patients(client):
    admin_headers = _demo_login(client, "dr.hadj")
    patient_id = _create_patient(client, admin_headers)

    username = _unique("colleague")
    created = client.post("/users", json={"username": username, "password": "ColleaguePass123", "role": "surgeon"},
                           headers=admin_headers)
    assert created.status_code == 201, created.text

    login = client.post("/auth/token", data={"username": username, "password": "ColleaguePass123"})
    assert login.status_code == 200, login.text
    new_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    r = client.get(f"/patients/{patient_id}", headers=new_headers)
    assert r.status_code == 200, r.text


# ---------------------------------------------------------------------------
# Un patient est toujours créé dans l'institution du créateur, jamais fournie par le client
# ---------------------------------------------------------------------------
def test_patient_creation_ignores_any_client_supplied_institution_id(client):
    _, headers = _register_and_login(client)
    patient_id = _unique("pat")
    payload = {**_patient_payload(patient_id), "institution_id": "00000000-0000-0000-0000-000000000099"}
    r = client.post("/patients", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    # Le créateur voit toujours son propre patient (institution_id du payload ignorée).
    assert client.get(f"/patients/{patient_id}", headers=headers).status_code == 200
