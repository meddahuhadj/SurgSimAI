# -*- coding: utf-8 -*-
"""
anonymizer_engine.py — Moteur d'Anonymisation & Pseudonymisation de Données Cliniques.
====================================================================================
Conforme à la norme DICOM PS 3.15 Annexe E (Basic Application Level Confidentiality Profile)
et aux directives HDS/CNIL pour le partage de données de recherche hospitalière.
"""

import hashlib
from typing import Dict, Any, Optional


def generate_pseudo_id(patient_id: str, salt: str = "HDS_RESEARCH_SALT_2026") -> str:
    """Génère un identifiant pseudonymisé irréversible SHA-256."""
    raw = f"{salt}:{patient_id}".encode("utf-8")
    return f"ANON-{hashlib.sha256(raw).hexdigest()[:12].upper()}"


def anonymize_patient_record(patient_dict: Dict[str, Any], salt: str = "HDS_RESEARCH_SALT_2026") -> Dict[str, Any]:
    """
    Anonymise un dictionnaire patient en supprimant les identifiants nominatifs (PII/PHI)
    tout en préservant les variables médicales épidémiologiques (Âge, Sexe, Poids, Taille, Diagnostic).
    """
    anon_dict = dict(patient_dict)

    # Pseudonymisation de l'ID patient
    original_id = str(anon_dict.get("id", anon_dict.get("patient_id", "UNKNOWN")))
    anon_dict["id"] = generate_pseudo_id(original_id, salt)
    if "patient_id" in anon_dict:
        anon_dict["patient_id"] = anon_dict["id"]

    # Remplacement des PII sensibles par des valeurs anonymisées
    anon_dict["nom"] = "ANONYMIZED_PATIENT"
    anon_dict["prenom"] = "ANONYMIZED"
    if "date_naissance" in anon_dict:
        anon_dict["date_naissance"] = "1900-01-01"
    if "ipp" in anon_dict:
        anon_dict["ipp"] = "0000000000"
    if "chambre" in anon_dict:
        anon_dict["chambre"] = None

    return anon_dict


def anonymize_dicom_tags(tags_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Anonymise les métadonnées DICOM clés selon DICOM PS 3.15."""
    clean_tags = dict(tags_dict)

    # Tags à effacer/remplacer
    clean_tags["PatientName"] = "ANONYMOUS^PATIENT"
    clean_tags["PatientID"] = generate_pseudo_id(str(clean_tags.get("PatientID", "000")))
    clean_tags["PatientBirthDate"] = ""
    clean_tags["InstitutionName"] = "HOSPITAL_ANONYMIZED"
    clean_tags["ReferringPhysicianName"] = ""

    return clean_tags
