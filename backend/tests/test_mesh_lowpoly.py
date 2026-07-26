# -*- coding: utf-8 -*-
"""
tests/test_mesh_lowpoly.py — Vérifie la décimation bas-poly (backend/mesh_export.py,
utilisée par segmentation_service._maybe_build_lowpoly_twin_mesh pour l'onglet
"Jumeau numérique" du frontend) et couvre le bug corrigé de mask_to_glb :
`simplify_quadric_decimation` doit être appelé avec `face_count=`, pas
positionnellement (l'API de trimesh a changé — le 1er paramètre positionnel est
`percent`, 0.0-1.0 — un entier comme 30000 levait ValueError).

Lancer : cd backend && pytest tests/test_mesh_lowpoly.py -v
"""
from pathlib import Path

import numpy as np
import pytest

trimesh = pytest.importorskip("trimesh")
pytest.importorskip("skimage")

from mesh_export import decimate_glb, export_mesh_glb, mask_to_glb


def _sphere_mask(radius_voxels=40):
    size = radius_voxels * 2 + 4
    zz, yy, xx = np.mgrid[0:size, 0:size, 0:size]
    center = size / 2
    dist2 = (zz - center) ** 2 + (yy - center) ** 2 + (xx - center) ** 2
    return dist2 <= radius_voxels ** 2


def test_mask_to_glb_decimates_large_mesh_without_crashing(tmp_path: Path):
    # Sphère assez grande pour que le maillage brut (marching cubes) dépasse
    # largement decimate_target_faces=30000 par défaut — couvre le chemin de
    # code où le bug (appel positionnel) se déclenchait.
    mask = _sphere_mask(radius_voxels=45)
    out_path = tmp_path / "big_sphere.glb"

    info = mask_to_glb(mask, out_path, decimate_target_faces=1000)

    assert out_path.is_file()
    assert info["num_faces"] <= 1000
    assert info["watertight"]
    assert info["volume_ml"] is not None and info["volume_ml"] > 0


def test_decimate_glb_reduces_vertex_count(tmp_path: Path):
    mesh = trimesh.creation.icosphere(subdivisions=4, radius=90.0)
    in_path = export_mesh_glb(mesh, tmp_path / "liver_total.glb")
    vertices_before = len(mesh.vertices)

    out_path = tmp_path / "liver_total_lowpoly.glb"
    info = decimate_glb(in_path, out_path, target_faces=300)

    assert out_path.is_file()
    assert info["num_vertices"] < vertices_before
    assert info["num_faces"] <= 300
    assert info["watertight"]
    assert info["volume_ml"] > 0


def test_decimate_glb_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        decimate_glb(tmp_path / "nope.glb", tmp_path / "out.glb", target_faces=300)
