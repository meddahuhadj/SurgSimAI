# -*- coding: utf-8 -*-
"""
mllp_client.py — Transport MLLP réel pour l'envoi de messages HL7 v2
=======================================================================
Jusqu'ici, /hl7/adt, /hl7/orm et /hl7/oru se contentaient de RENVOYER le
texte du message HL7, à charge de l'intégrateur de le pousser vers un moteur
d'interface. Ce module ferme la boucle : il envoie réellement le message sur
le réseau via MLLP (Minimal Lower Layer Protocol), le protocole de transport
standard pour HL7 v2 (normalisé par HL7 International).

Format MLLP (un seul type de trame, pas de négociation) :
    <VT> message <FS> <CR>
    VT = 0x0B (Start Block), FS = 0x1C (End Block), CR = 0x0D (Carriage Return)

Le récepteur répond par un message ACK (accusé HL7, lui-même encadré en
MLLP) — on le lit et on vérifie le code d'accusé (AA=Application Accept,
AE=Application Error, AR=Application Reject) dans le segment MSA.

Socket brut (pas de dépendance MLLP tierce) : le protocole est simple à
implémenter correctement et une dépendance de plus dans un logiciel médical
pour ~40 lignes de code ne se justifie pas.
"""
from __future__ import annotations

import socket
from dataclasses import dataclass
from typing import Optional

VT = b"\x0b"
FS = b"\x1c"
CR = b"\x0d"


class MllpError(Exception):
    """Connexion MLLP impossible, timeout, ou accusé de réception négatif (AE/AR)."""


@dataclass
class MllpConfig:
    host: str
    port: int
    timeout_seconds: float = 10.0

    @classmethod
    def resolve(cls, host: Optional[str], port: Optional[int]) -> "MllpConfig":
        import os
        h = host or os.getenv("HL7_MLLP_HOST", "")
        if not h:
            raise MllpError("Aucun hôte MLLP configuré (HL7_MLLP_HOST ou paramètre host).")
        p = port or int(os.getenv("HL7_MLLP_PORT", "2575"))
        return cls(host=h, port=p, timeout_seconds=float(os.getenv("HL7_MLLP_TIMEOUT", "10")))


def _parse_msa(ack_text: str) -> tuple[str, str]:
    """Extrait (code, message) du segment MSA d'un accusé HL7 (ex. ('AA', ''))."""
    for line in ack_text.replace("\r", "\n").split("\n"):
        if line.startswith("MSA"):
            fields = line.split("|")
            code = fields[1] if len(fields) > 1 else ""
            text = fields[3] if len(fields) > 3 else ""
            return code, text
    return "", ""


def send_hl7_message(cfg: MllpConfig, message: str) -> dict:
    """Envoie un message HL7 v2 (texte, segments séparés par \\r) via MLLP et
    renvoie l'accusé de réception décodé. Lève MllpError sur échec réseau ou
    accusé négatif (AE/AR)."""
    frame = VT + message.encode("utf-8") + FS + CR
    try:
        with socket.create_connection((cfg.host, cfg.port), timeout=cfg.timeout_seconds) as sock:
            sock.sendall(frame)
            sock.settimeout(cfg.timeout_seconds)
            buf = b""
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                buf += chunk
                if FS in buf:
                    break
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        raise MllpError(f"Connexion MLLP à {cfg.host}:{cfg.port} impossible ou expirée : {e}") from e

    if not buf:
        raise MllpError(f"Aucune réponse du récepteur MLLP {cfg.host}:{cfg.port} (accusé attendu).")

    # Retire l'encadrement MLLP (VT ... FS CR) de la réponse.
    ack_raw = buf.strip(VT + FS + CR)
    ack_text = ack_raw.decode("utf-8", errors="replace")
    code, text = _parse_msa(ack_text)
    if code not in ("AA", "CA"):  # Application/Commit Accept
        raise MllpError(f"Accusé HL7 négatif du récepteur : MSA-1={code or '?'} ({text or 'sans détail'}).")
    return {"ack_code": code, "ack_text": text, "raw_ack": ack_text}
