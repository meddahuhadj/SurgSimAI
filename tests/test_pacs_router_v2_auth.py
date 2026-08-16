# -*- coding: utf-8 -*-
"""
test_pacs_router_v2_auth.py — Vérifie backend/pacs_router_v2.py ("NextGen v2").

Corrigé : aucun des 5 endpoints de ce routeur (monté et actif, voir
backend/main.py::_real_services) ne vérifiait l'authentification, malgré des
données patient/étude en jeu — un routeur unique dans ce dépôt à ne pas
exiger de JWT. Ces tests verrouillent l'exigence d'authentification ajoutée,
plus l'isolation tenant sur les deux endpoints qui prennent un patient_id.
"""
from test_or_planning import _register_and_login, _unique
from test_auth_patients_dicom import _patient_payload


def _create_patient(client, headers) -> str:
    patient_id = _unique("pat")
    r = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


def test_all_v2_endpoints_require_authentication(client):
    assert client.get("/api/v2/pacs/studies/s1/series/se1/stream-voxels").status_code == 401
    assert client.post("/api/v2/pacs/studies/s1/series/se1/export-seg", json={
        "twin_id": "t1", "organ_label": "LIVER", "voxel_count": 100,
    }).status_code == 401
    assert client.post("/api/v2/pacs/studies/s1/export-sr", json={
        "plan_id": "p1", "ai_risk_score": 5.0, "shap_summary": {},
    }).status_code == 401
    assert client.get("/api/v2/fhir/r5/Patient/whatever/DigitalTwins").status_code == 401
    assert client.post("/api/v2/fhir/r5/Procedure", json={"patient_id": "whatever"}).status_code == 401


def test_digital_twins_endpoint_is_tenant_scoped(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    ok = client.get(f"/api/v2/fhir/r5/Patient/{patient_id}/DigitalTwins", headers=headers_a)
    assert ok.status_code == 200, ok.text

    cross_tenant = client.get(f"/api/v2/fhir/r5/Patient/{patient_id}/DigitalTwins", headers=headers_b)
    assert cross_tenant.status_code == 404


def test_fhir_procedure_sync_is_tenant_scoped(client):
    _, headers_a = _register_and_login(client)
    _, headers_b = _register_and_login(client)
    patient_id = _create_patient(client, headers_a)

    ok = client.post("/api/v2/fhir/r5/Procedure", json={"patient_id": patient_id}, headers=headers_a)
    assert ok.status_code == 200, ok.text

    cross_tenant = client.post("/api/v2/fhir/r5/Procedure", json={"patient_id": patient_id}, headers=headers_b)
    assert cross_tenant.status_code == 404


def test_stream_voxels_and_exports_work_once_authenticated(client):
    """Ces trois endpoints n'ont pas de patient_id direct (étude/série
    uniquement) — juste l'authentification à vérifier, pas l'isolation tenant."""
    _, headers = _register_and_login(client)

    r = client.get("/api/v2/pacs/studies/s1/series/se1/stream-voxels", headers=headers)
    assert r.status_code == 200

    r = client.post("/api/v2/pacs/studies/s1/series/se1/export-seg", json={
        "twin_id": "t1", "organ_label": "LIVER", "voxel_count": 100,
    }, headers=headers)
    assert r.status_code == 200

    r = client.post("/api/v2/pacs/studies/s1/export-sr", json={
        "plan_id": "p1", "ai_risk_score": 5.0, "shap_summary": {},
    }, headers=headers)
    assert r.status_code == 200
