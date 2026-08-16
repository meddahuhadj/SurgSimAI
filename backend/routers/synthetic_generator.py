# ════════════════════════════════════════════════════════════════════════
#  SurgSim 3D V2 — SYNTHETIC CASE GENERATOR (synthetic_generator.py)
#  FastAPI Router for Procedural Mesh Generation & Data augmentation
# ════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import uuid

from typing import Optional

router = APIRouter(
    prefix="/api/v2/synthetic",
    tags=["Synthetic Cases", "Research"]
)

class SyntheticCaseParams(BaseModel):
    organ: str = "Liver"
    tumor_size_min: int = 20
    tumor_size_max: int = 50
    difficulty: str = "Medium"
    vascular_variant: str = "Standard"
    seed: Optional[int] = None

class RandomizeStudyRequest(BaseModel):
    participant_id: str
    study_id: str = "R-001"

@router.post("/generate")
def generate_synthetic_case(params: SyntheticCaseParams):
    """
    Generate a procedural synthetic 3D case for Research and Simulation.
    If seed is provided, results are 100% deterministic & reproducible for scientific protocols.
    """
    actual_seed = params.seed if params.seed is not None else random.randint(1000000, 9999999)
    rng = random.Random(actual_seed)
    
    case_id = f"SYNTH-{actual_seed}"
    
    tumor_volume = rng.uniform(params.tumor_size_min, params.tumor_size_max)
    organ_volume = rng.uniform(1000, 1600)
    
    return {
        "status": "success",
        "case_id": case_id,
        "seed": actual_seed,
        "organ": params.organ,
        "difficulty": params.difficulty,
        "case_manifest": {
            "case_id": case_id,
            "seed": actual_seed,
            "generator_version": "FastAPI-Synthetic-V3.0",
            "organ": params.organ,
            "tumor_parameters": {
                "size_min": params.tumor_size_min,
                "size_max": params.tumor_size_max,
                "calculated_volume": round(tumor_volume, 1)
            },
            "vascular_variant": params.vascular_variant,
            "difficulty": params.difficulty,
            "reproducible_provenance": True
        },
        "structures": [
            {
                "id": "organ_main",
                "category": "organ",
                "volume": round(organ_volume, 1),
                "centroid": {"x": 0, "y": 0, "z": 0},
                "source": "Procedural_Generator"
            },
            {
                "id": "tumor_main",
                "category": "tumor",
                "volume": round(tumor_volume, 1),
                "centroid": {
                    "x": round(rng.uniform(-40, 40), 1),
                    "y": round(rng.uniform(-40, 40), 1),
                    "z": round(rng.uniform(-40, 40), 1)
                },
                "source": "Procedural_Generator"
            }
        ]
    }

@router.post("/randomize")
def randomize_participant(req: RandomizeStudyRequest):
    """
    Server-side deterministic group assignment and case locking for scientific rigor.
    """
    rng = random.Random(f"{req.participant_id}_{req.study_id}")
    assigned_group = "Group_A_Mouse" if rng.random() < 0.5 else "Group_B_VoiceFirst"
    assigned_seeds = [rng.randint(100000, 999999) for _ in range(5)]
    
    return {
        "participant_id": req.participant_id,
        "study_id": req.study_id,
        "assigned_group": assigned_group,
        "case_seeds": assigned_seeds,
        "locked": True
    }
