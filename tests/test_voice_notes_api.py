# -*- coding: utf-8 -*-
"""
test_voice_notes_api.py — Tests d'API pour le Voice-First (commandes vocales + notes persitées).

Couvre :
  - POST /api/v2/voice/command : résolution NLU serveur partagée avec le frontend.
  - POST /api/v2/voice/notes  : persistance d'une note dictée (« Note : … »).
  - GET  /api/v2/voice/notes/{patient_id} : lecture des notes d'un patient.
  - GET  /api/v2/voice/help : liste des commandes vocales.
  - Exigence d'authentification (401 sans token).
  - Traçabilité : chaque commande/note passe par write_audit → audit_logs.
"""
import pytest

try:
    from test_or_planning import _register_and_login, _unique
    from test_auth_patients_dicom import _patient_payload
except ImportError:
    from tests.test_or_planning import _register_and_login, _unique
    from tests.test_auth_patients_dicom import _patient_payload


def _create_patient(client, headers, patient_id=None) -> str:
    patient_id = patient_id or _unique("pat")
    r = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert r.status_code == 201, r.text
    return patient_id


SURGICAL_UTTERANCES = [
    ("SurSim, montre-moi une hystérectomie chez une patiente obèse", "show_hysterectomy"),
    ("Augmente la taille de la tumeur de 50 %", "grow_lesion"),
    ("C'est quoi cette structure en bleu ?", "identify_structure"),
    ("Note: cet étudiant est en difficulté sur les marges utérines", "add_note"),
]


def test_command_endpoint_requires_auth(client):
    res = client.post("/api/v2/voice/command", json={"transcript": "Vue 3D"})
    assert res.status_code == 401


def test_command_endpoint_resolves_all_surgical_intents(client):
    _, headers = _register_and_login(client)
    for utterance, expected_action in SURGICAL_UTTERANCES:
        res = client.post("/api/v2/voice/command", json={
            "transcript": utterance,
            "patient_id": _unique("pat"),
            "specialty": "gynecologie",
        }, headers=headers)
        assert res.status_code == 200, f"{utterance}: {res.text}"
        data = res.json()
        assert data["action"] == expected_action, f"{utterance}: {data}"
        assert 0.0 <= data["confidence"] <= 1.0


def test_command_endpoint_grow_lesion_extracts_percentage(client):
    _, headers = _register_and_login(client)
    res = client.post("/api/v2/voice/command", json={
        "transcript": "Augmente la tumeur de 33 pour cent",
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["action"] == "grow_lesion"
    assert data["params"]["delta_pct"] == 33.0


def test_command_endpoint_fallback_is_chat(client):
    _, headers = _register_and_login(client)
    res = client.post("/api/v2/voice/command", json={"transcript": "blirz"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "chat"
    assert data["action"] is None


def test_notes_endpoint_requires_auth(client):
    res = client.post("/api/v2/voice/notes", json={"text": "difficulé marges"})
    assert res.status_code == 401


def test_create_and_list_voice_note(client):
    _, headers = _register_and_login(client)
    pid = _create_patient(client, headers)

    res = client.post("/api/v2/voice/notes", json={
        "patient_id": pid,
        "text": "Cet étudiant est en difficulté sur les marges utérines",
        "tags": ["étudiant", "difficulté", "marges", "utérines"],
        "intent": "add_note",
        "action_token": "add_note",
        "confidence": 0.95,
    }, headers=headers)
    assert res.status_code == 201, res.text
    note = res.json()
    assert note["text"] == "Cet étudiant est en difficulté sur les marges utérines"
    assert "étudiant" in note["tags"]
    assert note["author_username"] is not None
    assert note["intent"] == "add_note"

    res_list = client.get(f"/api/v2/voice/notes/{pid}", headers=headers)
    assert res_list.status_code == 200
    notes = res_list.json()
    assert len(notes) >= 1
    assert notes[0]["text"] == "Cet étudiant est en difficulté sur les marges utérines"


def test_notes_are_patient_scoped(client):
    _, headers = _register_and_login(client)
    pid_a = _create_patient(client, headers, _unique("pat-a"))
    pid_b = _create_patient(client, headers, _unique("pat-b"))

    client.post("/api/v2/voice/notes", json={"patient_id": pid_a, "text": "note A", "tags": ["a"]}, headers=headers)
    client.post("/api/v2/voice/notes", json={"patient_id": pid_b, "text": "note B", "tags": ["b"]}, headers=headers)

    res_a = client.get(f"/api/v2/voice/notes/{pid_a}", headers=headers)
    res_b = client.get(f"/api/v2/voice/notes/{pid_b}", headers=headers)
    assert [n["text"] for n in res_a.json()] == ["note A"]
    assert [n["text"] for n in res_b.json()] == ["note B"]


def test_help_endpoint_lists_commands(client):
    _, headers = _register_and_login(client)
    res = client.get("/api/v2/voice/help", headers=headers)
    assert res.status_code == 200
    cmds = res.json()["commands"]
    assert any("hystérectomie" in c.lower() for c in cmds)


def test_command_is_traced_in_audit_log(client):
    _, headers = _register_and_login(client)
    from db import get_db
    from models import AuditLog
    db_session = next(get_db())
    before = db_session.query(AuditLog).filter(AuditLog.action == "VOICE_COMMAND_RESOLVED").count()
    client.post("/api/v2/voice/command", json={"transcript": "Vue 3D"}, headers=headers)
    after = db_session.query(AuditLog).filter(AuditLog.action == "VOICE_COMMAND_RESOLVED").count()
    assert after == before + 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
