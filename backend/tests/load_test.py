# -*- coding: utf-8 -*-
"""
tests/load_test.py — Test de charge réel contre une instance du backend
===========================================================================
Contrairement à test_resilience.py (mocké, sans réseau), ce script tape pour
de vrai en HTTP sur un backend démarré (par défaut http://127.0.0.1:8000).
Il mesure ce qui compte en pratique pour un bloc opératoire : combien de
chirurgiens/postes peuvent consulter le dossier patient en même temps sans
dégradation notable.

Usage :
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    python3 tests/load_test.py --base-url http://127.0.0.1:8000 --concurrency 20 --requests 200

Limite assumée : ceci simule de la charge sur CE backend (auth, patients,
audit, PACS/capabilities) — pas sur des services tiers externes (Gemini/Groq/
PACS réel), injoignables depuis ce sandbox et non pertinents pour un test de
charge de toute façon (leur latence dépend d'eux, pas de nous).
"""
from __future__ import annotations

import argparse
import asyncio
import statistics
import time
from dataclasses import dataclass, field
from typing import List

import httpx


@dataclass
class EndpointResult:
    name: str
    latencies_ms: List[float] = field(default_factory=list)
    errors: int = 0

    def summary(self) -> str:
        if not self.latencies_ms:
            return f"{self.name}: aucune requête réussie ({self.errors} erreur(s))"
        s = sorted(self.latencies_ms)
        n = len(s)
        p50 = s[int(n * 0.50)]
        p95 = s[min(n - 1, int(n * 0.95))]
        p99 = s[min(n - 1, int(n * 0.99))]
        return (f"{self.name}: n={n} erreurs={self.errors} "
                f"| p50={p50:.0f}ms p95={p95:.0f}ms p99={p99:.0f}ms max={max(s):.0f}ms")


async def login(client: httpx.AsyncClient, username: str, password: str) -> str:
    r = await client.post("/auth/token", data={"username": username, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


async def timed_get(client: httpx.AsyncClient, path: str, headers: dict, result: EndpointResult):
    t0 = time.perf_counter()
    try:
        r = await client.get(path, headers=headers)
        dt = (time.perf_counter() - t0) * 1000
        if r.status_code >= 400:
            result.errors += 1
        else:
            result.latencies_ms.append(dt)
    except Exception:
        result.errors += 1


async def run_load_test(base_url: str, concurrency: int, total_requests: int,
                         username: str, password: str):
    async with httpx.AsyncClient(base_url=base_url, timeout=10) as client:
        print(f"[1/3] Authentification ({username})...")
        token = await login(client, username, password)
        headers = {"Authorization": f"Bearer {token}"}

        print(f"[2/3] Vérification de la disponibilité (/health)...")
        r = await client.get("/health", headers=headers)
        r.raise_for_status()
        print("      backend accessible:", r.json())

        print(f"[3/3] Charge : {total_requests} requêtes, concurrence={concurrency}")
        endpoints = {
            "/health": EndpointResult("/health"),
            "/patients": EndpointResult("/patients"),
            "/pacs/capabilities": EndpointResult("/pacs/capabilities"),
        }
        semaphore = asyncio.Semaphore(concurrency)

        async def one_request(path: str, result: EndpointResult):
            async with semaphore:
                await timed_get(client, path, headers, result)

        t_start = time.perf_counter()
        tasks = []
        paths = list(endpoints.keys())
        for i in range(total_requests):
            path = paths[i % len(paths)]
            tasks.append(one_request(path, endpoints[path]))
        await asyncio.gather(*tasks)
        wall_time = time.perf_counter() - t_start

        print()
        print("=" * 70)
        print(f"Durée totale : {wall_time:.2f}s pour {total_requests} requêtes "
              f"({total_requests / wall_time:.1f} req/s, concurrence={concurrency})")
        for ep in endpoints.values():
            print(" -", ep.summary())
        total_errors = sum(ep.errors for ep in endpoints.values())
        error_rate = total_errors / total_requests * 100
        print(f"Taux d'erreur global : {error_rate:.1f}% ({total_errors}/{total_requests})")
        print("=" * 70)
        return error_rate


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--concurrency", type=int, default=20)
    parser.add_argument("--requests", type=int, default=200)
    parser.add_argument("--username", default="dr.hadj")
    parser.add_argument("--password", default="changeme")
    args = parser.parse_args()
    asyncio.run(run_load_test(args.base_url, args.concurrency, args.requests, args.username, args.password))
