# -*- coding: utf-8 -*-
"""
test_geometry_compute_tradeoff.py — POST /api/v2/geometry/compute, en particulier
le score de compromis ajouté (`tradeoff`, voir clinical_scores.compute_resection_tradeoff_score)
qui relie le Scenario Graph du Mode Simulation (assets/v2/app-simulation.js) aux
scores hépatiques déjà réels de ce dépôt (Child-Pugh) plutôt que de rester une
simple métrique de volume isolée.
"""


def test_geometry_compute_default_flr_safe_gives_low_tradeoff_band(client):
    r = client.post("/api/v2/geometry/compute", json={
        "tumor_volume_ml": 20.0, "organ_volume_ml": 1450.0, "margin_mm": 10.0,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["tradeoff"] is not None
    assert data["tradeoff"]["risk_band"] == "low"
    assert data["tradeoff"]["components"]["child_pugh_class"] is None
    assert "flr_threshold_pct" in data["tradeoff"]


def test_geometry_compute_child_pugh_c_raises_tradeoff_band(client):
    payload = {"tumor_volume_ml": 20.0, "organ_volume_ml": 1450.0, "margin_mm": 10.0}
    safe = client.post("/api/v2/geometry/compute", json=payload).json()
    payload["child_pugh_class"] = "C"
    risky = client.post("/api/v2/geometry/compute", json=payload).json()

    assert risky["tradeoff"]["tradeoff_score"] > safe["tradeoff"]["tradeoff_score"]
    assert risky["tradeoff"]["risk_band"] == "high"


def test_geometry_compute_larger_margin_reduces_flr_and_raises_tradeoff(client):
    base = {"tumor_volume_ml": 20.0, "organ_volume_ml": 400.0}
    narrow = client.post("/api/v2/geometry/compute", json={**base, "margin_mm": 5.0}).json()
    wide = client.post("/api/v2/geometry/compute", json={**base, "margin_mm": 20.0}).json()

    assert wide["flr_pct"] < narrow["flr_pct"]
    assert wide["tradeoff"]["tradeoff_score"] >= narrow["tradeoff"]["tradeoff_score"]


def test_geometry_compute_tradeoff_is_none_without_organ_volume(client):
    r = client.post("/api/v2/geometry/compute", json={
        "tumor_volume_ml": 20.0, "organ_volume_ml": 0.0, "margin_mm": 10.0,
    })
    assert r.status_code == 200
    assert r.json()["tradeoff"] is None


def test_geometry_compute_vessel_margin_deficit_feeds_tradeoff(client):
    r = client.post("/api/v2/geometry/compute", json={
        "tumor_volume_ml": 20.0, "organ_volume_ml": 1450.0, "margin_mm": 10.0,
        "vessel_distance_mm": 3.0,
    })
    data = r.json()
    assert data["vessel_margin_deficit_mm"] == 7.0
    assert data["tradeoff"]["components"]["vessel_margin_deficit_mm"] == 7.0
    assert data["tradeoff"]["components"]["vessel_penalty_points"] == 14.0
