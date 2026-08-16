# -*- coding: utf-8 -*-
"""
licensing.py — Catalogue de plans et vérification d'entitlement, au-dessus du
multi-tenant (models.Institution / models.InstitutionLicense).

Le multi-tenant (voir tenancy.py, deps.get_scoped_patient) répond à "quelles
données appartiennent à qui" — ce module répond à une question différente et
volontairement séparée : "qu'est-ce que cette institution a le droit
d'utiliser, et avec combien de sièges". Une institution existe indépendamment
d'avoir une licence active (provisioning), donc ces deux préoccupations
vivent dans des modèles séparés (Institution / InstitutionLicense).

⚠️ HONNÊTETÉ : ceci est un système d'ENTITLEMENT (quelles fonctions sont
autorisées, combien de sièges) — PAS un système de facturation. Aucun
paiement, aucune facture, aucune intégration Stripe/PSP n'existe dans ce
dépôt. `plan` est une étiquette que quelqu'un (un admin, ou un script de
provisioning) assigne manuellement après un accord commercial conclu
ailleurs — ce module ne sait pas si l'institution a payé.

Les noms de modules ci-dessous correspondent à des routers/fonctionnalités
RÉELLEMENT présents dans ce dépôt (pas des noms marketing inventés) :
  - core            : patients, plans chirurgicaux, volumétrie, segments
  - academic        : Voice-First (notes vocales, commandes), scoring/replay
                       frontend (Scenario Graph, AI Tutor/Examiner — assets/v2/)
  - research        : Mode Recherche (seeds, sessions, export dataset — voir
                       SURGSIM_RESEARCH_GUIDE.md et RESEARCH_MODE)
  - digital_twin    : TwinBiomech + solveur XPBD (routers/twin.py)
  - pacs            : PACS DICOMweb/DIMSE + export FHIR/HL7 (pacs_router.py,
                       pacs_router_v2.py, routers/dicom.py)
  - anesthesia_icu  : Dossier pré-anesthésique + suivi réanimation/USI
                       (routers/anesthesie.py)
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

import models

ALL_MODULES = ["core", "academic", "research", "digital_twin", "pacs", "anesthesia_icu"]

# Catalogue de plans : (max_seats, modules activés par défaut). Les chiffres
# de sièges sont des valeurs de départ raisonnables pour un pilote, pas un
# tarif validé marché — voir l'avertissement à ce sujet dans la conversation
# qui a motivé ce module (aucun prix n'a été validé avec de vrais clients).
PLAN_CATALOG: Dict[str, Dict] = {
    "trial": {
        "max_seats": 1,
        "modules": ["core"],
        "label": "Essai — solo, fonctions de base uniquement",
    },
    "academic_starter": {
        "max_seats": 5,
        "modules": ["core", "academic"],
        "label": "Academic Starter — petit laboratoire / enseignant",
    },
    "academic_institution": {
        "max_seats": 50,
        "modules": ["core", "academic", "research"],
        "label": "Academic Institution — faculté / centre de simulation",
    },
    "research_lab": {
        "max_seats": 30,
        "modules": ["core", "academic", "research", "digital_twin"],
        "label": "Research Lab — laboratoire de recherche",
    },
    "enterprise": {
        "max_seats": 500,
        "modules": ["core", "academic", "research", "digital_twin", "pacs", "anesthesia_icu"],
        "label": "Enterprise — établissement, tous modules",
    },
}


def default_license_kwargs(plan: str = "trial") -> dict:
    """Paramètres par défaut d'une nouvelle InstitutionLicense pour `plan`.
    Lève KeyError si `plan` est inconnu — jamais de repli silencieux sur un
    plan différent de celui demandé."""
    entry = PLAN_CATALOG[plan]
    return {"plan": plan, "max_seats": entry["max_seats"], "enabled_modules": list(entry["modules"])}


def get_or_create_license(db: Session, institution_id: str, plan: str = "trial") -> models.InstitutionLicense:
    """Retourne la licence de l'institution, ou en crée une nouvelle (plan
    `trial` par défaut) si aucune n'existe encore — cas normal juste après
    tenancy.resolve_institution_id pour une institution flambant neuve."""
    lic = db.query(models.InstitutionLicense).filter(
        models.InstitutionLicense.institution_id == institution_id
    ).first()
    if lic is not None:
        return lic
    lic = models.InstitutionLicense(institution_id=institution_id, **default_license_kwargs(plan))
    db.add(lic)
    db.flush()
    return lic


def is_license_valid(lic: Optional[models.InstitutionLicense]) -> bool:
    """Active ET non expirée. Une institution sans aucune licence (ne devrait
    pas arriver si get_or_create_license est toujours appelé à la création,
    mais une base migrée depuis avant ce module peut en manquer) est traitée
    comme invalide — jamais un accès par défaut faute de donnée."""
    if lic is None or not lic.is_active:
        return False
    if lic.expires_at is not None and lic.expires_at < datetime.utcnow():
        return False
    return True


def seat_count(db: Session, institution_id: str) -> int:
    return db.query(models.User).filter(models.User.institution_id == institution_id).count()


def has_seats_available(db: Session, institution_id: str, lic: Optional[models.InstitutionLicense] = None) -> bool:
    lic = lic or db.query(models.InstitutionLicense).filter(
        models.InstitutionLicense.institution_id == institution_id
    ).first()
    if lic is None:
        return False
    return seat_count(db, institution_id) < lic.max_seats


def has_module(lic: Optional[models.InstitutionLicense], module: str) -> bool:
    if module not in ALL_MODULES:
        raise ValueError(f"Module inconnu : {module!r} (connus : {ALL_MODULES}).")
    return is_license_valid(lic) and module in (lic.enabled_modules or [])
