# -*- coding: utf-8 -*-
"""
routers/audit.py — Consultation du journal d'audit (réservé aux rôles admin/dpo).

Endpoint exposé :
    GET /audit
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import require_role

router = APIRouter(tags=["audit"])


class AuditOut(BaseModel):
    id: str
    username: Optional[str]
    patient_id: Optional[str]
    action: str
    resource: Optional[str]
    method: Optional[str]
    path: Optional[str]
    status_code: Optional[int]
    niveau: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/audit", response_model=List[AuditOut])
async def query_audit(patient_id: Optional[str] = None, username: Optional[str] = None, limit: int = 100,
                       current: models.User = Depends(require_role("admin", "dpo")), db: Session = Depends(get_db)):
    """Consultation du journal d'audit — réservé aux rôles admin/dpo (voir require_role)."""
    q = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc())
    if patient_id:
        q = q.filter(models.AuditLog.patient_id == patient_id)
    if username:
        q = q.filter(models.AuditLog.username == username)
    return q.limit(min(limit, 500)).all()
