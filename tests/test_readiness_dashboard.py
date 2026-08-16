# -*- coding: utf-8 -*-
"""
test_readiness_dashboard.py — Vérifie GET /ops/readiness (backend/readiness.py) :
chaque check doit avoir un statut parmi {ok, warning, critical, not_implemented}
et une preuve vérifiable — jamais un ✅/❌ sans justification.
"""
from test_auth_patients_dicom import _demo_login, _register_and_login


def test_readiness_requires_admin_role(client):
    _, headers = _register_and_login(client)  # role="surgeon" par défaut
    r = client.get("/ops/readiness", headers=headers)
    assert r.status_code == 403


def test_readiness_requires_authentication(client):
    assert client.get("/ops/readiness").status_code == 401


def test_readiness_report_structure(client):
    admin_headers = _demo_login(client, "dr.hadj")
    r = client.get("/ops/readiness", headers=admin_headers)
    assert r.status_code == 200, r.text
    data = r.json()

    assert data["overall_status"] in ("ok", "warning", "critical", "not_implemented")
    assert set(data["summary"]) == {"ok", "warning", "critical", "not_implemented"}
    assert len(data["checks"]) > 5

    ids_seen = set()
    for check in data["checks"]:
        assert check["status"] in ("ok", "warning", "critical", "not_implemented")
        assert check["evidence"], f"check {check['id']} sans preuve"
        assert check["id"] not in ids_seen, f"id de check dupliqué : {check['id']}"
        ids_seen.add(check["id"])

    # Signaux attendus dans un environnement de test (SQLite, dev, pas de
    # migration Alembic appliquée — juste create_all) : reflète honnêtement
    # les limites de CET environnement, pas de faux "tout est vert".
    by_id = {c["id"]: c for c in data["checks"]}
    assert by_id["database_engine"]["status"] == "warning"  # SQLite en dev
    assert by_id["metrics_export"]["status"] == "not_implemented"
    assert by_id["backup_restore"]["status"] == "not_implemented"


def test_readiness_reflects_multi_tenant_provisioning(client):
    admin_headers = _demo_login(client, "dr.hadj")
    r = client.get("/ops/readiness", headers=admin_headers)
    by_id = {c["id"]: c for c in r.json()["checks"]}
    # Pas d'assertion de statut "ok" ici : `client` est un fixture de session
    # partagée entre TOUS les fichiers de test, et certains (ex.
    # test_or_planning._any_institution_id) créent des Institution directement
    # en DB sans licence, pour des besoins de test sans rapport avec le
    # multi-tenant — ce qui rend le statut global dépendant de l'ORDRE
    # d'exécution des autres fichiers, pas un vrai signal à verrouiller ici.
    # On vérifie seulement que le check est bien calculé sur des données réelles.
    check = by_id["multi_tenant_provisioning"]
    assert check["status"] in ("ok", "warning", "critical")
    assert "institution" in check["evidence"].lower()
    assert "licence" in check["evidence"].lower() or "licence" in check["label"].lower()
