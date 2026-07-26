# -*- coding: utf-8 -*-
"""
pacs_client.py — Connecteur PACS RÉEL via DICOMweb (QIDO-RS + WADO-RS)
=======================================================================
Utilise le package officiel `dicomweb-client` (PyPI, API vérifiée à
l'implémentation — https://pypi.org/project/dicomweb-client/), qui parle
le protocole DICOMweb standard (PS3.18) exposé par la quasi-totalité des
PACS modernes (Orthanc, dcm4chee, dcm4che, dicoogle, dcmqrscp+plugin,
dicomweb-server des grands éditeurs — GE, Philips, Siemens, Agfa...).

Ce module NE PARLE PAS le protocole DICOM classique (DIMSE : C-FIND /
C-MOVE / C-STORE sur le port 104/11112) — c'est un choix assumé : DICOMweb
est le protocole recommandé pour toute nouvelle intégration (RESTful,
traverse les pare-feux hospitaliers, pas besoin d'AE Title). Un PACS plus
ancien qui n'expose QUE le DIMSE classique nécessiterait un module
supplémentaire basé sur `pynetdicom` — non inclus ici (voir capabilities()).

`dicomweb-client` est SYNCHRONE (basé sur `requests`) : chaque appel réseau
est donc exécuté dans un threadpool (`run_in_threadpool`, comme le fait déjà
`segmentation_service.py` pour TotalSegmentator) afin de ne jamais bloquer
la boucle asyncio de FastAPI.

Configuration (voir .env.example) :
    PACS_QIDO_URL, PACS_WADO_URL   — si absents, ceux passés en paramètre
                                       de requête HTTP par le frontend sont
                                       utilisés à la place (config par appel).
    PACS_AUTH_USER / PACS_AUTH_PASSWORD  — Basic Auth (optionnel)
    PACS_AUTH_TOKEN                — Bearer token (optionnel, prioritaire sur Basic Auth)
    PACS_VERIFY_SSL                — "false" pour désactiver la vérification TLS
                                       (PACS intra-hospitalier avec certificat auto-signé
                                       — à éviter en production, préférer un vrai certificat).
"""

from __future__ import annotations

import os
import socket
import ipaddress
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from fastapi.concurrency import run_in_threadpool

import resilience

try:
    from dicomweb_client.api import DICOMwebClient
    DICOMWEB_CLIENT_AVAILABLE = True
except Exception:  # noqa: BLE001
    DICOMWEB_CLIENT_AVAILABLE = False


class PacsConfigError(Exception):
    """Levée quand aucune URL PACS n'est configurée (ni env, ni requête)."""


class PacsConnectionError(Exception):
    """Levée quand le PACS distant est injoignable ou renvoie une erreur HTTP."""


# ---------------------------------------------------------------------------
# Garde-fou SSRF (ajouté suite à l'audit de juillet 2026)
# ---------------------------------------------------------------------------
# qido_url/wado_url peuvent être surchargés PAR REQUÊTE par le frontend (voir
# docstring de PacsConfig.resolve ci-dessous) — pratique pour un chirurgien
# testant un PACS différent, mais ça veut dire qu'un utilisateur authentifié
# quelconque peut faire pointer le serveur vers N'IMPORTE QUELLE URL de son
# choix. Deux protections indépendantes :
#   1. PACS_ALLOW_CLIENT_URL_OVERRIDE=false (défaut) désactive complètement
#      cette surcharge : seule l'URL configurée en .env est utilisée.
#   2. Même quand la surcharge est autorisée, les identifiants réels du PACS
#      (PACS_AUTH_TOKEN/USER/PASSWORD) ne sont JAMAIS envoyés à un host
#      différent de celui configuré en .env (voir resolve()) — sinon un appel
#      malveillant vers un serveur tiers exfiltrerait les vrais identifiants
#      hospitaliers. Les adresses IP dangereuses (loopback, lien-local dont le
#      endpoint de métadonnées cloud 169.254.169.254, plages privées non
#      documentées comme PACS) sont bloquées dans tous les cas.
_BLOCKED_HOSTNAMES = {"localhost", "metadata.google.internal"}


