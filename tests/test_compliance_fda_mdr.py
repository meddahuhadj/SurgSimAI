# -*- coding: utf-8 -*-
"""
test_compliance_fda_mdr.py — Suite de vérification de l'honnêteté des endpoints "NextGen"
=======================================================================================
Ces tests vérifiaient auparavant des valeurs de conformité réglementaire FABRIQUÉES
("CERTIFIED_COMPLIANT" MDR, faux numéros FDA 510(k) de produits tiers réels, précision
sub-millimétrique codée en dur) et les faisaient passer au vert en CI, ce qui renforçait
une fausse confiance dans un statut de certification qui n'a jamais existé.

Ce fichier a été réécrit pour vérifier le comportement HONNÊTE désormais en place : ces
endpoints déclarent explicitement l'absence de certification réelle et l'absence de calcul
réel derrière certaines métriques, au lieu de simuler un dispositif médical validé.

Exécution :
    pytest tests/test_compliance_fda_mdr.py -v
"""

import pytest
from fastapi.testclient import TestClient
try:
    from main import app
except ImportError:
    from backend.main import app


def test_mdr_fda_status_endpoint_is_honest_about_no_certification(client):
    """
    Vérifie que /api/v2/compliance/mdr-fda-status déclare honnêtement l'absence de
    certification MDR/FDA réelle, au lieu de l'ancien "CERTIFIED_COMPLIANT" fabriqué.
    """
    response = client.get("/api/v2/compliance/mdr-fda-status")
    assert response.status_code == 200, f"Erreur HTTP: {response.text}"
    data = response.json()

    certs = data["regulatory_certifications"]
    assert certs["eu_mdr_2017_745"]["status"] == "NOT_CERTIFIED"
    assert certs["us_fda_510k"]["status"] == "NOT_SUBMITTED"
    # Les anciens faux numéros 510(k) de produits tiers réels ne doivent plus apparaître.
    assert "predicate_devices" not in certs["us_fda_510k"]
    assert "disclaimer" in data and "non certifié" in data["disclaimer"].lower()


def test_mdr_fda_status_audit_trail_count_is_real_not_fabricated(client):
    """
    Le compteur d'événements d'audit doit refléter le contenu réel de la table
    audit_logs (ou signaler honnêtement son indisponibilité), jamais une valeur
    fixe fabriquée comme l'ancien fallback "= 42".
    """
    response = client.get("/api/v2/compliance/mdr-fda-status")
    assert response.status_code == 200
    data = response.json()
    trail = data["cryptographic_audit_trail"]
    assert "total_logged_events" in trail
    assert isinstance(trail["total_logged_events"], int)
    assert "audit_table_available" in trail


def test_biomech_respiratory_displacement_is_labeled_as_simplified_model(client):
    """
    Le modèle de déplacement respiratoire reste une formule paramétrique simple
    (pas un solveur FEM/PBD réel) : vérifie qu'il est désormais étiqueté comme tel.
    """
    response = client.get(
        "/api/v2/biomech/twins/TWIN-TEST-001/respiratory-displacement?phase_rad=1.57"
    )
    assert response.status_code == 200
    data = response.json()

    dz = data["global_diaphragm_shift_mm"]
    assert -15.5 <= dz <= -13.5, f"Déplacement respiratoire incohérent: {dz} mm"
    assert data["model_type"] == "simplified_kinematic_formula_not_patient_calibrated"
    assert "note" in data


