# -*- coding: utf-8 -*-
"""
backend/tests/test_segmentation_specialties.py — Mapping multi-spécialités du
pipeline de segmentation générique (segmentation_specialties.py).

Testable SANS TotalSegmentator ni GPU : ce module ne contient que du
vocabulaire (noms de labels de la tâche "total") + des fonctions pures de
construction du payload. Vérifie que les mappings sont cohérents, complets et
que la construction du résultat respecte le contrat du frontend.

Lancer : cd backend && pytest tests/test_segmentation_specialties.py -v
"""
from fastapi.testclient import TestClient

import main
import segmentation_specialties as spec


def test_all_referenced_structures_are_known():
    """Chaque label référencé dans SPECIALTY_STRUCTURES / SPECIALTY_EXTRA_TASKS
    doit avoir une entrée dans TOTAL_STRUCTURE_INFO (nom, type, couleur, tâche)."""
    for label in spec.ALL_REFERENCED:
        assert spec.is_known_structure(label), f"Structure inconnue: {label}"
        info = spec.structure_info(label)
        assert info["label"] and info["type"] and info["color"]
        assert len(info["color"]) == 4
        assert info["task"] in ("total", "kidney_vessels")


def test_every_generic_specialty_has_structures():
    for specialty in spec.GENERIC_SPECIALTIES:
        assert spec.SPECIALTY_STRUCTURES[specialty], f"{specialty} sans structure"
        assert spec.valid_specialty_structures(specialty), f"{specialty} sans structure valide"


def test_hbp_and_anesthesie_are_not_generic():
    assert "hbp" not in spec.GENERIC_SPECIALTIES
    assert "anesthesie_reanimation" not in spec.GENERIC_SPECIALTIES


def test_group_by_task_splits_total_and_dedicated_tasks():
    groups = spec.group_by_task("urologie")
    assert set(groups["total"]) == {"kidney_left", "kidney_right", "urinary_bladder", "prostate"}
    assert set(groups["kidney_vessels"]) == {
        "kidney_artery_left", "kidney_artery_right", "kidney_vein_left", "kidney_vein_right"}

    # Une seule tâche pour les spécialités sans tâche dédiée
    assert set(spec.group_by_task("thoracique").keys()) == {"total"}
    assert "lung_left" in spec.group_by_task("thoracique")["total"]


def test_build_generic_segments_payload_contract():
    """Contrat frontend : chaque entrée porte organ/type/label/volume_ml et,
    quand le maillage existe, mesh_url."""
    volumes = {"colon": 1500.0, "small_bowel": 3200.5}
    mesh_calls = []
    payload = spec.build_generic_segments_payload(
        "colorectal", volumes,
        lambda label: (mesh_calls.append(label), f"/meshes/j/{label}.glb")[1],
    )
    assert len(payload) == 2
    by_organ = {e["organ"]: e for e in payload}
    assert by_organ["colon"]["volume_ml"] == 1500.0
    assert by_organ["small_bowel"]["volume_ml"] == 3200.5
    assert by_organ["colon"]["mesh_url"] == "/meshes/j/colon.glb"
    assert by_organ["colon"]["label"] == "Côlon"
    assert by_organ["small_bowel"]["type"] == "organe"
    assert set(mesh_calls) == {"colon", "small_bowel"}


def test_build_generic_segments_payload_no_mesh():
    """Un échec de génération de maillage (mesh_builder → None) n'exclut pas la
    structure du payload : le volume reste disponible, sans clé mesh_url."""
    payload = spec.build_generic_segments_payload(
        "gastrique", {"stomach": 250.0}, lambda label: None,
    )
    assert len(payload) == 2
    stomach = next(e for e in payload if e["organ"] == "stomach")
    assert stomach["volume_ml"] == 250.0
    assert "mesh_url" not in stomach


def test_build_generic_vessels_payload():
    payload = spec.build_generic_vessels_payload(
        "urologie",
        {"kidney_artery_left": 4.2, "kidney_artery_right": 5.1},
        lambda label: f"/meshes/j/{label}.glb",
    )
    names = {e["name"] for e in payload}
    assert "Artère rénale gauche" in names
    assert "Artère rénale droite" in names
    art_left = next(e for e in payload if e["name"] == "Artère rénale gauche")
    assert art_left["volume_ml"] == 4.2
    assert art_left["mesh_url"] == "/meshes/j/kidney_artery_left.glb"
    # Structure absente du volume (patient sans ce vaisseau) → volume 0, pas de crash
    for e in payload:
        assert e["volume_ml"] >= 0


def test_capabilities_reports_supported_specialties():
    client = TestClient(main.app)
    r = client.get("/segmentation/capabilities")
    assert r.status_code == 200
    body = r.json()
    supported = set(body.get("supported_specialties", []))
    assert {"hbp", "colorectal", "gastrique", "thyroide",
            "thoracique", "cardiaque", "urologie"} <= supported
    assert "anesthesie_reanimation" not in supported
    pipelines = body.get("specialty_pipelines", {})
    assert "hbp" in pipelines
    assert "liver_segments" in pipelines["hbp"]
    assert "lung_left" in pipelines.get("thoracique", "")
