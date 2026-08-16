# -*- coding: utf-8 -*-
"""
bci_cortical_service.py — Interface Cerveau-Machine (BCI) & Haptique Cortical (Jalon M23)
=============================================================================================
⚠️ MODULE DE RECHERCHE SPÉCULATIF — chargé uniquement si RESEARCH_MODE=true (voir main.py), jamais
actif en clinique par défaut. AUCUNE interface cerveau-machine réelle n'est connectée ici. La
« barrière de sécurité anti-épileptique » décrite au point 3 est une valeur simulée, PAS un dispositif
de sécurité neurologique réel — ne jamais la considérer comme une protection réelle contre une crise
si ce module devait un jour être relié à du matériel BCI réel.

Service FastAPI futuriste (2026–2046) assurant :
    1. Le décodage neuromorphique sub-milliseconde (< 2.4 ms) des potentiels d'action du cortex
       moteur (M1, matrice 1024 canaux) pour le contrôle par la pensée des bras du robot RAS.
    2. Le retour haptique cortical direct par micro-stimulation intra-corticale (ICMS) dans le
       cortex somatosensoriel (S1) : conversion de la résistance tissulaire PBD (Newtons) en
       trains d'impulsions biphasiques (20–100 µA @ 200 Hz).
    3. Barrière de sécurité anti-fatigue cognitive & anti-épileptique avec scellement SHA-256.
"""

from __future__ import annotations

import hashlib
import json
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import get_db
from logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v2/bci", tags=["bci-cortical-haptics"])

# ---------------------------------------------------------------------------
# Modèles Pydantic
# ---------------------------------------------------------------------------

class NeuralDecodingRequest(BaseModel):
    twin_id: str = Field(..., description="ID du jumeau numérique")
    target_action: str = Field("CLIPPING_ANEURYSM_NECK", description="Intention motrice : CLIPPING_ANEURYSM_NECK, TRANSECTION_HEPATIC_PARENCHYMA, MICRO_SUTURE_RETINAL_VESSEL")
    firing_rate_vector_hz: List[float] = Field([45.2, 88.1, 12.4, 67.8, 92.0], description="Vecteur représentatif de fréquence de décharge neurone M1 (Hz)")
    tissue_resistance_newtons: float = Field(2.4, description="Force de résistance calculée par le moteur PBD (N)")

class NeuralInterlockRequest(BaseModel):
    twin_id: str = Field(..., description="ID du jumeau numérique")
    reason: str = Field("COGNITIVE_FATIGUE_INDEX_EXCEEDED_88_PCT", description="Raison : COGNITIVE_FATIGUE_INDEX_EXCEEDED_88_PCT, ABNORMAL_EPILEPTIFORM_SYNCHRONIZATION")
    eeg_theta_beta_ratio: float = Field(3.4, description="Ratio EEG Thêta/Bêta témoignant d'une surcharge mentale ou somnolence")

# ---------------------------------------------------------------------------
# Endpoints REST
# ---------------------------------------------------------------------------

@router.get("/neuromorphic-status")
async def get_neuromorphic_bci_status():
    """
    Retourne la télémétrie en direct de l'interface cerveau-machine (matrice 1024 électrodes)
    et de la puce neuromorphique SNN (Spiking Neural Network).
    """
    now_utc = datetime.now(timezone.utc).isoformat()
    return {
        "timestamp_utc": now_utc,
        "cortical_array": {
            "implant_model": "Neuralink N1-Surg / Precision Neuroscience 1024-Ch Film",
            "sampling_frequency_khz": 30.0,
            "active_channels": 1018,
            "signal_to_noise_ratio_db": 42.5,
            "status": "BIOCOMPATIBLE_STABLE_RECORDING 🟢"
        },
        "neuromorphic_decoder": {
            "processor": "Intel Loihi 2 Spiking Neural Network (SNN) Accelerator",
            "decoding_latency_ms": 2.1,
            "motor_cortex_m1_accuracy_pct": 99.2,
            "status": "ONLINE_ACTIVE_THOUGHT_CONTROL 🧠⚡"
        },
        "cortical_haptic_feedback": {
            "target_region": "Somatosensory Cortex (S1 — Brodmann area 3b)",
            "stimulation_modality": "Biphasic Charge-Balanced ICMS Pulse Trains",
            "frequency_hz": 200,
            "current_range_microamps": "20.0 - 100.0 µA",
            "status": "COUPLED_DIRECT_MIND_SENSATION ✨"
        }
    }

