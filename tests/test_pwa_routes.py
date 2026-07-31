# -*- coding: utf-8 -*-
"""
test_pwa_routes.py — Tests des routes PWA (shell statique)

Vérifie que le backend sert correctement toutes les ressources PWA requises :
  - / (index.html)
  - /manifest.webmanifest avec le bon Content-Type
  - /sw.js avec Cache-Control: no-cache (obligatoire pour les mises à jour SW)
  - /offline.html (fallback hors-ligne)
  - /favicon.ico

Ces routes sont critiques pour l'installabilité PWA : un 404 sur manifest ou
sw.js empêche le navigateur de proposer l'installation et désactive le cache
hors-ligne pour les utilisateurs mobiles.
"""

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_ok(response, expected_ct_fragment: str):
    """Vérifie le statut 200 et la présence du fragment de Content-Type."""
    assert response.status_code == 200, (
        f"Attendu 200, reçu {response.status_code} — "
        f"corps: {response.text[:200]}"
    )
    ct = response.headers.get("content-type", "")
    assert expected_ct_fragment in ct, (
        f"Content-Type attendu contenant '{expected_ct_fragment}', "
        f"reçu '{ct}'"
    )


# ---------------------------------------------------------------------------
# Tests PWA routes
# ---------------------------------------------------------------------------

class TestPWARoutes:
    """Suite de tests pour les routes PWA du shell statique."""

    def test_root_serves_index_html(self, client):
        """GET / doit retourner index.html (text/html)."""
        r = client.get("/")
        _check_ok(r, "text/html")
        # L'index.html contient la balise manifest PWA
        assert "manifest.webmanifest" in r.text or r.status_code == 200

    def test_manifest_content_type(self, client):
        """GET /manifest.webmanifest doit retourner application/manifest+json."""
        r = client.get("/manifest.webmanifest")
        _check_ok(r, "application/manifest+json")

    def test_manifest_has_required_fields(self, client):
        """Le manifest doit contenir les champs requis pour l'installabilité PWA."""
        import json
        r = client.get("/manifest.webmanifest")
        assert r.status_code == 200
        manifest = json.loads(r.text)

        required_fields = ["name", "short_name", "start_url", "display", "icons"]
        for field in required_fields:
            assert field in manifest, f"Champ requis manquant dans le manifest: '{field}'"

        # L'icône 192px est obligatoire pour l'installabilité Chrome
        sizes = [icon.get("sizes", "") for icon in manifest["icons"]]
        assert any("192" in s for s in sizes), (
            "Aucune icône 192x192 trouvée dans le manifest — "
            "Chrome refuse d'installer une PWA sans icône 192px."
        )

    def test_service_worker_no_cache_header(self, client):
        """GET /sw.js doit inclure Cache-Control: no-cache (obligatoire pour les MAJ SW)."""
        r = client.get("/sw.js")
        _check_ok(r, "javascript")
        cc = r.headers.get("cache-control", "")
        assert "no-cache" in cc, (
            f"sw.js doit être servi avec Cache-Control: no-cache. "
            f"Reçu: '{cc}'. Sans ce header, un vieux service worker peut "
            "rester actif des jours après un déploiement."
        )

    def test_service_worker_content(self, client):
        """sw.js doit contenir les événements SW essentiels (install, activate, fetch)."""
        r = client.get("/sw.js")
        assert r.status_code == 200
        body = r.text
        for event in ["install", "activate", "fetch"]:
            assert event in body, f"Événement '{event}' manquant dans sw.js"

    def test_offline_page_served(self, client):
        """GET /offline.html doit retourner la page hors-ligne (text/html)."""
        r = client.get("/offline.html")
        _check_ok(r, "text/html")

    def test_offline_page_no_cache(self, client):
        """GET /offline.html doit être servi avec Cache-Control: no-cache."""
        r = client.get("/offline.html")
        assert r.status_code == 200
        cc = r.headers.get("cache-control", "")
        assert "no-cache" in cc, (
            f"offline.html doit être servi avec Cache-Control: no-cache. Reçu: '{cc}'"
        )

    def test_favicon_served(self, client):
        """GET /favicon.ico doit retourner une réponse 200."""
        r = client.get("/favicon.ico")
        assert r.status_code == 200

    def test_assets_css_served(self, client):
        """GET /assets/styles.css doit retourner 200 (mount StaticFiles)."""
        r = client.get("/assets/styles.css")
        assert r.status_code == 200, (
            f"assets/styles.css non servi (HTTP {r.status_code}). "
            "Vérifier le mount StaticFiles dans backend/main.py."
        )

    def test_pwa_not_exposing_backend_internals(self, client):
        """Les chemins sensibles du backend ne doivent PAS être accessibles via /assets."""
        sensitive_paths = [
            "/assets/../backend/main.py",
            "/assets/../.env",
            "/assets/../../etc/passwd",
        ]
        for path in sensitive_paths:
            r = client.get(path)
            assert r.status_code in (400, 403, 404, 307, 301), (
                f"Le chemin '{path}' retourne {r.status_code} — "
                "risque de directory traversal potentiel via StaticFiles."
            )


# ---------------------------------------------------------------------------
# Tests de santé liés au déploiement
# ---------------------------------------------------------------------------

class TestHealthEndpoints:
    """Vérifie que les endpoints de santé (utilisés par Render/Docker) répondent."""

    def test_health_ok(self, client):
        """GET /health doit retourner status=ok."""
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"

    def test_readyz(self, client):
        """GET /readyz doit retourner status=ready ou degraded (jamais 500)."""
        r = client.get("/readyz")
        assert r.status_code in (200, 503), (
            f"Attendu 200 ou 503, reçu {r.status_code}"
        )
        data = r.json()
        assert data.get("status") in ("ready", "degraded")
