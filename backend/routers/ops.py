# -*- coding: utf-8 -*-
"""
routers/ops.py — Production Readiness Dashboard.

Endpoint exposé :
    GET /ops/readiness   (rôle admin — révèle des détails d'infrastructure)

Voir backend/readiness.py pour la logique (séparée du router pour rester
testable sans TestClient). Ne duplique pas /health, /readyz
(main.py) ni /compliance/mdr-dossier-status (routers/compliance.py) : les
complète avec ce qui manquait à une vue "puis-je déployer ceci en pilote
réel" — concurrence de la segmentation, durabilité du stockage, provisioning
multi-tenant, observabilité, validation clinique.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import require_role
from readiness import compute_readiness_report

router = APIRouter(prefix="/ops", tags=["ops"])


@router.get("/readiness")
async def get_readiness(current: models.User = Depends(require_role("admin")),
                         db: Session = Depends(get_db)):
    return compute_readiness_report(db).to_dict()
