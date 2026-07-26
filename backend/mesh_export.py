# -*- coding: utf-8 -*-
"""
mesh_export.py — Extraction de maillages 3D réels depuis un masque de
segmentation (label map NIfTI) et export au format GLB pour Three.js.

Pipeline :
    masque binaire (numpy 3D, voxels) --marching cubes (skimage)--> maillage
    triangulé --décimation optionnelle--> --export (trimesh)--> fichier .glb

Ce module est indépendant de TotalSegmentator : il prend en entrée n'importe
quel masque binaire 3D (qu'il vienne d'une vraie inférence nnU-Net, d'un
import manuel, ou d'un test). C'est la partie du pipeline "segmentation → 3D"
qui ne nécessite ni GPU ni poids de modèle.

Installation : pip install scikit-image trimesh numpy
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import numpy as np


def mask_to_mesh(mask: np.ndarray, spacing: tuple[float, float, float] = (1.0, 1.0, 1.0),
                  level: float = 0.5, step_size: int = 1):
    """
    Extrait un maillage triangulé (vertices, faces) d'un masque binaire 3D
    via l'algorithme de Marching Cubes (Lorensen & Cline, 1987).

    - mask: array numpy 3D (bool ou 0/1), typiquement (Z, Y, X)
    - spacing: taille du voxel en mm (z, y, x) — issue du header NIfTI/DICOM,
      indispensable pour que le maillage ait les bonnes proportions réelles.
    - step_size: >1 sous-échantillonne la grille de marching cubes pour
      accélérer/simplifier le maillage (utile pour de gros volumes CT).

    Retourne (vertices, faces, normals) ou lève ValueError si le masque est vide.
    """
    from skimage.measure import marching_cubes

    if mask.sum() == 0:
        raise ValueError("Masque vide : aucune structure à mailler.")

    # marching_cubes exige un volume "épais" d'au moins 2 voxels par axe
    if any(s < 2 for s in mask.shape):
        raise ValueError(f"Masque trop petit pour le maillage: shape={mask.shape}")

    verts, faces, normals, _values = marching_cubes(
        mask.astype(np.float32), level=level, spacing=spacing, step_size=step_size
    )
    return verts, faces, normals


def smooth_mesh(vertices: np.ndarray, faces: np.ndarray, iterations: int = 5):
    """Lissage laplacien léger — indispensable après marching cubes, dont la
    sortie brute a un aspect 'en escalier' (artefact de la grille de voxels)."""
    import trimesh
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    trimesh.smoothing.filter_laplacian(mesh, iterations=iterations)
    return mesh


def export_mesh_glb(mesh, out_path: Path, color_rgba: tuple[int, int, int, int] = (200, 80, 80, 255)) -> Path:
    """Exporte un trimesh.Trimesh en .glb, avec une couleur uniforme appliquée
    (le frontend peut la recolorer, mais un GLB "brut" a besoin d'un matériau)."""
    import trimesh
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    mesh.visual.vertex_colors = np.tile(np.array(color_rgba, dtype=np.uint8), (len(mesh.vertices), 1))
    mesh.export(str(out_path), file_type="glb")
    return out_path


def export_mesh_stl(mesh, out_path: Path) -> Path:
    """Exporte en .stl (utile pour impression 3D pré-opératoire ou revue externe)."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(str(out_path), file_type="stl")
    return out_path


def mask_to_glb(mask: np.ndarray, out_path: Path, spacing=(1.0, 1.0, 1.0),
                 color_rgba=(200, 80, 80, 255), decimate_target_faces: Optional[int] = 30000) -> dict:
    """
    Pipeline complet : masque binaire → maillage lissé → GLB sur disque.
    Retourne des métadonnées utiles au frontend (nb triangles, volume estimé, bbox).
    """
    import trimesh

    verts, faces, _normals = mask_to_mesh(mask, spacing=spacing)
    mesh = smooth_mesh(verts, faces)

    if decimate_target_faces and len(mesh.faces) > decimate_target_faces:
        # face_count= est requis explicitement : le premier paramètre positionnel
        # de trimesh est `percent` (0.0-1.0) depuis le passage à fast-simplification,
        # pas un nombre de faces — un appel positionnel lève ValueError.
        mesh = mesh.simplify_quadric_decimation(face_count=decimate_target_faces)

    export_mesh_glb(mesh, out_path, color_rgba=color_rgba)

    return {
        "path": str(out_path),
        "num_vertices": int(len(mesh.vertices)),
        "num_faces": int(len(mesh.faces)),
        "volume_ml": float(abs(mesh.volume) / 1000.0) if mesh.is_watertight else None,
        "bbox_mm": mesh.bounds.tolist(),
        "watertight": bool(mesh.is_watertight),
    }


def nifti_label_to_glb(nifti_path: Path, label_value: int, out_path: Path,
                        color_rgba=(200, 80, 80, 255)) -> dict:
    """Extrait un label précis d'un NIfTI multi-label (sortie TotalSegmentator)
    et l'exporte en GLB. C'est la fonction appelée par segmentation_service.py
    après chaque inférence nnU-Net réussie."""
    import nibabel as nib

    img = nib.load(str(nifti_path))
    data = img.get_fdata()
    zooms = img.header.get_zooms()[:3]

    mask = (data == label_value)
    if mask.sum() == 0:
        raise ValueError(f"Label {label_value} absent du volume (masque vide).")

    return mask_to_glb(mask, out_path, spacing=zooms, color_rgba=color_rgba)


def _bounded_surface_points(mesh, max_points: int, rng: np.random.Generator):
    """Nuage de points de surface (vertices + points échantillonnés sur les
    triangles), sous-échantillonné aléatoirement à `max_points` si nécessaire.
    Sert de base à `surface_to_surface_min_distance` — voir sa docstring."""
    import trimesh

    n_extra = max(0, max_points - len(mesh.vertices))
    if n_extra > 0:
        extra, _ = trimesh.sample.sample_surface(mesh, n_extra)
        points = np.vstack([mesh.vertices, extra])
    else:
        points = np.asarray(mesh.vertices)

    if len(points) > max_points:
        idx = rng.choice(len(points), size=max_points, replace=False)
        points = points[idx]
    return points


def surface_to_surface_min_distance(mesh_a, mesh_b, max_points_per_side: int = 8000) -> dict:
    """
    Calcule une APPROXIMATION de la distance surface-à-surface minimale entre
    deux `trimesh.Trimesh`, en mm réels (les vertices produits par ce module
    sont déjà en coordonnées mm, calibrées sur le spacing DICOM/NIfTI).

    Méthode : pour chaque maillage, on constitue un nuage de points de surface
    (ses vertices + des points supplémentaires tirés uniformément sur ses
    triangles via `trimesh.sample.sample_surface`), plafonné à
    `max_points_per_side` points (sous-échantillonnage aléatoire au-delà,
    pour borner le temps de calcul quelle que soit la complexité du maillage
    — voir note de performance ci-dessous). Pour chaque point de ce nuage, on
    interroge la distance EXACTE au point le plus proche sur la surface
    triangulée continue de l'autre maillage via
    `trimesh.proximity.ProximityQuery.on_surface` (nécessite le paquet
    `rtree`). Le calcul est fait dans les deux sens (A→B et B→A) et on garde
    le minimum global — une tumeur peut être plus proche d'un point du réseau
    vasculaire non représenté côté vertices de l'autre maillage.

    Limites (importantes pour un usage clinique) :
      - Ce n'est PAS une distance solide-à-solide exacte (SDF volumique) :
        c'est une distance point-échantillonné → surface-exacte, donc une
        borne supérieure du vrai minimum. Chaque distance mesurée est réelle,
        mais une zone de quasi-tangence tombant entre deux points échantillonnés
        peut être légèrement surestimée.
      - Ne détecte pas une intersection/envahissement en tant que tel : si les
        deux maillages se recoupent, la distance retournée tend vers 0 mais ne
        lève aucune alerte "collision" dédiée.
      - Précision liée au nombre de points et à la densité de décimation du
        GLB source (voir `mask_to_glb`, `decimate_target_faces=30000` par défaut).

    Performance : mesuré à ~0.2 ms par point interrogé dans cet environnement —
    d'où le plafond `max_points_per_side=8000` (borne le calcul bidirectionnel
    complet à quelques secondes, adapté à un endpoint interrogé à la demande,
    pas à une boucle temps réel).
    """
    if len(mesh_a.faces) == 0 or len(mesh_b.faces) == 0:
        raise ValueError("Un des deux maillages est vide (0 triangle) : distance indéfinie.")

    import trimesh

    rng = np.random.default_rng(0)
    pts_a = _bounded_surface_points(mesh_a, max_points_per_side, rng)
    pts_b = _bounded_surface_points(mesh_b, max_points_per_side, rng)

    _, dist_a_to_b, _ = trimesh.proximity.ProximityQuery(mesh_b).on_surface(pts_a)
    _, dist_b_to_a, _ = trimesh.proximity.ProximityQuery(mesh_a).on_surface(pts_b)

    d_ab, d_ba = float(dist_a_to_b.min()), float(dist_b_to_a.min())
    return {
        "min_distance_mm": min(d_ab, d_ba),
        "direction_a_to_b_mm": d_ab,
        "direction_b_to_a_mm": d_ba,
        "n_points_a": int(len(pts_a)),
        "n_points_b": int(len(pts_b)),
        "method": "surface sampling (vertices + sample_surface, plafonné) "
                  "+ trimesh.proximity.ProximityQuery.on_surface, bidirectionnel",
    }


def mesh_distance_from_glb(path_a: Path, path_b: Path, max_points_per_side: int = 8000) -> dict:
    """Charge deux fichiers .glb et calcule leur distance surface-à-surface
    (voir `surface_to_surface_min_distance`). Lève `FileNotFoundError` si un
    chemin est absent."""
    import trimesh

    for p in (path_a, path_b):
        if not Path(p).is_file():
            raise FileNotFoundError(f"Fichier maillage introuvable : {p}")

    mesh_a = trimesh.load(str(path_a), force="mesh")
    mesh_b = trimesh.load(str(path_b), force="mesh")
    return surface_to_surface_min_distance(mesh_a, mesh_b, max_points_per_side=max_points_per_side)


def decimate_glb(in_path: Path, out_path: Path, target_faces: int,
                  color_rgba=(200, 80, 80, 255)) -> dict:
    """Charge un .glb déjà généré (par `mask_to_glb`/`nifti_label_to_glb`) et produit
    une variante nettement plus décimée. Utile pour un usage interactif temps réel
    (ex. simulation de déformation PBD côté frontend) où la fidélité complète du
    maillage n'est pas nécessaire et pénaliserait le framerate — voir
    segmentation_service.py (maillage bas-poly du foie pour l'onglet "Jumeau
    numérique" de index.html / assets/app-part*.js).

    Lève `FileNotFoundError` si `in_path` est absent.
    """
    import trimesh

    if not Path(in_path).is_file():
        raise FileNotFoundError(f"Fichier maillage introuvable : {in_path}")

    mesh = trimesh.load(str(in_path), force="mesh")
    if len(mesh.faces) > target_faces:
        mesh = mesh.simplify_quadric_decimation(face_count=target_faces)

    export_mesh_glb(mesh, out_path, color_rgba=color_rgba)

    return {
        "path": str(out_path),
        "num_vertices": int(len(mesh.vertices)),
        "num_faces": int(len(mesh.faces)),
        "volume_ml": float(abs(mesh.volume) / 1000.0) if mesh.is_watertight else None,
        "watertight": bool(mesh.is_watertight),
    }
