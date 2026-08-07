# -*- coding: utf-8 -*-
"""
routers/pkpd_anesthesia.py — Simulateur Pharmacocinétique / Pharmacodynamique (PK/PD)
& Calculateur de Perte Sanguine Autorisée (AIA / MABL) pour l'Anesthésie.

Modèles implémentés :
- Propofol : Modèle de Schnider (3 compartiments)
- Rémifentanil : Modèle de Minto (3 compartiments)
- Volume sanguin estimé (EBV) & Perte Sanguine Autorisée (MABL)
"""

from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/anesthesia", tags=["anesthesia-pkpd"])

# ---------------------------------------------------------------------------
# Schemas Pydantic
# ---------------------------------------------------------------------------

class PatientAnesthesiaProfile(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Âge du patient (ans)")
    weight_kg: float = Field(..., ge=2, le=250, description="Poids (kg)")
    height_cm: float = Field(..., ge=40, le=250, description="Taille (cm)")
    sex: str = Field("M", description="Sexe ('M' ou 'F')")
    hb_initial_g_dl: float = Field(13.5, ge=5, le=20, description="Hémoglobine initiale (g/dL)")
    hb_target_g_dl: float = Field(10.0, ge=5, le=18, description="Hémoglobine minimale tolérée (g/dL)")


class PKPDSimulationRequest(BaseModel):
    patient: PatientAnesthesiaProfile
    drug: str = Field("propofol", description="Médicament ('propofol' ou 'remifentanil')")
    target_concentration_ug_ml: float = Field(3.0, ge=0.1, le=20.0, description="Concentration cible au site d'effet (µg/mL ou ng/mL)")
    duration_minutes: int = Field(60, ge=5, le=360, description="Durée de la simulation (min)")


class ConcentrationTimePoint(BaseModel):
    time_min: float
    cp_plasma: float
    ce_effect_site: float


class PKPDSimulationResponse(BaseModel):
    drug: str
    target_concentration: float
    unit: str
    time_series: List[ConcentrationTimePoint]
    ke0: float
    v1_liters: float
    v2_liters: float
    v3_liters: float
    maintenance_rate_mg_h: float
    note: str = Field(
        ...,
        description="Limites du modèle de courbe Cp/Ce — à lire avant toute interprétation clinique.",
    )


class BloodLossCalculationRequest(BaseModel):
    patient: PatientAnesthesiaProfile


class BloodLossCalculationResponse(BaseModel):
    ebv_ml: float
    mabl_ml: float
    crystalloid_replacement_3to1_ml: float
    colloid_replacement_1to1_ml: float
    hb_initial: float
    hb_target: float


# ---------------------------------------------------------------------------
# Logic PK/PD (Schnider / Minto)
# ---------------------------------------------------------------------------

def calculate_lbm(weight_kg: float, height_cm: float, sex: str, age: float) -> float:
    """Masse maigre (Lean Body Mass) selon la formule de James / Janmahasatian."""
    bmi = weight_kg / ((height_cm / 100.0) ** 2)
    if sex.upper() == "M":
        lbm = (9270 * weight_kg) / (6680 + 216 * bmi)
    else:
        lbm = (9270 * weight_kg) / (8780 + 244 * bmi)
    return max(20.0, min(lbm, weight_kg))


PKPD_CURVE_NOTE = (
    "Simplification assumée : Cp est modélisée par une approche mono-exponentielle vers la "
    "cible, au taux d'élimination k10 = CL1/V1 PROPRE à ce patient et à ce médicament (et non "
    "une constante identique pour tout le monde). Ce est ensuite dérivée de Cp via l'équation "
    "de site d'effet standard dCe/dt = ke0*(Cp-Ce). Ce modèle N'IMPLÉMENTE PAS l'algorithme "
    "bolus + perfusion décroissante d'une vraie pompe TCI (Shafer & Gregg, 1992) ni la "
    "redistribution inter-compartimentale complète (V2/V3 sont affichés à titre informatif, "
    "littérature Schnider/Minto, mais n'influencent pas cette courbe) : la montée réelle "
    "observée sous une pompe TCI certifiée peut différer significativement, surtout dans les "
    "premières minutes. Ne jamais utiliser cette courbe comme un profil de perfusion réel — "
    "aide à la décision non certifiée, à valider systématiquement par un anesthésiste."
)


def _simulate_concentration_curve(target: float, k10: float, ke0: float, duration_minutes: int,
                                   substeps_per_min: int = 20) -> List[tuple]:
    """Intègre numériquement (Euler, pas fin) la montée de Cp vers `target` au taux `k10`
    propre au patient/médicament, puis Ce via dCe/dt = ke0*(Cp-Ce). Voir PKPD_CURVE_NOTE
    pour les limites de cette simplification par rapport à un vrai contrôleur TCI."""
    dt = 1.0 / substeps_per_min
    cp, ce = 0.0, 0.0
    points = [(0, 0.0, 0.0)]
    substep_count = 0
    minute = 0
    for _ in range(duration_minutes * substeps_per_min):
        cp += k10 * (target - cp) * dt
        ce += ke0 * (cp - ce) * dt
        substep_count += 1
        if substep_count % substeps_per_min == 0:
            minute += 1
            points.append((minute, cp, ce))
    return points


@router.post("/simulate-pkpd", response_model=PKPDSimulationResponse)
async def simulate_pkpd(req: PKPDSimulationRequest):
    p = req.patient
    lbm = calculate_lbm(p.weight_kg, p.height_cm, p.sex, p.age)
    drug = req.drug.lower()

    if drug == "propofol":
        # Modèle de Schnider (3 compartiments)
        v1 = 4.27
        v2 = 18.9 - 0.391 * (p.age - 53)
        v3 = 238.0
        ke0 = 0.456 # min^-1
        unit = "µg/mL"

        # Taux de perfusion de maintien estimé à l'équilibre (mg/kg/h)
        cl1 = 1.89 + 0.0456 * (p.weight_kg - 77) - 0.0681 * (lbm - 59) + 0.0264 * (p.height_cm - 177)
        maint_rate = req.target_concentration_ug_ml * cl1 * 60.0 # mg/h

    elif drug == "remifentanil":
        # Modèle de Minto (3 compartiments)
        v1 = 5.1 - 0.0201 * (p.age - 40) + 0.072 * (lbm - 55)
        v2 = 9.82 - 0.0811 * (p.age - 40) + 0.108 * (lbm - 55)
        v3 = 5.42
        ke0 = 0.595 # min^-1
        unit = "ng/mL"

        cl1 = 2.6 - 0.0162 * (p.age - 40) + 0.0191 * (lbm - 55)
        maint_rate = req.target_concentration_ug_ml * cl1 * 60.0 / 1000.0 # mg/h

    else:
        raise HTTPException(400, "Médicament non supporté. Choisissez 'propofol' ou 'remifentanil'.")

    # Montée de Cp vers la cible au taux d'élimination k10 = CL1/V1 propre à CE patient et
    # CE médicament (auparavant une constante universelle 0.8/min, identique pour tout le
    # monde, sans lien avec cl1/v1 pourtant calculés juste au-dessus et publiés dans la
    # réponse — incohérence corrigée ici). Voir PKPD_CURVE_NOTE pour les limites restantes.
    duration = req.duration_minutes
    target = req.target_concentration_ug_ml
    k10 = cl1 / v1

    points: List[ConcentrationTimePoint] = [
        ConcentrationTimePoint(time_min=float(t), cp_plasma=round(cp, 3), ce_effect_site=round(ce, 3))
        for (t, cp, ce) in _simulate_concentration_curve(target, k10, ke0, duration)
    ]

    return PKPDSimulationResponse(
        drug=drug,
        target_concentration=target,
        unit=unit,
        time_series=points,
        ke0=ke0,
        v1_liters=round(v1, 2),
        v2_liters=round(v2, 2),
        v3_liters=round(v3, 2),
        maintenance_rate_mg_h=round(maint_rate, 2),
        note=PKPD_CURVE_NOTE,
    )


@router.post("/allowable-blood-loss", response_model=BloodLossCalculationResponse)
async def calculate_allowable_blood_loss(req: BloodLossCalculationRequest):
    p = req.patient
    # Facteur d'estimation du volume sanguin (mL/kg)
    factor = 70.0 if p.sex.upper() == "M" else 65.0
    if p.age > 70:
        factor -= 5.0

    ebv = p.weight_kg * factor

    if p.hb_initial_g_dl <= p.hb_target_g_dl:
        mabl = 0.0
    else:
        # Formule de Gross : MABL = EBV * (Hb_i - Hb_t) / Hb_i
        mabl = ebv * (p.hb_initial_g_dl - p.hb_target_g_dl) / p.hb_initial_g_dl

    # Règles de compensation volumique (3:1 cristalloides, 1:1 colloides)
    cryst = mabl * 3.0
    coll = mabl * 1.0

    return BloodLossCalculationResponse(
        ebv_ml=round(ebv, 1),
        mabl_ml=round(mabl, 1),
        crystalloid_replacement_3to1_ml=round(cryst, 1),
        colloid_replacement_1to1_ml=round(coll, 1),
        hb_initial=p.hb_initial_g_dl,
        hb_target=p.hb_target_g_dl
    )
