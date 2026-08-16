# -*- coding: utf-8 -*-
"""
test_anonymizer_engine.py — Tests pour le moteur d'anonymisation des données patients HDS.
"""
import pytest
from anonymizer_engine import generate_pseudo_id, anonymize_patient_record, anonymize_dicom_tags


def test_generate_pseudo_id_deterministic():
    id1 = generate_pseudo_id("PAT-12345")
    id2 = generate_pseudo_id("PAT-12345")
    assert id1.startswith("ANON-")
    assert id1 == id2


def test_anonymize_patient_record_removes_pii():
    pat = {
        "id": "pat-99",
        "nom": "Dupont",
        "prenom": "Jean",
        "age": 58,
        "sexe": "M",
        "poids_kg": 75.0,
        "specialty": "hbp"
    }

    anon = anonymize_patient_record(pat)
    assert anon["nom"] == "ANONYMIZED_PATIENT"
    assert anon["prenom"] == "ANONYMIZED"
    assert anon["age"] == 58
    assert anon["sexe"] == "M"
    assert anon["id"].startswith("ANON-")


def test_anonymize_dicom_tags():
    tags = {
        "PatientName": "Dupont^Jean",
        "PatientID": "PAT-99",
        "PatientBirthDate": "19680512"
    }
    clean = anonymize_dicom_tags(tags)
    assert clean["PatientName"] == "ANONYMOUS^PATIENT"
    assert clean["PatientBirthDate"] == ""
    assert clean["PatientID"].startswith("ANON-")
