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


# ---------------------------------------------------------------------------
# Scores de Risque Périopératoire et Hépatique Réels
# ---------------------------------------------------------------------------

def compute_child_pugh(
    bilirubin_mg_dl: float,
    albumin_g_dl: float,
    inr: float,
    ascites: str = "none",        # none | mild | moderate_severe
    encephalopathy: str = "none" # none | grade_1_2 | grade_3_4
) -> dict:
    """Calculateur officiel du score de Child-Pugh pour l'évaluation de la réserve hépatique."""
    score = 0
    # Bilirubine
    if bilirubin_mg_dl < 2.0:
        score += 1
    elif bilirubin_mg_dl <= 3.0:
        score += 2
    else:
        score += 3

    # Albumine
    if albumin_g_dl > 3.5:
        score += 1
    elif albumin_g_dl >= 2.8:
        score += 2
    else:
        score += 3

    # INR
    if inr < 1.7:
        score += 1
    elif inr <= 2.3:
        score += 2
    else:
        score += 3

    # Ascite
    asc = ascites.lower()
    if asc == "none":
        score += 1
    elif asc in ("mild", "slight"):
        score += 2
    else:
        score += 3

    # Encéphalopathie
    enc = encephalopathy.lower()
    if enc == "none":
        score += 1
    elif enc in ("grade_1_2", "grade1", "grade2"):
        score += 2
    else:
        score += 3

    if score <= 6:
        child_class = "A"
        risk_label = "Faible risque de décompensation (Mortalité périopératoire ~10%)"
    elif score <= 9:
        child_class = "B"
        risk_label = "Risque intermédiaire — Prudence sur résection majeure (Mortalité ~30%)"
    else:
        child_class = "C"
        risk_label = "Haut risque — Contre-indication résection (Mortalité >70%)"

    return {
        "score": score,
        "class": child_class,
        "clinical_recommendation": risk_label
    }


def compute_meld_na(
    bilirubin_mg_dl: float,
    creatinine_mg_dl: float,
    inr: float,
    sodium_mep_l: float = 135.0,
    dialysis_twice_past_week: bool = False
) -> float:
    """Calculateur MELD-Na (Model for End-Stage Liver Disease avec Sodium)."""
    import math

    bili = max(1.0, bilirubin_mg_dl)
    inr_val = max(1.0, inr)
    cr = 4.0 if dialysis_twice_past_week else max(1.0, min(4.0, creatinine_mg_dl))
    na = max(125.0, min(137.0, sodium_mep_l))

    meld_base = 0.957 * math.log(cr) + 0.378 * math.log(bili) + 1.120 * math.log(inr_val) + 0.643
    meld_score = round(meld_base * 10, 1)

    if meld_score > 11:
        meld_na = meld_score - na - (0.025 * meld_score * (137.0 - na)) + 137.0
        return round(max(meld_score, min(40.0, meld_na)), 1)
    return round(max(6.0, min(40.0, meld_score)), 1)


def compute_rcri(
    high_risk_surgery: bool = True,
    ischemic_heart_disease: bool = False,
    congestive_heart_failure: bool = False,
    cerebrovascular_disease: bool = False,
    insulin_dependent_diabetes: bool = False,
    preop_creatinine_over_2mg_dl: bool = False
) -> dict:
    """Score RCRI (Revised Cardiac Risk Index de Lee)."""
    points = sum([
        high_risk_surgery,
        ischemic_heart_disease,
        congestive_heart_failure,
        cerebrovascular_disease,
        insulin_dependent_diabetes,
        preop_creatinine_over_2mg_dl
    ])

    risk_map = {
        0: (0.4, "Classe I — Risque cardiaque très faible (0.4%)"),
        1: (0.9, "Classe II — Risque cardiaque faible (0.9%)"),
        2: (6.6, "Classe III — Risque cardiaque modéré (6.6%)"),
    }
    pct, label = risk_map.get(points, (11.0, "Classe IV — Haut risque cardiaque (>=11.0%)"))

    return {
        "points": points,
        "cardiac_event_risk_pct": pct,
        "risk_classification": label
    }


# ---------------------------------------------------------------------------
# Score de compromis chirurgical (Scenario Graph — trade-off risque/FLR)
# ---------------------------------------------------------------------------

