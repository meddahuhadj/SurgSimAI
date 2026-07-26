# -*- coding: utf-8 -*-
"""
routers/auth.py — Authentification : mot de passe, 2FA TOTP, inscription.

Endpoints exposés :
    POST /auth/token          (login — renvoie un JWT final ou requires_2fa)
    POST /auth/2fa/verify     (code TOTP/secours -> JWT final)
    POST /auth/2fa/setup      (génère secret + QR code)
    POST /auth/2fa/enable     (confirme l'enrôlement 2FA)
    POST /auth/2fa/disable
    POST /auth/register
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import security as sec
import resilience
from db import get_db
from deps import get_current_user, write_audit

router = APIRouter(tags=["auth"])


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TwoFARequiredResponse(BaseModel):
    requires_2fa: bool = True
    pre_auth_token: str


class TwoFAVerifyRequest(BaseModel):
    pre_auth_token: str
    code: str  # code TOTP à 6 chiffres, ou code de secours


class TwoFAEnableRequest(BaseModel):
    code: str


class TwoFADisableRequest(BaseModel):
    code: str


class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str | None = None


@router.post("/auth/token")
async def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Rate limiting (priorité sécurité, ajouté suite à l'audit) : aucune limite n'existait avant
    # sur cet endpoint, un brute-force du mot de passe n'était pas mitigé. Clé = IP appelante.
    client_ip = request.client.host if request.client else "unknown"
    resilience.AUTH_RATE_LIMITER.check(client_ip)

    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not sec.verify_password(form.password, user.hashed_password) or not user.is_active:
        write_audit(db, request, "Échec de connexion", "auth", user=None, niveau="warn", status_code=401,
                    metadata={"username_attempted": form.username})
        raise HTTPException(status_code=401, detail="Identifiants invalides.", headers={"WWW-Authenticate": "Bearer"})

    if user.totp_enabled:
        write_audit(db, request, "Mot de passe validé — 2FA requise", "auth", user=user, niveau="info")
        return TwoFARequiredResponse(pre_auth_token=sec.create_pre_auth_token(user.username))

    user.last_login_at = datetime.utcnow()
    db.commit()
    write_audit(db, request, "Connexion réussie (sans 2FA)", "auth", user=user, niveau="ok")
    token = sec.create_token(user.username, scope="full", extra={"role": user.role})
    return Token(access_token=token, expires_in=sec.JWT_TTL_MIN * 60)


@router.post("/auth/2fa/verify", response_model=Token)
async def verify_2fa(req: TwoFAVerifyRequest, request: Request, db: Session = Depends(get_db)):
    try:
        payload = sec.decode_token(req.pre_auth_token)
        if payload.get("scope") != "2fa_pending":
            raise JWTError()
    except JWTError:
        raise HTTPException(401, "Jeton pré-authentification invalide ou expiré.")

    user = db.query(models.User).filter(models.User.username == payload["sub"]).first()
    if not user or not user.totp_enabled:
        raise HTTPException(401, "Utilisateur introuvable ou 2FA non active.")

    ok = sec.verify_totp(user.totp_secret, req.code) or sec.verify_recovery_code(user.totp_recovery_codes, req.code)
    if not ok:
        write_audit(db, request, "Code 2FA invalide", "auth", user=user, niveau="warn", status_code=401)
        raise HTTPException(401, "Code de vérification invalide.")

    # Si un code de secours a été utilisé, on le retire (usage unique)
    hashed = sec.hash_recovery_code(req.code)
    if hashed in (user.totp_recovery_codes or []):
        user.totp_recovery_codes = [c for c in user.totp_recovery_codes if c != hashed]

    user.last_login_at = datetime.utcnow()
    db.commit()
    write_audit(db, request, "Connexion réussie (2FA validée)", "auth", user=user, niveau="ok")
    token = sec.create_token(user.username, scope="full", extra={"role": user.role})
    return Token(access_token=token, expires_in=sec.JWT_TTL_MIN * 60)


@router.post("/auth/2fa/setup")
async def setup_2fa(current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Étape 1 : génère un secret + QR code. La 2FA n'est PAS encore activée."""
    secret = sec.generate_totp_secret()
    current.totp_pending_secret = secret
    db.commit()
    uri = sec.totp_uri(current.username, secret)
    return {"secret": secret, "otpauth_uri": uri, "qr_png_base64": sec.totp_qr_png_base64(uri)}


@router.post("/auth/2fa/enable")
async def enable_2fa(req: TwoFAEnableRequest, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Étape 2 : confirme l'enrôlement avec un code généré depuis l'app d'authentification."""
    if not current.totp_pending_secret:
        raise HTTPException(400, "Aucun enrôlement 2FA en cours. Appelez /auth/2fa/setup d'abord.")
    if not sec.verify_totp(current.totp_pending_secret, req.code):
        raise HTTPException(400, "Code invalide. Vérifiez l'heure de votre appareil et réessayez.")

    current.totp_secret = current.totp_pending_secret
    current.totp_pending_secret = None
    current.totp_enabled = True
    codes = sec.generate_recovery_codes()
    current.totp_recovery_codes = [sec.hash_recovery_code(c) for c in codes]
    db.commit()
    write_audit(db, request, "2FA activée", "auth", user=current, niveau="ok")
    return {"enabled": True, "recovery_codes": codes,
            "warning": "Notez ces codes de secours maintenant — ils ne seront plus jamais affichés."}


@router.post("/auth/2fa/disable")
async def disable_2fa(req: TwoFADisableRequest, request: Request,
                       current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current.totp_enabled:
        raise HTTPException(400, "La 2FA n'est pas active.")
    if not (sec.verify_totp(current.totp_secret, req.code) or sec.verify_recovery_code(current.totp_recovery_codes, req.code)):
        raise HTTPException(400, "Code invalide.")
    current.totp_enabled = False
    current.totp_secret = None
    current.totp_recovery_codes = []
    db.commit()
    write_audit(db, request, "2FA désactivée", "auth", user=current, niveau="warn")
    return {"enabled": False}


@router.post("/auth/register")
async def register(creds: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == creds.username).first():
        raise HTTPException(400, "Utilisateur déjà existant.")
    if len(creds.password) < 8:
        raise HTTPException(400, "Mot de passe trop court (min 8 caractères).")
    db.add(models.User(
        username=creds.username, full_name=creds.full_name or creds.username,
        role="surgeon", hashed_password=sec.hash_password(creds.password),
    ))
    db.commit()
    return {"msg": "Utilisateur créé. Connectez-vous via /auth/token, puis activez la 2FA via /auth/2fa/setup."}
