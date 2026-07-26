"""
DICOM + Segmentation — Modèles Pydantic partagés
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class DicomMetadata(BaseModel):
    patient_id: str
    study_uid: str
    series_uid: str
    modality: Literal["CT", "MR", "PT", "US"]
    slice_thickness_mm: float = 1.0
    rows: int
    cols: int
    num_slices: int
    filename: str


class DicomSeriesMetadata(BaseModel):
    patient_id: str
    study_uid: str
    series_uid: str
    modality: Literal["CT", "MR", "PT", "US"]
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    slice_thickness_mm: float = 1.0
    rows: int = 512
    cols: int = 512
    num_slices: int = 0
    pixel_spacing: Optional[list[float]] = None
    window_center: Optional[float] = 40
    window_width: Optional[float] = 400
    sha256: Optional[str] = None
    size_bytes: Optional[int] = None


class SegmentationRequest(BaseModel):
    patient_id: str
    modality: Literal["ct", "mr"] = "ct"
    model: Literal["totalsegmentator", "monailabel", "hepatic"] = "totalsegmentator"
    series_uid: Optional[str] = None
    organs: list[str] = Field(default_factory=lambda: ["liver", "spleen", "right_kidney", "left_kidney"])


class SegmentationResult(BaseModel):
    segment_id: str
    patient_id: str
    organ: str
    volume_ml: float
    mask_ref: Optional[str] = None
    confidence: Optional[float] = None
    processing_ms: Optional[int] = None


class DicomSR(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    content: dict
    author: str

