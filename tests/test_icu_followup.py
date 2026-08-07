# -*- coding: utf-8 -*-
"""
test_icu_followup.py — Suivi post-opératoire / Réanimation (USI).

Couverture du router /patients/{id}/preanesthesie + /patients/{id}/icu-followups :
  - dossier pré-anesthésique : upsert (création puis mise à jour), 404 patient
    inconnu, validation de plages cliniques, audit MDR ;
  - suivi USI : totaux calculés côté serveur (SOFA, Glasgow, bilan net, NEWS2),
    alerte Sepsis-3 (SOFA >= 2), validation de plages, liste décroissante,
    suppression, authentification requise ;
  - lien de traçabilité vers le plan chirurgical : seul un plan VALIDÉ peut être
    référencé (409 sinon), plan inconnu -> 404 ;
  - journal d'audit sur chaque acte sensible.
"""

import uuid

# ---------------------------------------------------------------------------
# Helpers (mêmes conventions que test_plans.py)
# ---------------------------------------------------------------------------


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _register_and_login(client, *, username=None, password: str = "TestPass123"):
    username = username or _unique("user")
    r = client.post("/auth/register", json={"username": username, "password": password, "full_name": "Test Réa"})
    assert r.status_code == 200, r.text
    r = client.post("/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return username, {"Authorization": f"Bearer {r.json()['access_token']}"}


def _create_patient(client, headers) -> str:
    patient_id = _unique("pat")
    r = client.post("/patients", json={
        "id": patient_id, "nom": "ICU Test Patient", "age": 62, "sexe": "M",
        "poids_kg": 72.0, "taille_cm": 170.0, "diagnostic": "Hémorragie post-op",
        "chirurgien": "Dr. Test", "specialty": "hbp", "urgence": "orange",
    }, headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


def _make_plan(client, headers, patient_id) -> dict:
    r = client.post(f"/patients/{patient_id}/plans", json={
        "procedure": "Hépatectomie droite", "notes": "Plan post-op",
    }, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _validate_plan(client, headers, patient_id, plan_id) -> dict:
    r = client.post(f"/patients/{patient_id}/plans/{plan_id}/validate",
                    json={"comment": "OK bloc"}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------------------
# Dossier pré-anesthésique
# ---------------------------------------------------------------------------


def test_preanesthesie_upsert_then_get(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)

    body = {
        "asa_score": 3, "mallampati_score": 2, "jeune_solide_h": 6.0,
        "intubation_difficile_prevue": True, "anesthesiste": "Dr. Test",
        "conclusion": "OK pour intervention",
        "checklist": [{"done": True, "text": "ECG"}, {"done": False, "text": "Biologie"}],
    }
    created = client.put(f"/patients/{patient_id}/preanesthesie", json=body, headers=headers)
    assert created.status_code == 200, created.text
    assert created.json()["asa_score"] == 3
    assert created.json()["checklist"] == [{"done": True, "text": "ECG"},
                                           {"done": False, "text": "Biologie"}]

    updated = client.put(f"/patients/{patient_id}/preanesthesie", json={"asa_score": 4}, headers=headers)
    assert updated.status_code == 200, updated.text
    assert updated.json()["asa_score"] == 4
    assert updated.json()["checklist"][0]["done"] is True  # le reste est conservé

    got = client.get(f"/patients/{patient_id}/preanesthesie", headers=headers)
    assert got.status_code == 200
    assert got.json()["anesthesiste"] == "Dr. Test"


def test_preanesthesie_missing_returns_404(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    r = client.get(f"/patients/{patient_id}/preanesthesie", headers=headers)
    assert r.status_code == 404


def test_preanesthesie_unknown_patient_404(client):
    _, headers = _register_and_login(client)
    r = client.put(f"/patients/{_unique('ghost')}/preanesthesie", json={"asa_score": 2}, headers=headers)
    assert r.status_code == 404


def test_preanesthesie_rejects_clinical_ranges(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    bad_asa = client.put(f"/patients/{patient_id}/preanesthesie", json={"asa_score": 6}, headers=headers)
    assert bad_asa.status_code == 422
    bad_mallampati = client.put(f"/patients/{patient_id}/preanesthesie",
                                json={"mallampati_score": 9}, headers=headers)
    assert bad_mallampati.status_code == 422


# ---------------------------------------------------------------------------
# Suivi réanimation / USI
# ---------------------------------------------------------------------------


def test_icu_followup_computes_all_scores_server_side(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)

    body = {
        "sofa_respiration": 2, "sofa_coagulation": 1, "sofa_hepatique": 0,
        "sofa_cardiovasculaire": 2, "sofa_neurologique": 1, "sofa_renal": 1,  # SOFA = 7
        "glasgow_oculaire": 3, "glasgow_verbale": 4, "glasgow_motrice": 5,    # GCS = 12
        "bilan_entrees_ml": 2200, "bilan_sorties_ml": 900,                    # net = +1300
        "resp_rate_rpm": 28, "spo2_pct": 90, "supplemental_o2": True,
        "systolic_bp_mmhg": 88, "heart_rate_bpm": 132, "temperature_c": 39.4, "avpu": "U",  # NEWS2 = 19
        "auteur": "Dr. Réa",
    }
    r = client.post(f"/patients/{patient_id}/icu-followups", json=body, headers=headers)
    assert r.status_code == 201, r.text
    rec = r.json()
    assert rec["sofa_total"] == 7
    assert rec["glasgow_total"] == 12
    assert rec["bilan_net_ml"] == 1300
    assert rec["news2_total"] == 19
    assert rec["sepsis_alert"] is True


def test_icu_followup_no_sepsis_alert_below_threshold(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    r = client.post(f"/patients/{patient_id}/icu-followups", json={
        "sofa_respiration": 1, "sofa_renal": 0,
        "auteur": "Dr. Réa",
    }, headers=headers)
    assert r.status_code == 201, r.text
    assert r.json()["sofa_total"] == 1
    assert r.json()["sepsis_alert"] is False


def test_icu_followup_rejects_clinical_ranges(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    bad_sofa = client.post(f"/patients/{patient_id}/icu-followups",
                           json={"sofa_respiration": 9}, headers=headers)
    assert bad_sofa.status_code == 422
    bad_gcs = client.post(f"/patients/{patient_id}/icu-followups",
                          json={"glasgow_oculaire": 7}, headers=headers)
    assert bad_gcs.status_code == 422
    bad_avpu = client.post(f"/patients/{patient_id}/icu-followups",
                           json={"avpu": "X"}, headers=headers)
    assert bad_avpu.status_code == 422


def test_icu_followup_list_descending_and_delete(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    for _ in range(2):
        r = client.post(f"/patients/{patient_id}/icu-followups", json={"auteur": "Dr. Réa"}, headers=headers)
        assert r.status_code == 201

    listed = client.get(f"/patients/{patient_id}/icu-followups", headers=headers)
    assert listed.status_code == 200
    recs = listed.json()
    assert len(recs) == 2
    assert recs[0]["recorded_at"] >= recs[1]["recorded_at"]  # décroissant

    deleted = client.delete(f"/patients/{patient_id}/icu-followups/{recs[0]['id']}", headers=headers)
    assert deleted.status_code == 200
    assert client.get(f"/patients/{patient_id}/icu-followups", headers=headers).json()[0]["id"] == recs[1]["id"]


def test_icu_followup_unknown_followup_404(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    r = client.delete(f"/patients/{patient_id}/icu-followups/{_unique('ghost')}", headers=headers)
    assert r.status_code == 404


def test_icu_followup_unknown_patient_404(client):
    _, headers = _register_and_login(client)
    r = client.post(f"/patients/{_unique('ghost')}/icu-followups", json={"auteur": "x"}, headers=headers)
    assert r.status_code == 404


def test_icu_followup_requires_authentication(client):
    patient_id = _unique("pat")
    r = client.get(f"/patients/{patient_id}/icu-followups")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Lien vers le plan chirurgical VALIDÉ
# ---------------------------------------------------------------------------


def test_icu_followup_links_only_validated_plan(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    draft = _make_plan(client, headers, patient_id)

    # Un plan encore draft ne peut pas être référencé.
    refused = client.post(f"/patients/{patient_id}/icu-followups",
                          json={"plan_id": draft["id"], "auteur": "Dr. Réa"}, headers=headers)
    assert refused.status_code == 409

    # Une fois validé, le lien est accepté.
    validated = _validate_plan(client, headers, patient_id, draft["id"])
    assert validated["status"] == "validated"
    ok = client.post(f"/patients/{patient_id}/icu-followups",
                     json={"plan_id": draft["id"], "auteur": "Dr. Réa"}, headers=headers)
    assert ok.status_code == 201, ok.text
    assert ok.json()["plan_id"] == draft["id"]

    # Plan inconnu ou appartenant à un autre patient -> 404.
    ghost = client.post(f"/patients/{patient_id}/icu-followups",
                        json={"plan_id": _unique("ghost-plan")}, headers=headers)
    assert ghost.status_code == 404


# ---------------------------------------------------------------------------
# Audit trail (MDR 2017/745)
# ---------------------------------------------------------------------------


def test_preanesthesia_and_icu_write_audit_trail(client):
    _, headers = _register_and_login(client)
    patient_id = _create_patient(client, headers)
    client.put(f"/patients/{patient_id}/preanesthesie", json={"asa_score": 2}, headers=headers)
    r = client.post(f"/patients/{patient_id}/icu-followups",
                    json={"sofa_respiration": 2, "auteur": "Dr. Réa"}, headers=headers)
    assert r.status_code == 201

    login = client.post("/auth/token", data={"username": "dr.hadj", "password": "changeme"})
    assert login.status_code == 200, login.text
    admin_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    audit = client.get("/audit", params={"patient_id": patient_id}, headers=admin_headers)
    assert audit.status_code == 200
    actions = [entry["action"] for entry in audit.json()]
    assert any("pré-anesthésique" in a or "pré-anesth" in a or "anesth" in a.lower() for a in actions)
    assert any("réanimation/USI" in a for a in actions)
