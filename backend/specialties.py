# -*- coding: utf-8 -*-
"""specialties.py — Spécialités chirurgicales supportées (partagé entre routers)."""

from typing import Literal

Specialty = Literal["hbp", "colorectal", "gastrique", "thyroide", "thoracique", "cardiaque", "urologie", "anesthesie_reanimation"]

SPECIALTY_LABELS = {
    "hbp": "Chirurgie Hépato-Bilio-Pancréatique",
    "colorectal": "Chirurgie Colorectale",
    "gastrique": "Chirurgie Gastrique",
    "thyroide": "Chirurgie Thyroïdienne",
    "thoracique": "Chirurgie Thoracique",
    "cardiaque": "Chirurgie Cardiaque",
    "urologie": "Chirurgie Urologique",
    "anesthesie_reanimation": "Anesthésie-Réanimation",
}
