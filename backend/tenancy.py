# -*- coding: utf-8 -*-
"""
tenancy.py — Création d'institutions (tenants) à la création d'un utilisateur.

`models.User.institution_id` et `models.Patient.institution_id` sont NOT NULL
— chaque utilisateur doit appartenir à une institution dès sa création,
jamais après coup en silence. Ce module centralise la seule règle qui décide
comment cette valeur est obtenue, pour que les 4 points de création
d'utilisateur du dépôt (bootstrap-admin et seed démo dans main.py,
auto-inscription dans routers/auth.py, création admin dans routers/users.py)
ne divergent pas.

Voir deps.get_scoped_patient pour la vérification en lecture/écriture — ce
module ne fait qu'ATTRIBUER une institution, jamais vérifier l'accès. Voir
licensing.py pour l'entitlement (plan, sièges, modules) : une institution
flambant neuve reçoit ici une licence 'trial' par défaut (get_or_create_license)
pour qu'aucune institution ne puisse exister sans licence, même invalide.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

import licensing
import models


def resolve_institution_id(db: Session, *, institution_id: Optional[str] = None,
                            personal_institution_name: str) -> str:
    """Retourne l'`institution_id` à attribuer à un nouvel utilisateur.

    - `institution_id` fourni : valide qu'elle existe ET a un siège disponible
      (lève ValueError sinon) et la retourne telle quelle — cas d'un
      utilisateur qui REJOINT une institution existante (ex. un enseignant
      invité par l'administrateur d'une faculté déjà cliente). Le compte de
      seuil de sièges se fait AVANT l'insertion du nouvel utilisateur par
      l'appelant, donc `max_seats` compte bien le nouvel arrivant.
    - Sinon : crée une nouvelle institution "personal" (tenant à un seul
      utilisateur, cas par défaut — auto-inscription, comptes de démo,
      bootstrap-admin), lui attribue une licence 'trial' (1 siège, module
      'core' seulement), et retourne son id.
    """
    if institution_id:
        inst = db.get(models.Institution, institution_id)
        if inst is None:
            raise ValueError(f"institution_id inconnu : {institution_id}")
        lic = licensing.get_or_create_license(db, inst.id)
        if licensing.seat_count(db, inst.id) >= lic.max_seats:
            raise ValueError(
                f"Institution '{inst.name}' a atteint son quota de sièges ({lic.max_seats}, plan '{lic.plan}') "
                "— contactez un administrateur pour mettre à niveau la licence."
            )
        return inst.id

    inst = models.Institution(name=personal_institution_name, kind="personal")
    db.add(inst)
    db.flush()  # obtient inst.id sans committer — l'appelant gère sa propre transaction
    licensing.get_or_create_license(db, inst.id, plan="trial")
    return inst.id
