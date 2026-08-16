# -*- coding: utf-8 -*-
"""
test_commercial_suite.py — Tests pour la suite commerciale hors certification (VetSurg3D, OR KPI, SurgData).
"""
import pytest
from test_auth_patients_dicom import _register_and_login


def test_vet_species_endpoint(client):
    r = client.get("/vet/species")
    assert r.status_code == 200
    data = r.json()
    assert "canine" in data
    assert "feline" in data
    assert "equine" in data


def test_vet_volumetrie_endpoint(client):
    _, headers = _register_and_login(client)
    res = client.post("/vet/volumetrie?species=canine&weight_kg=25.0&lesion_volume_ml=20.0", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["species"] == "canine"
    assert body["weight_kg"] == 25.0
    assert body["remnant_pct"] > 0
    assert "vétérinaire" in body["regulatory_notice"].lower()


def test_or_kpi_endpoint(client):
    _, headers = _register_and_login(client)
    res = client.get("/operations/kpi", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert "total_active_rooms" in body
    assert "or_occupancy_rate_pct" in body
    assert "estimated_monthly_overtime_cost_savings_eur" in body


def test_or_kpi_overtime_cost_defaults_to_labeled_placeholder(client):
    """Corrigé : le coût par créneau en heures supplémentaires était une
    constante (450€) présentée sans avertissement comme une économie réelle."""
    _, headers = _register_and_login(client)
    res = client.get("/operations/kpi", headers=headers)
    body = res.json()
    assert body["cost_is_placeholder"] is True
    assert body["overtime_cost_eur_per_slot"] == 450.0
    assert "placeholder" in body["disclaimer"].lower()


def test_or_kpi_overtime_cost_accepts_real_institution_value(client):
    _, headers = _register_and_login(client)
    res = client.get("/operations/kpi", params={"overtime_cost_eur_per_slot": 700.0}, headers=headers)
    body = res.json()
    assert body["cost_is_placeholder"] is False
    assert body["overtime_cost_eur_per_slot"] == 700.0
    assert "placeholder" not in body["disclaimer"].lower()


def test_radiomics_anonymized_export(client):
    """Sans job_id, l'endpoint reste utilisable (compat) mais doit désormais
    étiqueter explicitement des données synthétiques — corrigé : l'ancien
    comportement présentait un bruit gaussien comme un export de recherche
    sans jamais le dire."""
    from test_auth_patients_dicom import _patient_payload, _unique
    _, headers = _register_and_login(client)
    patient_id = _unique("pat")
    pat_res = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert pat_res.status_code == 201, pat_res.text

    res = client.post(f"/radiomics/anonymized-export/{patient_id}", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["anonymized_patient"]["nom"] == "ANONYMIZED_PATIENT"
    assert body["radiomic_features_3d"]["voxel_count"] > 0
    assert body["dataset_metadata"]["data_source"] == "SYNTHETIC_DEMO_RANDOM_HU_NOT_FROM_PATIENT_IMAGING"


def test_radiomics_anonymized_export_uses_real_job_when_provided(client):
    """Avec un job_id réel (segmentation terminée), l'export doit utiliser les
    vraies intensités HU du CT — pas du bruit gaussien — et l'annoncer."""
    nib = pytest.importorskip("nibabel")
    pytest.importorskip("trimesh")
    import numpy as np
    import segmentation_service as seg
    from test_auth_patients_dicom import _patient_payload, _unique

    _, headers = _register_and_login(client)
    patient_id = _unique("pat")
    pat_res = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert pat_res.status_code == 201, pat_res.text

    shape = (30, 30, 30)
    zz, yy, xx = np.indices(shape)
    center = np.array(shape) / 2.0
    mask = np.sqrt((zz - center[0]) ** 2 + (yy - center[1]) ** 2 + (xx - center[2]) ** 2) <= 8.0
    ct_data = np.where(mask, 120.0, 40.0).astype(np.float32)

    import tempfile
    tmp_dir = tempfile.mkdtemp(prefix="test_radiomics_export_")
    ct_path = f"{tmp_dir}/input.nii.gz"
    label_path = f"{tmp_dir}/liver_vessels.nii.gz"
    affine = np.eye(4)
    nib.save(nib.Nifti1Image(ct_data, affine), ct_path)
    nib.save(nib.Nifti1Image(mask.astype(np.float32), affine), label_path)

    job_id = _unique("job")
    seg._JOBS[job_id] = {
        "status": "done", "progress": "Terminé.", "result": {}, "error": None,
        "patient_id": patient_id, "input_nifti_path": ct_path,
        "label_sources": {"liver_tumor": {"nifti_path": label_path, "label_value": 1}},
    }
    try:
        res = client.post(f"/radiomics/anonymized-export/{patient_id}",
                           params={"job_id": job_id}, headers=headers)
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["dataset_metadata"]["data_source"] == "REAL_PATIENT_IMAGING_JOB"
        assert body["radiomic_features_3d"]["mean_intensity_hu"] == pytest.approx(120.0, abs=1.0)
    finally:
        seg._JOBS.pop(job_id, None)


def test_radiomics_anonymized_export_unknown_job_id_returns_404(client):
    from test_auth_patients_dicom import _patient_payload, _unique
    _, headers = _register_and_login(client)
    patient_id = _unique("pat")
    pat_res = client.post("/patients", json=_patient_payload(patient_id), headers=headers)
    assert pat_res.status_code == 201

    res = client.post(f"/radiomics/anonymized-export/{patient_id}",
                       params={"job_id": "does-not-exist"}, headers=headers)
    assert res.status_code == 404
