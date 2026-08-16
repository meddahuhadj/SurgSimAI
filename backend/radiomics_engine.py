# -*- coding: utf-8 -*-
"""
radiomics_engine.py — Moteur d'Extraction de Caractéristiques Radiomiques 3D Réelles.
===================================================================================
Calcule les descripteurs quantitatifs d'hétérogénéité tumorale et de santé parenchymateuse :
  - Statistiques de premier ordre (Moyenne, Écart-type, Skewness, Kurtosis, Énergie, Entropie)
  - Analyse de forme 3D (Volume Voxel, Sphericity, Surface Area, Ratio Surface/Volume)
  - Qualification du niveau d'hétérogénéité tissulaire (Faible, Modéré, Élevé).
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
import numpy as np


@dataclass
class RadiomicFeaturesResult:
    patient_id: str
    structure_id: str
    voxel_count: int
    volume_cm3: float
    surface_area_cm2: Optional[float]
    sphericity: Optional[float]
    shape_calculation_method: str
    mean_intensity_hu: float
    std_intensity_hu: float
    skewness: float
    kurtosis: float
    entropy: float
    heterogeneity_grade: str  # HOMOGENEOUS | MODERATE_HETEROGENEITY | HIGHLY_HETEROGENEOUS
    clinical_interpretation: str


def compute_radiomic_features_3d(
    patient_id: str,
    structure_id: str,
    voxel_intensities_hu: np.ndarray,
    voxel_spacing_mm: tuple = (1.0, 1.0, 1.0),
    segmentation_mask: Optional[np.ndarray] = None,
) -> RadiomicFeaturesResult:
    """
    Calcule les descripteurs radiomiques 3D réels sur les valeurs de gris en Unités Hounsfield (HU).

    `segmentation_mask` (masque 3D booléen de la structure, même grille que
    `voxel_spacing_mm`) est OPTIONNEL et sert uniquement aux descripteurs de
    FORME (surface_area_cm2, sphericity) : `voxel_intensities_hu` seul est un
    tableau 1D de valeurs de gris SANS position spatiale, donc structurellement
    insuffisant pour calculer une vraie surface.

    ⚠️ CORRIGÉ : cette fonction calculait auparavant une "sphéricité" via
    `estimated_surface = equivalent_sphere_surface * 1.25` — un facteur
    arbitraire sans justification, qui rendait `sphericity` mathématiquement
    ÉGALE À 1/1.25 = 0.8 pour absolument toutes les structures, quelle que
    soit leur forme réelle. C'était un nombre à décimales qui avait l'air
    calculé mais qui était en réalité une constante déguisée. Sans
    `segmentation_mask`, surface_area_cm2 et sphericity valent maintenant
    `None` — jamais une valeur inventée.
    """
    if len(voxel_intensities_hu) == 0:
        raise ValueError("Le tableau de voxels est vide.")

    v_count = len(voxel_intensities_hu)
    # float() défensif : un appelant peut fournir un spacing issu d'un header
    # NIfTI (nibabel renvoie des numpy.float32) — sans ce cast, l'arithmétique
    # ci-dessous produit des numpy.float32 que la sérialisation JSON de la
    # réponse HTTP (FastAPI/pydantic, voir routers/commercial_suite.py) ne
    # sait pas traiter comme des primitives.
    voxel_vol_mm3 = float(voxel_spacing_mm[0]) * float(voxel_spacing_mm[1]) * float(voxel_spacing_mm[2])
    vol_cm3 = round((v_count * voxel_vol_mm3) / 1000.0, 2)

    # 1. First order statistics
    mean_val = float(np.mean(voxel_intensities_hu))
    std_val = float(np.std(voxel_intensities_hu))

    # Skewness
    if std_val > 1e-6:
        skewness = float(np.mean(((voxel_intensities_hu - mean_val) / std_val) ** 3))
        kurtosis = float(np.mean(((voxel_intensities_hu - mean_val) / std_val) ** 4))
    else:
        skewness = 0.0
        kurtosis = 3.0

    # Entropy calculation
    hist, _ = np.histogram(voxel_intensities_hu, bins=32, density=True)
    hist = hist[hist > 0]
    entropy = float(-np.sum(hist * np.log2(hist)))

    # 2. Forme — sphéricité de Wadell : Ψ = surface d'une sphère de même volume
    # / surface RÉELLE de la structure. Nécessite la surface réelle (maillage
    # extrait du masque par marching cubes), pas une approximation arbitraire.
    v_mm3 = v_count * voxel_vol_mm3
    ideal_sphere_surface_mm2 = np.pi ** (1 / 3) * (6 * v_mm3) ** (2 / 3)

    surface_area_cm2: Optional[float] = None
    sphericity: Optional[float] = None
    shape_method = ("Non calculé : nécessite `segmentation_mask` (masque 3D binaire de la "
                     "structure) — `voxel_intensities_hu` seul n'a pas d'information de forme.")
    if segmentation_mask is not None:
        from mesh_export import mask_to_mesh
        import trimesh

        verts, faces, _normals = mask_to_mesh(segmentation_mask, spacing=voxel_spacing_mm)
        real_mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
        real_surface_mm2 = float(real_mesh.area)
        if real_surface_mm2 > 0:
            surface_area_cm2 = round(real_surface_mm2 / 100.0, 2)
            # Bornée à 1.0 : au pas de voxélisation, le bruit de marching cubes
            # peut légèrement sous-estimer la surface réelle d'une forme
            # quasi-sphérique et faire dépasser 1.0 la sphéricité idéale.
            sphericity = round(min(1.0, ideal_sphere_surface_mm2 / real_surface_mm2), 3)
        shape_method = ("Surface réelle extraite du masque par marching cubes "
                         "(mesh_export.mask_to_mesh) + trimesh.Trimesh.area.")

    # 3. Heterogeneity grading
    if std_val > 45.0 or entropy > 4.2:
        grade = "HIGHLY_HETEROGENEOUS"
        interp = "Hétérogénéité tissulaire marquée (Nécro-hémorragique ou composante mixte) — Surveillance d'invasion capsulaire requise."
    elif std_val > 25.0 or entropy > 3.0:
        grade = "MODERATE_HETEROGENEITY"
        interp = "Hétérogénéité tissulaire modérée — Structure solide parenchymateuse typique."
    else:
        grade = "HOMOGENEOUS"
        interp = "Structure uniforme et homogène (Compatible kyste ou lésion bénigne bien limitée)."

    return RadiomicFeaturesResult(
        patient_id=patient_id,
        structure_id=structure_id,
        voxel_count=v_count,
        volume_cm3=vol_cm3,
        surface_area_cm2=surface_area_cm2,
        sphericity=sphericity,
        shape_calculation_method=shape_method,
        mean_intensity_hu=round(mean_val, 1),
        std_intensity_hu=round(std_val, 1),
        skewness=round(skewness, 2),
        kurtosis=round(kurtosis, 2),
        entropy=round(entropy, 2),
        heterogeneity_grade=grade,
        clinical_interpretation=interp
    )
