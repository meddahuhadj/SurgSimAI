# -*- coding: utf-8 -*-
"""
tests/test_mesh_distance.py — Vérifie que le calcul de distance surface-à-surface
(backend/mesh_export.py, utilisé par GET /segmentation/margin/{job_id}) retourne
une vraie distance géométrique cohérente, sur des maillages synthétiques dont
l'écart est connu analytiquement (pas besoin de TotalSegmentator/GPU).

Lancer : cd backend && pytest tests/test_mesh_distance.py -v
"""
import sys
from pathlib import Path

import pytest

# Rend ce fichier auto-suffisant (import de `mesh_export` sans dépendre de
# l'ordre de collecte d'autres modules de tests qui, eux, ajoutent déjà
# backend/ à sys.path — voir le même bootstrap dans test_clinical_scores.py).
_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

trimesh = pytest.importorskip("trimesh")
pytest.importorskip("rtree")

from mesh_export import (  # noqa: E402
    dice_and_hd95_from_glb,
    export_mesh_glb,
    mesh_distance_from_glb,
    mesh_pair_dice,
    surface_to_surface_min_distance,
)


def _sphere(radius, center):
    mesh = trimesh.creation.icosphere(subdivisions=4, radius=radius)
    mesh.apply_translation(center)
    return mesh


def test_surface_to_surface_min_distance_known_gap():
    r_a, r_b, d_centers = 10.0, 15.0, 60.0
    expected = d_centers - r_a - r_b  # 35.0 mm

    result = surface_to_surface_min_distance(_sphere(r_a, (0, 0, 0)), _sphere(r_b, (d_centers, 0, 0)))
    assert result["min_distance_mm"] == pytest.approx(expected, abs=0.5)


def test_mesh_distance_from_glb_roundtrip(tmp_path: Path):
    r_a, r_b, d_centers = 8.0, 8.0, 40.0
    expected = d_centers - r_a - r_b  # 24.0 mm

    path_a = export_mesh_glb(_sphere(r_a, (0, 0, 0)), tmp_path / "a.glb")
    path_b = export_mesh_glb(_sphere(r_b, (d_centers, 0, 0)), tmp_path / "b.glb")

    result = mesh_distance_from_glb(path_a, path_b)
    assert result["min_distance_mm"] == pytest.approx(expected, abs=0.5)


def test_intersecting_meshes_near_zero():
    result = surface_to_surface_min_distance(_sphere(10.0, (0, 0, 0)), _sphere(10.0, (5, 0, 0)))
    assert result["min_distance_mm"] == pytest.approx(0.0, abs=0.5)


def test_mesh_distance_from_glb_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        mesh_distance_from_glb(tmp_path / "nope_a.glb", tmp_path / "nope_b.glb")


def test_surface_to_surface_reports_hd95_between_min_and_max_distance():
    result = surface_to_surface_min_distance(_sphere(10.0, (0, 0, 0)), _sphere(10.0, (0, 0, 0)))
    # Deux sphères identiques et confondues : toutes les distances sont ~0, HD95 aussi.
    assert result["hd95_mm"] == pytest.approx(0.0, abs=0.5)
    assert result["hd95_mm"] >= result["min_distance_mm"]


def test_mesh_pair_dice_identical_meshes_is_one():
    mesh = _sphere(10.0, (0, 0, 0))
    result = mesh_pair_dice(mesh, mesh, pitch_mm=1.0)
    assert result["dice"] == pytest.approx(1.0, abs=0.05)


def test_mesh_pair_dice_disjoint_meshes_is_near_zero():
    result = mesh_pair_dice(_sphere(5.0, (0, 0, 0)), _sphere(5.0, (100, 0, 0)), pitch_mm=1.0)
    assert result["dice"] == pytest.approx(0.0, abs=0.01)
    assert result["n_voxels_intersection"] == 0


def test_mesh_pair_dice_partial_overlap_is_strictly_between_zero_and_one():
    # Deux sphères de même rayon dont les centres sont séparés de moins que 2×rayon : chevauchement partiel.
    result = mesh_pair_dice(_sphere(10.0, (0, 0, 0)), _sphere(10.0, (10.0, 0, 0)), pitch_mm=1.0)
    assert 0.1 < result["dice"] < 0.9


def test_mesh_pair_dice_empty_mesh_raises():
    import trimesh
    empty = trimesh.Trimesh(vertices=[], faces=[])
    with pytest.raises(ValueError):
        mesh_pair_dice(_sphere(5.0, (0, 0, 0)), empty)


def test_dice_and_hd95_from_glb_combines_both_metrics(tmp_path: Path):
    path_a = export_mesh_glb(_sphere(8.0, (0, 0, 0)), tmp_path / "a.glb")
    path_b = export_mesh_glb(_sphere(8.0, (5.0, 0, 0)), tmp_path / "b.glb")

    result = dice_and_hd95_from_glb(path_a, path_b, pitch_mm=1.0)
    assert 0.0 < result["dice"] < 1.0
    assert result["hd95_mm"] >= 0.0
    assert result["min_distance_mm"] >= 0.0  # sphères qui se recoupent (centres à 5mm, rayon 8mm chacune)
