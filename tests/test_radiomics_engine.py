# -*- coding: utf-8 -*-
"""
test_radiomics_engine.py — Tests pour le moteur de caractéristiques radiomiques 3D.
"""
import pytest
import numpy as np
from radiomics_engine import compute_radiomic_features_3d


def test_compute_radiomic_features_homogeneous():
    voxels = np.full(1000, 50.0)  # Voxels homogènes à 50 HU
    res = compute_radiomic_features_3d("pat-01", "lesion-01", voxels)
    assert res.voxel_count == 1000
    assert res.mean_intensity_hu == 50.0
    assert res.std_intensity_hu == 0.0
    assert res.heterogeneity_grade == "HOMOGENEOUS"


def test_compute_radiomic_features_heterogeneous():
    voxels = np.random.normal(loc=100.0, scale=60.0, size=5000)
    res = compute_radiomic_features_3d("pat-02", "lesion-02", voxels)
    assert res.voxel_count == 5000
    assert res.std_intensity_hu > 40.0
    assert res.heterogeneity_grade == "HIGHLY_HETEROGENEOUS"


# ---------------------------------------------------------------------------
# Sphéricité / surface — corrige un bug où `sphericity` valait TOUJOURS 0.8,
# quelle que soit la forme réelle (estimated_surface = ideal_surface * 1.25,
# un facteur arbitraire sans rapport avec la structure segmentée).
# ---------------------------------------------------------------------------

def _sphere_mask(shape=(40, 40, 40), radius=12.0):
    zz, yy, xx = np.indices(shape)
    center = np.array(shape) / 2.0
    dist = np.sqrt((zz - center[0]) ** 2 + (yy - center[1]) ** 2 + (xx - center[2]) ** 2)
    return dist <= radius


def _elongated_mask(shape=(60, 20, 20), radius_yz=8.0):
    zz, yy, xx = np.indices(shape)
    dist_yz = np.sqrt((yy - shape[1] / 2.0) ** 2 + (xx - shape[2] / 2.0) ** 2)
    return dist_yz <= radius_yz  # cylindre plein sur tout l'axe z : forme allongée, non sphérique


def test_sphericity_is_none_without_segmentation_mask():
    """Sans masque, la forme n'est pas calculable — jamais une constante déguisée."""
    voxels = np.full(1000, 50.0)
    res = compute_radiomic_features_3d("pat-03", "lesion-03", voxels)
    assert res.sphericity is None
    assert res.surface_area_cm2 is None
    assert "segmentation_mask" in res.shape_calculation_method


def test_sphericity_of_a_real_sphere_is_close_to_one():
    """Une vraie sphère doit avoir une sphéricité de Wadell proche de 1 — c'est
    sa définition mathématique, pas 0.8 pour n'importe quelle forme."""
    mask = _sphere_mask()
    voxels = np.full(int(mask.sum()), 50.0)
    res = compute_radiomic_features_3d("pat-04", "lesion-04", voxels, segmentation_mask=mask)
    # Tolérance large : marching cubes sur une grille de voxels discrète produit
    # un artefact "en escalier" qui surestime légèrement la surface réelle par
    # rapport à une sphère mathématique parfaite (voir mesh_export.mask_to_mesh) —
    # 0.9+ suffit à distinguer ce résultat de l'ancienne constante 0.8 fixe.
    assert res.sphericity > 0.9


def test_sphericity_differs_between_sphere_and_elongated_shape():
    """Preuve que la sphéricité varie réellement selon la forme — l'ancien
    bug retournait 0.8 pour les deux cas, quelle que soit la géométrie."""
    sphere_mask = _sphere_mask()
    elongated_mask = _elongated_mask()

    sphere_res = compute_radiomic_features_3d(
        "pat-05", "sphere", np.full(int(sphere_mask.sum()), 50.0), segmentation_mask=sphere_mask)
    elongated_res = compute_radiomic_features_3d(
        "pat-06", "elongated", np.full(int(elongated_mask.sum()), 50.0), segmentation_mask=elongated_mask)

    assert sphere_res.sphericity != elongated_res.sphericity
    assert elongated_res.sphericity < sphere_res.sphericity  # cylindre allongé : moins sphérique