# Mortalité péri-opératoire de base par classe Child-Pugh, reprise directement
# des libellés déjà présents dans `compute_child_pugh` ci-dessus (A ~10%,
# B ~30%, C >70%) — pas une nouvelle estimation, juste la même donnée
# réutilisée comme point de départ numérique du score de compromis.
_CHILD_PUGH_BASE_MORTALITY_PCT = {"A": 10.0, "B": 30.0, "C": 70.0}
_CHILD_PUGH_UNKNOWN_BASE_MORTALITY_PCT = 10.0  # hypothèse par défaut : fonction hépatique non documentée ~= classe A


def compute_resection_tradeoff_score(
    remnant_pct: float,
    flr_threshold_pct: float,
    child_pugh_class: Optional[str] = None,
    vessel_margin_deficit_mm: float = 0.0,
) -> dict:
    """Combine trois signaux déjà réels et individuellement documentés dans ce
    dépôt — le déficit de FLR sous le seuil de sécurité (`_flr_threshold`,
    routers/volumetrie.py), la classe Child-Pugh (`compute_child_pugh`
    ci-dessus), et le déficit de marge vasculaire
    (`margin_safety_engine.evaluate_surgical_margins`) — en un seul score de
    compromis pour comparer deux scénarios de résection sur le Scenario Graph
    (ex. marge 5 mm vs marge 10 mm).

    ⚠️ HONNÊTETÉ : ceci n'est PAS un score validé par une société savante
    (contrairement à Child-Pugh, MELD-Na ou RCRI, qui le sont chacun
    individuellement). C'est une combinaison heuristique transparente,
    documentée composante par composante dans le retour — jamais à présenter
    comme un score clinique validé en tant que tel, seulement comme une aide
    à la visualisation du compromis entre scénarios.

    Retourne un score dans [0, 100] (plus haut = risque plus élevé) et trois
    bandes de lecture (low/moderate/high).
    """
    cp_class = (child_pugh_class or "").strip().upper() or None
    base_mortality = _CHILD_PUGH_BASE_MORTALITY_PCT.get(cp_class or "", _CHILD_PUGH_UNKNOWN_BASE_MORTALITY_PCT)

    # Déficit de FLR : chaque point de pourcentage sous le seuil de sécurité
    # ajoute 2.5 points de risque, plafonné à 40 — le seuil lui-même
    # (_flr_threshold) encode déjà la littérature sur l'insuffisance
    # hépatocellulaire post-hépatectomie, ce plafond évite qu'un déficit
    # extrême ne domine entièrement le score.
    flr_deficit_pct = max(0.0, flr_threshold_pct - remnant_pct)
    flr_penalty = min(40.0, flr_deficit_pct * 2.5)

    # Déficit de marge vasculaire : chaque mm de marge demandée au-delà de la
    # distance réellement disponible avant une structure critique ajoute
    # 2 points de risque, plafonné à 20.
    vessel_penalty = min(20.0, max(0.0, vessel_margin_deficit_mm) * 2.0)

    total = min(100.0, base_mortality + flr_penalty + vessel_penalty)

    if total < 20.0:
        band, band_label = "low", "Risque faible — profil de résection standard"
    elif total < 45.0:
        band, band_label = "moderate", "Risque modéré — discuter en RCP, envisager une approche plus conservatrice"
    else:
        band, band_label = "high", "Risque élevé — évaluer une alternative moins radicale ou une optimisation pré-opératoire"

    return {
        "tradeoff_score": round(total, 1),
        "risk_band": band,
        "risk_band_label": band_label,
        "components": {
            "child_pugh_class": cp_class,
            "child_pugh_base_mortality_pct": base_mortality,
            "flr_deficit_pct": round(flr_deficit_pct, 1),
            "flr_penalty_points": round(flr_penalty, 1),
            "vessel_margin_deficit_mm": round(max(0.0, vessel_margin_deficit_mm), 1),
            "vessel_penalty_points": round(vessel_penalty, 1),
        },
        "disclaimer": ("Combinaison heuristique transparente de signaux individuellement réels "
                        "(seuil FLR, classe Child-Pugh, déficit de marge vasculaire) — n'est PAS "
                        "elle-même un score validé par une société savante. Aide à la comparaison "
                        "de scénarios, jamais seule base de décision."),
    }