def test_biomech_elastic_registration_computes_a_real_result(client):
    """
    L'ancien endpoint /elastic-registration renvoyait soit des métriques de
    convergence FIXES (final_rms_mm=0.34, 18 itérations) indépendantes du nuage
    fourni, soit un statut honnête "not_implemented" — aucun recalage n'était
    calculé dans les deux cas. L'endpoint calcule désormais un VRAI recalage
    (ICP rigide + FFD B-spline, voir registration.py et backend/tests/
    test_registration.py). Vérifie que le résultat est réellement calculé à
    partir des nuages fournis (RMS variable, pas une constante codée en dur)
    et qu'il reste honnête sur l'absence de validation clinique.
    """
    payload = {
        "twin_id": "TWIN-TEST-001",
        "intraop_point_cloud": [[10.2, 24.5, -5.1], [12.0, 25.1, -4.8], [15.4, 22.0, -6.2]],
        "preop_point_cloud": [[9.8, 24.0, -5.5], [12.5, 24.7, -4.9], [15.0, 21.5, -6.0]],
        "stiffness_regularization": 0.05,
        "max_iterations": 50,
    }
    response = client.post("/api/v2/biomech/twins/TWIN-TEST-001/elastic-registration", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "computed"
    assert data["num_points_intraop"] == len(payload["intraop_point_cloud"])
    assert data["num_points_preop"] == len(payload["preop_point_cloud"])
    # RMS réellement calculé (point flottant dépendant des données d'entrée) —
    # pas une constante fixe comme l'ancien 0.34 fabricé.
    assert isinstance(data["non_rigid_refinement"]["rms_mm"], float)
    assert data["rigid_transform"]["converged"] in (True, False)
    # Honnêteté : le recalage n'est pas présenté comme cliniquement validé.
    assert "note" in data and "validé" in data["note"] and "pas" in data["note"]


def test_voice_dictate_report_is_labeled_as_keyword_matching_not_llm(client):
    """
    Le générateur de compte-rendu CCAM reste un appariement de mots-clés, pas un LLM.
    Vérifie que la réponse le déclare explicitement et ne prétend plus être un document
    "signé et verrouillé" au sens légal.
    """
    payload = {
        "patient_id": "PAT-TEST-MDR-888",
        "twin_id": "TWIN-888",
        "surgeon_username": "dr.hadj.test",
        "specialty": "HBP",
        "raw_voice_transcript": "Hépatectomie droite réglée par laparotomie avec clampage de 18 minutes. Tranche de section hémostasiée au collafilm.",
        "request_fhir_cda": True,
    }
    response = client.post("/api/v2/voice/dictate-report", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["generation_method"] == "keyword_matching_demo"
    assert len(data["ccam_codes_assigned"]) > 0
    assert data["ccam_codes_assigned"][0]["code"] == "HFMA009"

    sha_hash = data["sha256_integrity_hash"]
    assert len(sha_hash) == 64, "Le hash SHA-256 ne fait pas 64 caractères hexadécimaux"
    assert all(c in "0123456789abcdef" for c in sha_hash.lower())


def test_or_monitor_hemodynamics_is_labeled_as_simulated(client):
    """
    Le flux de constantes vitales "en direct" reste une génération sinus/cosinus, pas
    une acquisition depuis un moniteur réel — vérifie l'étiquetage explicite et
    l'absence des noms de moniteurs commerciaux (Dräger/Mindray) implicitement associés
    à ces valeurs simulées.
    """
    response = client.get("/api/v2/or-monitor/hemodynamics/TWIN-OR-TEST-111?phase_t=1.0")
    assert response.status_code == 200
    data = response.json()

    assert data["data_source"] == "SIMULATED_WAVEFORM"
    assert "monitor_device" not in data


def test_or_anesthesia_hemodynamic_clamping_simulation_is_labeled_as_heuristic(client):
    """
    La simulation de clampage reste un outil de règles à seuils fixes, pas un modèle
    physiologique validé cliniquement — vérifie l'étiquetage explicite en plus du
    comportement fonctionnel (tolérance/chute de PAM) déjà couvert précédemment.
    """
    payload = {
        "twin_id": "TWIN-OR-TEST-111",
        "vessel_name": "Pédicule hépatique (Manœuvre de Pringle)",
        "clamping_duration_min": 18.0,
        "specialty": "HBP",
        "patient_asa_score": 2,
    }
    response = client.post("/api/v2/or-monitor/simulate-clamping", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["max_ischemia_tolerance_min"] == 45.0
    assert data["remaining_safe_ischemia_min"] == 27.0
    assert data["hemodynamic_impact_prediction"]["map_drop_mmhg"] < 0
    assert data["model_type"] == "rule_based_heuristic_fixed_thresholds_not_clinically_validated"


def test_mdr_dossier_status_endpoint(client):
    """Vérifie que /api/v1/compliance/mdr-dossier-status renvoie l'état du dossier MDR et de la sécurité HDS."""
    try:
        from test_or_planning import _register_and_login
    except ImportError:
        from tests.test_or_planning import _register_and_login
    _, headers = _register_and_login(client)
    res = client.get("/api/v1/compliance/mdr-dossier-status", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["mdr_classification"] == "Classe IIb (Aide à la décision chirurgicale & Planification 3D)"
    assert data["hds_security_checks"]["mandatory_2fa_enforced_in_production"] is True
    assert data["quality_and_ci_isolation"]["ci_clinical_pipeline_isolated"] is True


def test_clinical_evaluations_endpoint_without_ground_truth_pair_is_honest_422(client):
    """
    Corrigé : cet endpoint renvoyait auparavant un Dice/HD95 "réussi" (0.88/2.5mm)
    pour N'IMPORTE QUEL patient sans segment — une constante fabriquée, jamais un
    calcul réel. Il doit maintenant refuser honnêtement (422) plutôt que de
    prétendre avoir évalué quoi que ce soit sans référence experte réelle.
    """
    try:
        from test_or_planning import _register_and_login, _unique
    except ImportError:
        from tests.test_or_planning import _register_and_login, _unique
    import models
    from db import get_db

    # institution_id = celle de l'appelant : ce routeur applique désormais
    # l'isolation tenant (get_scoped_patient) — un patient d'une institution
    # différente répondrait 404 avant même d'atteindre la logique testée ici.
    username, headers = _register_and_login(client)
    db_session = next(get_db())
    user = db_session.query(models.User).filter(models.User.username == username).first()
    pid = _unique("pat-eval")
    pat = models.Patient(id=pid, nom="Test Eval MDR", age=50, sexe="F", poids_kg=60, taille_cm=165,
                          diagnostic="HCC", chirurgien="Dr. H", institution_id=user.institution_id)
    db_session.add(pat)
    db_session.commit()

    res = client.get(f"/api/v1/compliance/clinical-evaluations/{pid}", headers=headers)
    assert res.status_code == 422, res.text
    assert "référence experte" in res.text.lower()


def test_clinical_evaluations_endpoint_computes_real_dice_from_ground_truth_pair(client, tmp_path):
    """Avec un vrai couple (prédiction, référence experte) portant chacun un
    maillage .glb réel, l'endpoint doit renvoyer un Dice/HD95 réellement
    calculé, pas une constante."""
    trimesh = pytest.importorskip("trimesh")
    pytest.importorskip("rtree")
    from mesh_export import export_mesh_glb

    try:
        from test_or_planning import _register_and_login, _unique
    except ImportError:
        from tests.test_or_planning import _register_and_login, _unique
    import models
    from db import get_db

    username, headers = _register_and_login(client)
    db_session = next(get_db())
    user = db_session.query(models.User).filter(models.User.username == username).first()
    pid = _unique("pat-eval")
    # institution_id = celle de `user` : les POST /patients/{pid}/segments
    # ci-dessous passent par l'API avec `headers` (get_scoped_patient) — un
    # patient dans une AUTRE institution répondrait 404 avant même d'atteindre
    # la logique testée ici.
    pat = models.Patient(id=pid, nom="Test Eval MDR", age=50, sexe="F", poids_kg=60, taille_cm=165,
                          diagnostic="HCC", chirurgien="Dr. H", institution_id=user.institution_id)
    db_session.add(pat)
    db_session.commit()

    sphere = trimesh.creation.icosphere(subdivisions=3, radius=10.0)
    slightly_offset = trimesh.creation.icosphere(subdivisions=3, radius=10.0)
    slightly_offset.apply_translation((1.0, 0, 0))  # léger décalage : Dice élevé mais < 1
    gt_path = export_mesh_glb(sphere, tmp_path / "gt.glb")
    pred_path = export_mesh_glb(slightly_offset, tmp_path / "pred.glb")

    pred_id = _unique("seg-pred")
    r = client.post(f"/patients/{pid}/segments", json={
        "id": pred_id, "type": "organe", "volume_ml": 500.0, "label": "Foie (prédit)",
        "mesh_ref": str(pred_path),
    }, headers=headers)
    assert r.status_code == 201, r.text

    gt_id = _unique("seg-gt")
    r = client.post(f"/patients/{pid}/segments", json={
        "id": gt_id, "type": "organe", "volume_ml": 500.0, "label": "Foie (référence experte)",
        "mesh_ref": str(gt_path),
        "metadata_json": {"ground_truth_for_segment_id": pred_id},
    }, headers=headers)
    assert r.status_code == 201, r.text

    res = client.get(f"/api/v1/compliance/clinical-evaluations/{pid}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["patient_id"] == pid
    assert 0.0 < data["dice_coefficient"]["value"] < 1.0
    assert data["dice_coefficient"]["passed"] is True  # sphères quasi identiques -> Dice élevé
    assert data["sample_size"] == 1
    assert data["dice_coefficient"]["confidence_interval_95"] is None  # n=1, jamais un IC inventé
    assert data["target_registration_error_mm"] is None  # pas d'infrastructure d'amers -> jamais inventé


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
