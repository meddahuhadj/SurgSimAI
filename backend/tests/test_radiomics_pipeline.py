# -*- coding: utf-8 -*-
"""
tests/test_radiomics_pipeline.py — Vérifie backend/radiomics_pipeline.py, qui
relie la segmentation IA réelle (segmentation_service.py) au moteur radiomique
(radiomics_engine.py) sur de vraies intensités HU, pas des voxels
`np.random.normal(...)` — voir l'historique de
routers/commercial_suite.py::export_anonymized_radiomics_dataset.

Aucun vrai TotalSegmentator n'est nécessaire ici : on fabrique un CT
synthétique (une sphère à contraste connu dans un fond à contraste connu) et
on simule un job de segmentation "terminé" directement dans
`segmentation_service._JOBS`, comme test_twin_pipeline.py le fait déjà pour
le pipeline biomécanique.

Lancer : cd backend && pytest tests/test_radiomics_pipeline.py -v
"""
import sys
from pathlib import Path

import numpy as np
import pytest

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

nib = pytest.importorskip("nibabel")
pytest.importorskip("trimesh")

import segmentation_service as seg  # noqa: E402
import radiomics_pipeline  # noqa: E402


LESION_HU = 120.0
BACKGROUND_HU = 40.0


def _make_synthetic_job(tmp_path: Path, radius: float = 10.0, shape=(40, 40, 40),
                         spacing=(1.5, 1.5, 1.5), patient_id: str = "pat-radiomics-01") -> tuple[str, str]:
    """Fabrique un CT synthétique (sphère à LESION_HU dans un fond à
    BACKGROUND_HU) + son masque de label (1 = lésion), et les enregistre comme
    job de segmentation 'terminé' — reproduit ce que produirait
    `_run_segmentation_job` une fois l'inférence réelle terminée."""
    zz, yy, xx = np.indices(shape)
    center = np.array(shape) / 2.0
    dist = np.sqrt((zz - center[0]) ** 2 + (yy - center[1]) ** 2 + (xx - center[2]) ** 2)
    mask = dist <= radius

    ct_data = np.full(shape, BACKGROUND_HU, dtype=np.float32)
    ct_data[mask] = LESION_HU
    label_data = mask.astype(np.float32)  # label 1 = "liver_tumor"

    affine = np.diag([*spacing, 1.0])
    ct_path = tmp_path / "input.nii.gz"
    label_path = tmp_path / "liver_vessels.nii.gz"
    nib.save(nib.Nifti1Image(ct_data, affine), str(ct_path))
    nib.save(nib.Nifti1Image(label_data, affine), str(label_path))

    job_id = "test_radiomics_job_" + tmp_path.name
    seg._JOBS[job_id] = {
        "status": "done",
        "progress": "Terminé.",
        "result": {},
        "error": None,
        "patient_id": patient_id,
        "input_nifti_path": str(ct_path),
        "label_sources": {"liver_tumor": {"nifti_path": str(label_path), "label_value": 1}},
    }
    return job_id, "liver_tumor"


@pytest.fixture(autouse=True)
def _cleanup_jobs():
    yield
    seg._JOBS.clear()


def test_compute_real_radiomics_uses_actual_ct_intensities_not_random(tmp_path):
    job_id, structure = _make_synthetic_job(tmp_path)

    result = radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure)

    # Les intensités viennent du CT synthétique connu (LESION_HU constant à
    # l'intérieur du masque) — pas d'un bruit gaussien aléatoire sans rapport.
    assert result.mean_intensity_hu == pytest.approx(LESION_HU, abs=0.5)
    assert result.std_intensity_hu == pytest.approx(0.0, abs=0.5)  # intensité constante -> homogène
    assert result.heterogeneity_grade == "HOMOGENEOUS"
    assert result.patient_id == "pat-radiomics-01"
    assert result.structure_id == structure


def test_compute_real_radiomics_computes_real_sphericity_not_a_constant(tmp_path):
    job_id, structure = _make_synthetic_job(tmp_path, radius=10.0)
    result = radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure)

    assert result.sphericity is not None
    assert result.sphericity > 0.85  # vraie sphère -> proche de 1, pas 0.8 fixe
    assert result.surface_area_cm2 is not None


def test_compute_real_radiomics_downsamples_large_structures(tmp_path):
    job_id, structure = _make_synthetic_job(tmp_path, radius=15.0, shape=(50, 50, 50))
    result = radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure, max_voxels=500)
    assert result.voxel_count == 500


def test_compute_real_radiomics_unknown_job_raises_key_error():
    with pytest.raises(KeyError):
        radiomics_pipeline.compute_real_radiomics_for_structure("does-not-exist", "liver_tumor")


def test_compute_real_radiomics_job_not_done_raises_value_error(tmp_path):
    job_id, structure = _make_synthetic_job(tmp_path)
    seg._JOBS[job_id]["status"] = "running"
    with pytest.raises(ValueError):
        radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure)


def test_compute_real_radiomics_missing_ct_raises_file_not_found(tmp_path):
    job_id, structure = _make_synthetic_job(tmp_path)
    Path(seg._JOBS[job_id]["input_nifti_path"]).unlink()
    with pytest.raises(FileNotFoundError):
        radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure)


def test_compute_real_radiomics_missing_input_nifti_path_raises_file_not_found(tmp_path):
    """Job antérieur au correctif (pas de input_nifti_path enregistré) — doit
    échouer honnêtement, pas retomber sur des voxels fabriqués."""
    job_id, structure = _make_synthetic_job(tmp_path)
    del seg._JOBS[job_id]["input_nifti_path"]
    with pytest.raises(FileNotFoundError):
        radiomics_pipeline.compute_real_radiomics_for_structure(job_id, structure)