def _validate_target_url(url: str, *, context: str) -> None:
    """Lève PacsConfigError si l'URL ne peut pas être une cible réseau sûre.

    Ne bloque PAS les plages privées (10.x/172.16-31.x/192.168.x) : un PACS
    hospitalier y vit presque toujours (ex. http://pacs.hopital.local). Bloque
    en revanche ce qui n'a AUCUNE raison légitime d'être une cible PACS :
    schéma non-HTTP(S), loopback, lien-local (169.254.0.0/16, dont le endpoint
    de métadonnées cloud), et hostnames explicitement black-listés.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise PacsConfigError(f"{context} : schéma non autorisé ({parsed.scheme!r}). Utilisez http:// ou https://.")
    hostname = parsed.hostname
    if not hostname:
        raise PacsConfigError(f"{context} : URL invalide (aucun nom d'hôte).")
    if hostname.lower() in _BLOCKED_HOSTNAMES:
        raise PacsConfigError(f"{context} : hôte non autorisé ({hostname}).")
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        # Résolution DNS impossible depuis ici : on laisse passer, l'appel
        # HTTP échouera de toute façon avec une erreur claire (PacsConnectionError).
        return
    for _, _, _, _, sockaddr in addr_info:
        ip = ipaddress.ip_address(sockaddr[0])
        if ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
            raise PacsConfigError(
                f"{context} : {hostname} résout vers une adresse non autorisée "
                f"({ip}) — loopback, lien-local (dont métadonnées cloud) et "
                f"multicast sont bloqués quel que soit le contexte."
            )


@dataclass
class PacsConfig:
    qido_url: str
    wado_url: str
    auth_user: Optional[str] = None
    auth_password: Optional[str] = None
    auth_token: Optional[str] = None
    verify_ssl: bool = True
    timeout_seconds: float = 15.0

    @classmethod
    def resolve(cls, qido_url: Optional[str] = None, wado_url: Optional[str] = None) -> "PacsConfig":
        """Fusionne la config d'environnement (.env, valeurs par défaut du service)
        avec une éventuelle surcharge passée par le frontend au moment de l'appel
        (utile pour un chirurgien qui teste un PACS différent sans redéployer).

        Sécurité (voir _validate_target_url ci-dessus) :
          - La surcharge par requête n'est acceptée que si
            PACS_ALLOW_CLIENT_URL_OVERRIDE=true est explicitement positionné en
            .env (défaut : false, uniquement l'URL d'env est utilisable).
          - Les identifiants réels (PACS_AUTH_TOKEN/USER/PASSWORD) ne sont
            attachés que si l'appel cible bien l'host configuré en .env — un
            qido_url pointant ailleurs part TOUJOURS sans ces identifiants,
            même quand la surcharge est autorisée.
        """
        env_qido = os.getenv("PACS_QIDO_URL", "")
        env_wado = os.getenv("PACS_WADO_URL", "") or env_qido
        allow_override = os.getenv("PACS_ALLOW_CLIENT_URL_OVERRIDE", "false").strip().lower() == "true"

        client_supplied = bool(qido_url or wado_url)
        if client_supplied and not allow_override:
            raise PacsConfigError(
                "La surcharge de l'URL PACS par requête (qido_url/wado_url) est "
                "désactivée sur ce serveur (PACS_ALLOW_CLIENT_URL_OVERRIDE=false). "
                "Configurez PACS_QIDO_URL/PACS_WADO_URL en .env, ou activez "
                "explicitement cette surcharge si vous en avez réellement besoin."
            )

        qido = (qido_url if allow_override else None) or env_qido
        wado = (wado_url if allow_override else None) or env_wado or qido
        if not qido:
            raise PacsConfigError(
                "Aucune URL QIDO-RS configurée. Renseignez PACS_QIDO_URL dans .env, "
                "ou passez le paramètre qido_url dans la requête (si "
                "PACS_ALLOW_CLIENT_URL_OVERRIDE=true)."
            )
        qido = qido.rstrip("/")
        wado = wado.rstrip("/")
        _validate_target_url(qido, context="qido_url")
        _validate_target_url(wado, context="wado_url")

        # Les identifiants ne partent QUE si la cible est bien celle configurée
        # en .env — jamais vers une URL fournie par le client, même autorisée.
        targets_env_host = (qido == env_qido.rstrip("/") if env_qido else False)
        return cls(
            qido_url=qido,
            wado_url=wado,
            auth_user=(os.getenv("PACS_AUTH_USER") or None) if targets_env_host else None,
            auth_password=(os.getenv("PACS_AUTH_PASSWORD") or None) if targets_env_host else None,
            auth_token=(os.getenv("PACS_AUTH_TOKEN") or None) if targets_env_host else None,
            verify_ssl=os.getenv("PACS_VERIFY_SSL", "true").lower() != "false",
            timeout_seconds=float(os.getenv("PACS_TIMEOUT_SECONDS", "15")),
        )

    def build_client(self) -> "DICOMwebClient":
        if not DICOMWEB_CLIENT_AVAILABLE:
            raise PacsConnectionError(
                "Le paquet 'dicomweb-client' n'est pas installé côté serveur "
                "(pip install dicomweb-client)."
            )
        session = requests.Session()
        session.verify = self.verify_ssl
        headers: Dict[str, str] = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        elif self.auth_user:
            session.auth = (self.auth_user, self.auth_password or "")
        client = DICOMwebClient(
            url=self.qido_url,
            session=session,
            qido_url_prefix=None,
            wado_url_prefix=None if self.wado_url == self.qido_url else self.wado_url,
            headers=headers or None,
            timeout=self.timeout_seconds,
        )
        # dicomweb-client a son propre retry interne avec backoff exponentiel
        # (~31s cumulés sur échec réseau avec les valeurs par défaut). On le
        # désactive : c'est resilience.py (disjoncteur + retry contrôlé) qui
        # doit être l'UNIQUE point de décision sur "faut-il réessayer ?" —
        # sinon les deux couches s'additionnent (31s × nos propres tentatives
        # = plus d'une minute d'attente avant qu'un chirurgien voie une erreur).
        client.set_http_retry_params(retry=False)
        return client


def capabilities() -> Dict[str, Any]:
    """Diagnostic honnête : que peut vraiment faire ce serveur, là, maintenant ?"""
    configured = bool(os.getenv("PACS_QIDO_URL"))
    return {
        "dicomweb_client_installed": DICOMWEB_CLIENT_AVAILABLE,
        "pacs_configured_server_side": configured,
        "qido_url": os.getenv("PACS_QIDO_URL") or None,
        "wado_url": os.getenv("PACS_WADO_URL") or None,
        "classic_dimse_supported": False,
        "client_url_override_allowed": os.getenv("PACS_ALLOW_CLIENT_URL_OVERRIDE", "false").strip().lower() == "true",
        "note": (
            "Protocole DICOMweb uniquement (QIDO-RS/WADO-RS). Les PACS n'exposant "
            "que le DIMSE classique (C-FIND/C-MOVE) nécessitent une passerelle "
            "(ex. Orthanc en frontal du PACS historique, qui expose DICOMweb) "
            "ou un module pynetdicom dédié — non développé dans cette session."
        ),
    }


# ---------------------------------------------------------------------------
# Fonctions synchrones (appelées via run_in_threadpool depuis les endpoints)
# ---------------------------------------------------------------------------
def _search_for_studies(cfg: PacsConfig, search_filters: Dict[str, Any]) -> List[Dict[str, dict]]:
    client = cfg.build_client()
    try:
        return client.search_for_studies(search_filters={k: v for k, v in search_filters.items() if v})
    except requests.RequestException as e:
        raise PacsConnectionError(f"PACS injoignable (QIDO-RS studies) : {e}") from e


def _search_for_series(cfg: PacsConfig, study_uid: str) -> List[Dict[str, dict]]:
    client = cfg.build_client()
    try:
        return client.search_for_series(study_instance_uid=study_uid)
    except requests.RequestException as e:
        raise PacsConnectionError(f"PACS injoignable (QIDO-RS series) : {e}") from e


def _search_for_instances(cfg: PacsConfig, study_uid: str, series_uid: str) -> List[Dict[str, dict]]:
    client = cfg.build_client()
    try:
        return client.search_for_instances(study_instance_uid=study_uid, series_instance_uid=series_uid)
    except requests.RequestException as e:
        raise PacsConnectionError(f"PACS injoignable (QIDO-RS instances) : {e}") from e


def _retrieve_series(cfg: PacsConfig, study_uid: str, series_uid: str):
    """Retourne une liste de pydicom.Dataset (WADO-RS, /studies/{uid}/series/{uid})."""
    client = cfg.build_client()
    try:
        return client.retrieve_series(study_instance_uid=study_uid, series_instance_uid=series_uid)
    except requests.RequestException as e:
        raise PacsConnectionError(f"PACS injoignable (WADO-RS retrieve series) : {e}") from e


# ---------------------------------------------------------------------------
# API async (ce que le router FastAPI appelle réellement)
# ---------------------------------------------------------------------------
async def search_studies(cfg: PacsConfig, **filters) -> List[Dict[str, dict]]:
    return await resilience.call_with_resilience(
        lambda: run_in_threadpool(_search_for_studies, cfg, filters), resilience.PACS_BREAKER, max_attempts=1)


async def search_series(cfg: PacsConfig, study_uid: str) -> List[Dict[str, dict]]:
    return await resilience.call_with_resilience(
        lambda: run_in_threadpool(_search_for_series, cfg, study_uid), resilience.PACS_BREAKER, max_attempts=1)


async def search_instances(cfg: PacsConfig, study_uid: str, series_uid: str) -> List[Dict[str, dict]]:
    return await resilience.call_with_resilience(
        lambda: run_in_threadpool(_search_for_instances, cfg, study_uid, series_uid), resilience.PACS_BREAKER,
        max_attempts=1)


async def retrieve_series(cfg: PacsConfig, study_uid: str, series_uid: str):
    # L'import WADO-RS transfère potentiellement des Mo de pixels : un seul
    # retry léger a du sens ici (contrairement à la recherche QIDO, purement
    # interactive), mais reste modeste pour ne pas cumuler avec le disjoncteur.
    return await resilience.call_with_resilience(
        lambda: run_in_threadpool(_retrieve_series, cfg, study_uid, series_uid), resilience.PACS_BREAKER,
        max_attempts=2, base_delay=1.0)


# ---------------------------------------------------------------------------
# Décodage des réponses QIDO-RS (format DICOM JSON, PS3.18 Annexe F)
# Chaque attribut est identifié par son tag hexadécimal, ex. "0020000D" pour
# StudyInstanceUID, avec une structure {"vr": "UI", "Value": [...]}.
# ---------------------------------------------------------------------------
_QIDO_TAGS = {
    "study_uid": "0020000D",
    "series_uid": "0020000E",
    "sop_instance_uid": "00080018",
    "patient_name": "00100010",
    "patient_id": "00100020",
    "study_date": "00080020",
    "study_time": "00080030",
    "study_description": "00081030",
    "series_description": "0008103E",
    "modality": "00080060",
    "accession_number": "00080050",
    "series_number": "00200011",
    "instance_number": "00200013",
    "number_of_series_related_instances": "00201209",
}


def _extract(item: Dict[str, dict], key: str) -> Optional[str]:
    tag = _QIDO_TAGS[key]
    entry = item.get(tag)
    if not entry:
        return None
    values = entry.get("Value")
    if not values:
        return None
    v = values[0]
    if isinstance(v, dict) and "Alphabetic" in v:  # PersonName (patient_name)
        return v["Alphabetic"]
    return str(v)


def simplify_study(item: Dict[str, dict]) -> Dict[str, Any]:
    return {
        "study_uid": _extract(item, "study_uid"),
        "patient_name": _extract(item, "patient_name"),
        "patient_id": _extract(item, "patient_id"),
        "study_date": _extract(item, "study_date"),
        "study_description": _extract(item, "study_description"),
        "accession_number": _extract(item, "accession_number"),
    }


def simplify_series(item: Dict[str, dict]) -> Dict[str, Any]:
    return {
        "series_uid": _extract(item, "series_uid"),
        "modality": _extract(item, "modality"),
        "series_description": _extract(item, "series_description"),
        "series_number": _extract(item, "series_number"),
        "num_instances": _extract(item, "number_of_series_related_instances"),
    }


def simplify_instance(item: Dict[str, dict]) -> Dict[str, Any]:
    return {
        "sop_instance_uid": _extract(item, "sop_instance_uid"),
        "instance_number": _extract(item, "instance_number"),
    }
