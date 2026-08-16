# -*- coding: utf-8 -*-
"""
test_or_planning.py — Tests unitaires et d'intégration pour l'OR Command Center & Moteur de Contraintes.
"""
import pytest
import uuid
from datetime import datetime, timedelta

import models
from db import get_db
from or_readiness_engine import compute_patient_readiness
from or_constraint_engine import evaluate_slot_constraints
from or_optimizer import optimize_or_schedule


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _register_and_login(client, username=None, password="TestPass123"):
    username = username or _unique("user")
    client.post("/auth/register", json={"username": username, "password": password, "full_name": "Dr. Test"})
    r = client.post("/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return username, {"Authorization": f"Bearer {r.json()['access_token']}"}


def _any_institution_id(db_session) -> str:
    """Ces tests insèrent des Patient directement en base (moteurs testés
    hors API — or_readiness_engine/or_constraint_engine ne sont pas encore
    migrés vers l'isolation tenant, voir deps.get_scoped_patient) : n'importe
    quelle institution valide suffit à satisfaire la contrainte NOT NULL."""
    inst = models.Institution(name="Institution de test OR planning")
    db_session.add(inst)
    db_session.commit()
    return inst.id


def test_surgical_procedure_crud(client):
    _, headers = _register_and_login(client)

    proc_payload = {
        "name": f"Procedure-{uuid.uuid4().hex[:6]}",
        "specialty": "digestif",
        "estimated_duration_mins": 140,
        "min_duration_mins": 90,
        "max_duration_mins": 240,
        "urgency_default": "elective",
        "complexity_level": "medium",
        "anesthesia_type": "general",
        "required_equipment": ["laparoscope", "coelio"],
        "required_icu_bed": False,
        "required_icu_duration_hours": 0.0
    }
    res = client.post("/or/procedures", json=proc_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["specialty"] == "digestif"

    res_list = client.get("/or/procedures", headers=headers)
    assert res_list.status_code == 200
    procs = res_list.json()
    assert any(p["id"] == data["id"] for p in procs)


def test_patient_readiness_engine(client):
    db_session = next(get_db())
    inst_id = _any_institution_id(db_session)
    pid = _unique("pat-readiness")
    pat = models.Patient(
        id=pid,
        nom="Test Readiness",
        age=55,
        sexe="M",
        poids_kg=75.0,
        taille_cm=175.0,
        diagnostic="Tumeur hépatique",
        chirurgien="Dr. Hadj",
        specialty="hbp",
        institution_id=inst_id,
    )
    db_session.add(pat)
    db_session.commit()

    readiness = compute_patient_readiness(pid, db_session)
    assert readiness.readiness_status == "BLOCKED"
    assert readiness.readiness_level == "🔴 BLOCKED"
    assert len(readiness.critical_blockers) > 0


def test_slot_constraint_engine_hard_blockers(client):
    db_session = next(get_db())
    inst_id = _any_institution_id(db_session)
    rid = _unique("room")
    p1_id = _unique("pat1")
    p2_id = _unique("pat2")

    room = models.OperatingRoom(id=rid, name="Salle Test Constraint", type="general", is_active=True)
    pat1 = models.Patient(id=p1_id, nom="P1", age=40, sexe="F", poids_kg=60, taille_cm=165, diagnostic="Diag P1", chirurgien="Dr. X", institution_id=inst_id)
    pat2 = models.Patient(id=p2_id, nom="P2", age=50, sexe="M", poids_kg=70, taille_cm=170, diagnostic="Diag P2", chirurgien="Dr. Y", institution_id=inst_id)
    db_session.add_all([room, pat1, pat2])
    db_session.commit()

    st1 = datetime.utcnow().replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(days=1)
    et1 = st1 + timedelta(hours=2)

    s1 = models.OperatingSchedule(
        id=_unique("sched"),
        operating_room_id=rid,
        patient_id=p1_id,
        start_time=st1,
        end_time=et1,
        estimated_duration_mins=120,
        status="confirmed"
    )
    db_session.add(s1)
    db_session.commit()

    val = evaluate_slot_constraints(
        db_session,
        operating_room_id=rid,
        patient_id=p2_id,
        start_time=st1 + timedelta(minutes=30),
        end_time=et1 + timedelta(minutes=30),
        check_patient_readiness=False
    )
    assert not val.is_valid
    assert val.status == "BLOCKED"
    assert any("Conflit d'horaire" in b for b in val.hard_blockers)


def test_or_optimizer_options(client):
    db_session = next(get_db())
    st = datetime.utcnow().replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(days=2)
    et = st + timedelta(hours=10)

    opt_res = optimize_or_schedule(db_session, st - timedelta(hours=1), et + timedelta(hours=1))
    assert isinstance(opt_res.estimated_time_saved_mins, int)
    assert isinstance(opt_res.options, list)


def test_schedule_freeze_and_audit(client):
    _, headers = _register_and_login(client)
    db_session = next(get_db())
    inst_id = _any_institution_id(db_session)
    rid = _unique("room-frz")
    pid = _unique("pat-frz")

    room = models.OperatingRoom(id=rid, name="Salle Freeze", type="general", is_active=True)
    pat = models.Patient(id=pid, nom="PF", age=45, sexe="M", poids_kg=80, taille_cm=180, diagnostic="Diag", chirurgien="Dr. X", institution_id=inst_id)
    dcm = models.DicomSeries(id=_unique("dcm"), patient_id=pid, study_uid="std1", series_uid=_unique("ser"), modality="CT")
    segment = models.Segment(id=_unique("seg"), patient_id=pid, type="organe", volume_ml=1200.0, label="Foie", mesh_ref="storage/mesh.stl")
    plan = models.SurgicalPlan(id=_unique("plan"), patient_id=pid, version=1, status="validated", procedure="Intervention")
    pa = models.PreanesthesiaAssessment(id=_unique("pa"), patient_id=pid, asa_score=2, asa_urgence=False, jeune_solide_h=8.0, conclusion="Patient apte au bloc, bilan TP/INR et NFS validés")
    db_session.add_all([room, pat, dcm, segment, plan, pa])
    db_session.commit()

    st = datetime.utcnow().replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(days=3)
    et = st + timedelta(hours=2)
    sid = _unique("sched-frz")
    u = db_session.query(models.User).first()
    s = models.OperatingSchedule(
        id=sid,
        operating_room_id=rid,
        patient_id=pid,
        start_time=st,
        end_time=et,
        estimated_duration_mins=120,
        primary_surgeon_id=u.id if u else None,
        status="draft"
    )
    db_session.add(s)
    db_session.commit()

    # Freeze schedule
    res_freeze = client.post(f"/or/schedule/{sid}/freeze", headers=headers)
    assert res_freeze.status_code == 200
    assert res_freeze.json()["status"] == "frozen"

    # Attempt update without audit_reason -> should fail 400
    res_fail = client.put(f"/or/schedule/{sid}", json={"notes": "Modif sans raison"}, headers=headers)
    assert res_fail.status_code == 400

    # Update with audit_reason -> should succeed
    res_ok = client.put(f"/or/schedule/{sid}", json={"notes": "Modif autorisee", "audit_reason": "Urgence médicale justifiée"}, headers=headers)
    assert res_ok.status_code == 200
    assert res_ok.json()["notes"] == "Modif autorisee"


def test_simulation_what_if(client):
    _, headers = _register_and_login(client)
    sim_payload = {
        "date": datetime.utcnow().isoformat(),
        "room_unavailable_id": "bloc-1"
    }
    res = client.post("/or/simulation/what-if", json=sim_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "Indisponibilité totale" in data["scenario_description"]
    assert "recommendation" in data


def test_procedure_duration_analytics(client):
    _, headers = _register_and_login(client)
    res = client.get("/or/analytics/procedure-durations", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert len(data["stats"]) >= 0


def test_or_audit_trail(client):
    _, headers = _register_and_login(client)
    res = client.get("/or/audit-trail", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
