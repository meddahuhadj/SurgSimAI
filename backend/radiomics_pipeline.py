# -*- coding: utf-8 -*-
"""
radiomics_pipeline.py — Relie la segmentation IA réelle (segmentation_service.py)
au moteur radiomique (radiomics_engine.py) : calcule de VRAIES caractéristiques
radiomiques à partir des intensités Hounsfield réelles du CT source et du
masque réel d'une structure déjà segmentée pour un job donné.

Miroir de twin_pipeline.py (même dépendance à segmentation_service._JOBS /
get_job_or_raise / get_label_source), pour la même raison : jusqu'ici,
`radiomics_engine.compute_radiomic_features_3d` n'était appelée qu'avec des
intensités de voxels FABRIQUÉES (`np.random.normal(...)`, voir l'historique
de routers/commercial_suite.py::export_anonymized_radiomics_dataset) — jamais
sur les vraies valeurs de gris d'un patient réel, alors que le pipeline de
segmentation réel produit déjà tout ce qu'il faut :
  - le CT source (`job["input_nifti_path"]`, intensités HU réelles)
  - le masque de label prédit (`job["label_sources"][structure]`)

⚠️ Limite honnête (héritée de twin_pipeline.py) : `segmentation_service.WORKDIR`
est un répertoire TEMPORAIRE — un job ancien peut avoir été nettoyé par l'OS,
auquel cas les fichiers NIfTI source ne sont plus sur disque.
"""

from __future__ import annotations

import numpy as np

from radiomics_engine import RadiomicFeaturesResult, compute_radiomic_features_3d

import segmentation_service as seg


def compute_real_radiomics_for_structure(job_id: str, structure: str,
                                          max_voxels: int = 200_000) -> RadiomicFeaturesResult:
    """Calcule les caractéristiques radiomiques RÉELLES de `structure` pour ce
    job, à partir du CT source (`job["input_nifti_path"]`) et du masque de
    label réellement prédit (`job["label_sources"][structure]`) — jamais des
    intensités générées aléatoirement.

    `max_voxels` sous-échantillonne aléatoirement (seed fixe, reproductible)
    si la structure dépasse ce nombre de voxels — les statistiques d'intensité
    (moyenne, écart-type, skewness, kurtosis, entropie) sont stables sur un
    grand échantillon, et ceci borne le coût mémoire/temps pour de gros
    organes sans changer la méthode.

    Lève KeyError si le job/la structure sont inconnus, ValueError si le job
    n'est pas terminé ou si le masque prédit est vide pour cette structure,
    FileNotFoundError si le CT source ou le NIfTI de label ne sont plus sur
    disque (job nettoyé — voir avertissement en tête de module)."""
    import nibabel as nib

    job = seg.get_job_or_raise(job_id)
    label_source = seg.get_label_source(job_id, structure)

    input_nifti_path = job.get("input_nifti_path")
    if not input_nifti_path:
        raise FileNotFoundError(
            f"Aucun CT source enregistré pour le job {job_id} (job antérieur à ce correctif, "
            "ou pipeline exécuté sans passer par _run_segmentation_job)."
        )
    from pathlib import Path
    ct_path = Path(input_nifti_path)
    label_path = Path(label_source["nifti_path"])
    for p in (ct_path, label_path):
        if not p.is_file():
            raise FileNotFoundError(
                f"Fichier NIfTI introuvable : {p} — ce job a peut-être été nettoyé "
                f"(WORKDIR est un répertoire temporaire, voir segmentation_service.WORKDIR)."
            )

    ct_img = nib.load(str(ct_path))
    ct_data = ct_img.get_fdata()
    # nibabel renvoie des zooms en numpy.float32 (type de stockage du header
    # NIfTI) — castés en float Python natif ici, sinon l'arithmétique de
    # compute_radiomic_features_3d (volume, surface) produit des numpy.float32
    # qui font échouer la sérialisation JSON de la réponse HTTP (voir
    # routers/commercial_suite.py, jsonable_encoder ne sait pas les traiter
    # comme des primitives).
    zooms = tuple(float(z) for z in ct_img.header.get_zooms()[:3])

    label_img = nib.load(str(label_path))
    label_data = label_img.get_fdata()
    if label_data.shape != ct_data.shape:
        raise ValueError(
            f"Le masque de label ({label_data.shape}) et le CT source ({ct_data.shape}) "
            "n'ont pas la même grille — impossible d'indexer les intensités réelles sous ce masque."
        )

    mask = label_data == label_source["label_value"]
    if not mask.any():
        raise ValueError(f"Masque vide pour la structure '{structure}' — aucune intensité réelle à analyser.")

    voxel_intensities_hu = ct_data[mask]
    if len(voxel_intensities_hu) > max_voxels:
        rng = np.random.default_rng(0)
        idx = rng.choice(len(voxel_intensities_hu), size=max_voxels, replace=False)
        voxel_intensities_hu = voxel_intensities_hu[idx]

    return compute_radiomic_features_3d(
        patient_id=job.get("patient_id", ""),
        structure_id=structure,
        voxel_intensities_hu=voxel_intensities_hu,
        voxel_spacing_mm=tuple(zooms),
        segmentation_mask=mask,
    )
