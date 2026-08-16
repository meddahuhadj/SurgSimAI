# -*- coding: utf-8 -*-
"""
readiness.py — Production Readiness Dashboard : synthèse honnête de l'état de
préparation au déploiement, pour un opérateur avant une release/un pilote.

Ne réimplémente PAS les vérifications qui existent déjà ailleurs — les
regroupe et les complète :
  - /health, /readyz (main.py) : liveness/readiness bas niveau (probes k8s)
  - /compliance/mdr-dossier-status (routers/compliance.py) : posture
    réglementaire/sécurité (2FA, JWT, CI)
Ce module ajoute ce qui manque à une vue "puis-je déployer ceci en pilote
réel" : capacité de la file de segmentation, durabilité du stockage,
provisioning multi-tenant/licence, sauvegarde, observabilité.

Chaque `Check` porte un statut PARMI {"ok", "warning", "critical",
"not_implemented"} et une `evidence` qui explique le verdict — jamais un
✅/❌ sans justification vérifiable dans le code cité.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from sqlalchemy import inspect
from sqlalchemy.orm import Session

import models

STATUS_RANK = {"ok": 0, "not_implemented": 1, "warning": 2, "critical": 3}


@dataclass
class Check:
    id: str
    label: str
    status: str  # ok | warning | critical | not_implemented
    evidence: str
    category: str


@dataclass
class ReadinessReport:
    checks: List[Check] = field(default_factory=list)

    def add(self, id: str, label: str, status: str, evidence: str, category: str) -> None:
        if status not in STATUS_RANK:
            raise ValueError(f"Statut de check invalide : {status!r}")
        self.checks.append(Check(id=id, label=label, status=status, evidence=evidence, category=category))

    @property
    def worst_status(self) -> str:
        if not self.checks:
            return "ok"
        return max((c.status for c in self.checks), key=lambda s: STATUS_RANK[s])

    def to_dict(self) -> dict:
        by_status = {"ok": 0, "warning": 0, "critical": 0, "not_implemented": 0}
        for c in self.checks:
            by_status[c.status] += 1
        return {
            "overall_status": self.worst_status,
            "summary": by_status,
            "checks": [
                {"id": c.id, "label": c.label, "status": c.status, "evidence": c.evidence, "category": c.category}
                for c in self.checks
            ],
        }


def compute_readiness_report(db: Session) -> ReadinessReport:
    report = ReadinessReport()
    app_env = os.getenv("APP_ENV", "development").lower()

    # ── Sécurité ──────────────────────────────────────────────────────────
    import security as sec
    jwt_default = getattr(sec, "_JWT_SECRET_IS_DEFAULT", False)
    report.add(
        "jwt_secret", "Secret JWT",
        "critical" if (jwt_default and app_env == "production") else ("warning" if jwt_default else "ok"),
        "JWT_SECRET par défaut détecté" if jwt_default else "JWT_SECRET explicitement configuré",
        "security",
    )
    seed_demo = os.getenv("SEED_DEMO_USERS", "false").strip().lower() in ("1", "true", "yes")
    report.add(
        "demo_accounts", "Comptes de démonstration",
        "critical" if (seed_demo and app_env == "production") else ("warning" if seed_demo else "ok"),
        f"SEED_DEMO_USERS={seed_demo} (dr.hadj/dr.benali, mot de passe 'changeme' si actif)",
        "security",
    )
    research_mode = os.getenv("RESEARCH_MODE", "false").strip().lower() in ("1", "true", "yes")
    report.add(
        "exploratory_modules", "Modules exploratoires (BCI, nanorobotique...)",
        "critical" if (research_mode and app_env == "production") else "ok",
        f"RESEARCH_MODE={research_mode} — backend/exploratory/ {'chargé' if research_mode else 'non chargé'}",
        "security",
    )

    # ── Base de données ──────────────────────────────────────────────────
    from db import DATABASE_URL
    is_sqlite = DATABASE_URL.startswith("sqlite")
    report.add(
        "database_engine", "Moteur de base de données",
        "critical" if (is_sqlite and app_env == "production") else ("warning" if is_sqlite else "ok"),
        f"DATABASE_URL={'SQLite (fichier local, non concurrent-safe)' if is_sqlite else 'PostgreSQL'}",
        "database",
    )
    try:
        table_names = set(inspect(db.get_bind()).get_table_names())
        migration_ok = "institution_licenses" in table_names  # dernière migration connue à ce jour
        report.add(
            "migrations", "Migrations de schéma",
            "ok" if migration_ok else "critical",
            "Table 'institution_licenses' présente (dernière migration appliquée)" if migration_ok
            else "Table 'institution_licenses' absente — migrations non à jour, voir backend/migrations/",
            "database",
        )
    except Exception as e:  # noqa: BLE001
        report.add("migrations", "Migrations de schéma", "critical", f"Introspection impossible : {e}", "database")

    # ── Multi-tenant / licence ───────────────────────────────────────────
    try:
        n_institutions = db.query(models.Institution).count()
        n_licenses = db.query(models.InstitutionLicense).count()
        report.add(
            "multi_tenant_provisioning", "Provisioning multi-tenant",
            "ok" if n_institutions == n_licenses and n_institutions > 0 else
            ("warning" if n_institutions == 0 else "critical"),
            f"{n_institutions} institution(s), {n_licenses} licence(s) — "
            f"{'cohérent' if n_institutions == n_licenses else 'INCOHÉRENT (institution sans licence ?)'}",
            "licensing",
        )
    except Exception as e:  # noqa: BLE001
        report.add("multi_tenant_provisioning", "Provisioning multi-tenant", "critical", str(e), "licensing")

    # ── Segmentation IA ──────────────────────────────────────────────────
    try:
        import segmentation_service as seg
        max_workers = seg.EXECUTOR._max_workers  # noqa: SLF001 — pas d'API publique pour lire la taille du pool
        concurrency_note = ("une seule inférence GPU à la fois pour toute l'installation" if max_workers <= 1
                             else "plusieurs inférences en parallèle possibles")
        report.add(
            "segmentation_concurrency", "Concurrence de la file de segmentation",
            "ok" if max_workers > 1 else "warning",
            f"ThreadPoolExecutor(max_workers={max_workers}) — {concurrency_note}",
            "performance",
        )
        workdir_is_temp = "temp" in str(seg.WORKDIR).lower() or "tmp" in str(seg.WORKDIR).lower()
        durability_note = ("répertoire temporaire, peut être nettoyé par l'OS" if workdir_is_temp
                            else "chemin durable")
        report.add(
            "segmentation_storage_durability", "Durabilité du stockage de segmentation",
            "warning" if workdir_is_temp else "ok",
            f"WORKDIR={seg.WORKDIR} — {durability_note}",
            "performance",
        )
    except Exception as e:  # noqa: BLE001
        report.add("segmentation_concurrency", "Concurrence de la file de segmentation",
                    "not_implemented", f"Pipeline de segmentation non chargé : {e}", "performance")

    # ── Observabilité ────────────────────────────────────────────────────
    report.add(
        "metrics_export", "Export de métriques (Prometheus/OpenTelemetry)",
        "not_implemented",
        "Aucun endpoint /metrics ni tracing distribué dans ce dépôt à ce jour.",
        "observability",
    )
    report.add(
        "backup_restore", "Sauvegarde / restauration",
        "not_implemented",
        "Aucun mécanisme de backup automatisé dans ce dépôt — dépend entièrement de l'infra hébergeant PostgreSQL.",
        "observability",
    )

    # ── Validation clinique / réglementaire ──────────────────────────────
    validated_plans = db.query(models.SurgicalPlan).filter(models.SurgicalPlan.status == "validated").count()
    report.add(
        "clinical_validation", "Validation clinique (cohorte réelle)",
        "not_implemented",
        f"{validated_plans} plan(s) chirurgical(aux) validé(s) enregistré(s) — "
        "aucune étude de validation clinique formelle (Dice/HD95/TRE sur cohorte réelle) menée à ce jour, "
        "voir /compliance/clinical-evaluations/{patient_id} (nécessite des paires prédiction/référence réelles).",
        "clinical",
    )
    report.add(
        "regulatory_status", "Statut réglementaire MDR/FDA",
        "not_implemented",
        "NON_CERTIFIED / NOT_SUBMITTED — voir GET /api/v2/compliance/mdr-fda-status pour le détail à jour.",
        "clinical",
    )

    return report
