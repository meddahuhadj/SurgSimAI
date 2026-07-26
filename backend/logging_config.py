# -*- coding: utf-8 -*-
"""
logging_config.py — Configuration du logging structuré JSON + correlation IDs.
===============================================================================
Remplace les print() et logging basique par du JSON structuré exploitable
par ELK/Loki/Grafana. Chaque requête reçoit un correlation_id unique
(traceable du frontend au backend et dans les logs serveur).
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Optional

# Variable de contexte pour le correlation ID (une par requête, thread-safe)
correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


class JSONFormatter(logging.Formatter):
    """Formateur JSON structuré pour tous les logs application."""

    def format(self, record: logging.LogRecord) -> str:
        import json
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        cid = correlation_id_var.get()
        if cid:
            log_entry["correlation_id"] = cid
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, ensure_ascii=False, default=str)


def setup_logging(level: str = "INFO") -> None:
    """Configure le logging JSON structuré sur stderr."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Supprime les handlers existants (évite la duplication avec uvicorn)
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(JSONFormatter())
    root.addHandler(handler)

    # Réduit le bruit des bibliothèques tierces
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def generate_correlation_id() -> str:
    """Génère un ID de corrélation unique (8 hex chars, suffisant pour le trace)."""
    return uuid.uuid4().hex[:8]


def get_logger(name: str) -> logging.Logger:
    """Retourne un logger nommé (raccourci vers logging.getLogger)."""
    return logging.getLogger(name)