@router.post("/decode-motor-intention")
async def decode_motor_intention_and_haptics(
    req: NeuralDecodingRequest,
    db: Session = Depends(get_db)
):
    """
    Décode les trains de potentiels d'action du cortex moteur (M1) en commande cinématique
    6-axes pour le robot et renvoie la micro-stimulation S1 proportionnelle à la force tissulaire.
    """
    now_utc = datetime.now(timezone.utc).isoformat()
    decoding_id = str(uuid.uuid4())
    
    # Calcul de la stimulation corticale ICMS en fonction de la force en Newtons
    # 0.5 N -> 20 µA (légère sensation tact), 4.5 N -> 100 µA (alerte rigidité maximale)
    icms_current_ua = round(min(100.0, max(20.0, req.tissue_resistance_newtons * 22.0)), 1)
    pulse_width_us = 200
    
    # Génération du vecteur de vitesse cinématique 7-DOF commandé par la pensée
    velocity_vector_mms = {
        "vx": round(math.sin(req.firing_rate_vector_hz[0]) * 12.0, 2),
        "vy": round(math.cos(req.firing_rate_vector_hz[1]) * 12.0, 2),
        "vz": round(math.sin(req.firing_rate_vector_hz[2]) * 8.0, 2),
        "angular_roll_deg_sec": round(req.firing_rate_vector_hz[3] * 0.4, 1),
        "gripper_aperture_pct": round(min(100.0, req.firing_rate_vector_hz[4] * 1.1), 1)
    }
    
    # Scellement SHA-256 dans audit_logs
    crypto_hash = hashlib.sha256(f"{decoding_id}|{req.twin_id}|{req.target_action}|{req.tissue_resistance_newtons}|{now_utc}".encode("utf-8")).hexdigest()
    try:
        log_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO audit_logs (id, action_type, target_resource, resource_id, details, cryptographic_hash)
            VALUES (:id, 'BCI_THOUGHT_CONTROL_DECODING', 'digital_twins', :res_id, :details, :hash)
        """), {
            "id": log_id,
            "res_id": req.twin_id,
            "details": json.dumps({
                "action": req.target_action,
                "force_N": req.tissue_resistance_newtons,
                "icms_ua": icms_current_ua,
                "lat_ms": 2.1
            }),
            "hash": crypto_hash
        })
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Erreur SQL audit_logs: %s", e)
        
    return {
        "decoding_event_id": decoding_id,
        "twin_id": req.twin_id,
        "decoded_motor_action": req.target_action,
        "kinematic_velocity_command_7dof": velocity_vector_mms,
        "s1_cortical_haptic_feedback": {
            "target_cortex": "Somatosensory S1 (Brodmann 3b)",
            "icms_current_microamps": icms_current_ua,
            "pulse_frequency_hz": 200,
            "pulse_width_microseconds": pulse_width_us,
            "tactile_perception_grade": "REALISTIC_ELASTIC_TISSUE_SENSATION 🧠✨"
        },
        "neuromorphic_latency_ms": 2.1,
        "sha256_audit_seal": crypto_hash,
        "timestamp_utc": now_utc
    }

@router.post("/trigger-neural-interlock")
async def trigger_neural_safety_interlock(
    req: NeuralInterlockRequest,
    db: Session = Depends(get_db)
):
    """
    Déclenche le découplage d'urgence de l'interface cerveau-machine si un indice de fatigue
    mentale extrême (>85%) ou des signes précurseurs d'hyperexcitabilité corticale sont détectés.
    """
    now_utc = datetime.now(timezone.utc).isoformat()
    interlock_id = str(uuid.uuid4())
    
    payload_to_hash = f"{interlock_id}|{req.twin_id}|{req.reason}|{req.eeg_theta_beta_ratio}|{now_utc}"
    crypto_hash = hashlib.sha256(payload_to_hash.encode("utf-8")).hexdigest()
    
    try:
        log_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO audit_logs (id, action_type, target_resource, resource_id, details, cryptographic_hash)
            VALUES (:id, 'BCI_EMERGENCY_NEURAL_INTERLOCK', 'digital_twins', :res_id, :details, :hash)
        """), {
            "id": log_id,
            "res_id": req.twin_id,
            "details": json.dumps({
                "reason": req.reason,
                "theta_beta": req.eeg_theta_beta_ratio,
                "status": "DISCONNECTED_SAFE_MODE"
            }),
            "hash": crypto_hash
        })
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Erreur SQL audit_logs: %s", e)
        
    return {
        "interlock_event_id": interlock_id,
        "twin_id": req.twin_id,
        "trigger_reason": req.reason,
        "measured_eeg_ratio": req.eeg_theta_beta_ratio,
        "robotic_arm_state": "EMERGENCY_NEURAL_DISCONNECT — AUTO_LOCK_ENGAGED 🛑",
        "cortical_stimulation_state": "ICMS_PULSES_MUTED_IMMEDIATELY 🔕",
        "sha256_audit_seal": crypto_hash,
        "timestamp_utc": now_utc
    }
