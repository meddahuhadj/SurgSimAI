# -*- coding: utf-8 -*-
"""
tests/test_mesh_distance.py — Vérifie que le calcul de distance surface-à-surface
(backend/mesh_export.py, utilisé par GET /segmentation/margin/{job_id}) retourne
une vraie distance géométrique cohérente, sur des maillages synthétiques dont
l'écart est connu analytiquement (pas besoin de TotalSegmentator/GPU).

Lancer : cd backend && pytest tests/test_mesh_distance.py -v
"""
from pathlib import Path

import pytest

trimesh = pytest.importorskip("trimesh")
pytest.importorskip("rtree")

from mesh_export import export_mesh_glb, mesh_distance_from_glb, surface_to_surface_min_distance


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
