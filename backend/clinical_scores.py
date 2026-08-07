# -*- coding: utf-8 -*-
"""
clinical_scores.py — Scores cliniques de réanimation/USI calculés côté serveur.

Source de vérité indépendante du frontend : les totaux (SOFA, Glasgow, NEWS2,
bilan net) et les alertes (dysfonction organique Sepsis-3) sont calculés ici,
jamais reçus du client. Fonctions pures et unit-testables (voir
backend/tests/test_clinical_scores.py).

Références :
  - SOFA : Vincent et al. (1996) — Sepsis-related Organ Failure Assessment.
  - Sepsis-3 (2016) : dysfonction organique = variation aiguë de SOFA >= 2.
  - Glasgow (GCS) : Teasdale & Jennett (1974) — E4/V5/M6.
  - NEWS2 : Royal College of Physicians (2017) — National Early Warning Score 2.
"""

from __future__ import annotations

from typing import Optional


def compute_sofa(*subscores: Optional[int]) -> Optional[int]:
    """SOFA total = somme des 6 sous-scores (0-4 chacun), ou None si aucun renseigné."""
    present = [v for v in subscores if v is not None]
    return sum(present) if present else None


def compute_glasgow(eye: Optional[int], verbal: Optional[int], motor: Optional[int]) -> Optional[int]:
    """Glasgow (GCS) total = E + V + M, ou None si aucun renseigné."""
    present = [v for v in (eye, verbal, motor) if v is not None]
    return sum(present) if present else None


def compute_bilan_net(entrees_ml: Optional[float], sorties_ml: Optional[float]) -> Optional[float]:
    """Bilan hydrique net = entrées − sorties (None si aucun des deux renseigné)."""
    if entrees_ml is None and sorties_ml is None:
        return None
    return (entrees_ml or 0.0) - (sorties_ml or 0.0)


def sepsis_organ_dysfunction(sofa_total: Optional[int]) -> bool:
    """Sepsis-3 : dysfonction organique si variation aiguë de SOFA >= 2.
    En l'absence de valeur de référence antérieure, on alerte dès SOFA >= 2."""
    return sofa_total is not None and sofa_total >= 2


# ---------------------------------------------------------------------------
# NEWS2 — National Early Warning Score 2 (RCP, 2017)
# ---------------------------------------------------------------------------

def _news2_resp_rate(rpm: Optional[int]) -> int:
    if rpm is None:
        return 0
    if rpm <= 8:
        return 3
    if rpm <= 11:
        return 1
    if rpm <= 20:
        return 0
    if rpm <= 24:
        return 2
    return 3


def _news2_spo2(spo2: Optional[int]) -> int:
    if spo2 is None:
        return 0
    if spo2 <= 91:
        return 3
    if spo2 <= 93:
        return 2
    if spo2 <= 95:
        return 1
    return 0


def _news2_oxygen(supplemental_o2: Optional[bool]) -> int:
    return 2 if supplemental_o2 else 0


def _news2_systolic_bp(mmhg: Optional[int]) -> int:
    if mmhg is None:
        return 0
    if mmhg <= 90:
        return 3
    if mmhg <= 100:
        return 2
    if mmhg <= 110:
        return 1
    if mmhg <= 219:
        return 0
    return 3


def _news2_heart_rate(bpm: Optional[int]) -> int:
    if bpm is None:
        return 0
    if bpm <= 40:
        return 3
    if bpm <= 50:
        return 1
    if bpm <= 90:
        return 0
    if bpm <= 110:
        return 1
    if bpm <= 130:
        return 2
    return 3


def _news2_temperature(c: Optional[float]) -> int:
    if c is None:
        return 0
    if c <= 35.0:
        return 3
    if c <= 36.0:
        return 1
    if c <= 38.0:
        return 0
    if c <= 39.0:
        return 1
    return 2


def _news2_avpu(avpu: Optional[str]) -> int:
    if avpu is None:
        return 0
    return 0 if avpu.upper() == "A" else 3


def compute_news2(*, resp_rate_rpm: Optional[int] = None, spo2_pct: Optional[int] = None,
                  supplemental_o2: Optional[bool] = None, systolic_bp_mmhg: Optional[int] = None,
                  heart_rate_bpm: Optional[int] = None, temperature_c: Optional[float] = None,
                  avpu: Optional[str] = None) -> int:
    """NEWS2 total (0-20). Chaque paramètre absent compte 0 (aucune information).
    NOTE : si aucune constante vitale n'est renseignée, le score vaut 0 et ne
    doit pas être interprété comme un patient sain — l'appelant n'affiche le
    score que lorsque des paramètres sont présents."""
    return (
        _news2_resp_rate(resp_rate_rpm)
        + _news2_spo2(spo2_pct)
        + _news2_oxygen(supplemental_o2)
        + _news2_systolic_bp(systolic_bp_mmhg)
        + _news2_heart_rate(heart_rate_bpm)
        + _news2_temperature(temperature_c)
        + _news2_avpu(avpu)
    )


def news2_escalation(total: Optional[int]) -> dict:
    """Niveau d'escalade clinique NEWS2 (protocole RCP) :
      - low    : 0-4
      - medium : 5-6 (ou 3 points sur un paramètre unique)
      - high   : >= 7
    Retourne un dict {level, label} consommable par l'API/le frontend."""
    if total is None:
        return {"level": "low", "label": "Non évalué"}
    if total >= 7:
        return {"level": "high", "label": "Urgence — surveillance continue et alerte immédiate"}
    if total >= 5:
        return {"level": "medium", "label": "Risque modéré — surveillance accrue"}
    return {"level": "low", "label": "Risque faible — surveillance standard"}
