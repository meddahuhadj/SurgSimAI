# -*- coding: utf-8 -*-
"""
segmentation_specialties.py — Mapping structure anatomique par spécialité
==========================================================================
TotalSegmentator expose une tâche générique `total` (~117 structures, dont
organes, lobes, vaisseaux, glandes...) qui couvre bien plus que le foie.
Ce module déclare, pour chaque spécialité chirurgicale de la plateforme, la
liste des structures pertinentes à segmenter via `task="total"` + `roi_subset`
(une seule inférence par spécialité), plus les tâches dédiées optionnelles
(ex. `kidney_vessels` pour l'urologie, utile à la planification d'une
néphrectomie).

C'est la réponse à la limite « segmentation réelle = HBP uniquement » notée
dans le README : le pipeline de segmentation générique (`total_roi`) sert ici
toutes les spécialités non hépatiques, tandis que la spécialité hbp continue
d'utiliser son pipeline dédié éprouvé (`liver_segments`/`liver_vessels`).

Ce module est VOLONTAIREMENT sans dépendance vers TotalSegmentator : il ne
contient que du vocabulaire (noms de labels) + des fonctions pures de
construction du payload, testables unitairement sans GPU ni poids de modèle.
"""

from __future__ import annotations

from typing import Callable, Dict, List, Optional

# ---------------------------------------------------------------------------
# Labels de la tâche "total" de TotalSegmentator utilisés ici, avec pour chacun :
#   (nom_affichable, type) + couleur RGBA (0-255) pour le maillage GLB.
# Les noms de labels correspondent à la `class_map["total"]` de TotalSegmentator.
# ---------------------------------------------------------------------------
_T = "total"
_K = "kidney_vessels"

TOTAL_STRUCTURE_INFO: Dict[str, Dict] = {
    "colon":                    {"task": _T, "type": "organe",        "label": "Côlon",                    "color": (155, 89, 182, 210)},
    "small_bowel":              {"task": _T, "type": "organe",        "label": "Intestin grêle",           "color": (241, 196, 15, 210)},
    "stomach":                  {"task": _T, "type": "organe",        "label": "Estomac",                  "color": (46, 204, 113, 210)},
    "esophagus":                {"task": _T, "type": "organe",        "label": "Œsophage",                "color": (211, 84, 0, 210)},
    "thyroid":                  {"task": _T, "type": "glande",        "label": "Thyroïde",                "color": (231, 76, 60, 225)},
    "trachea":                  {"task": _T, "type": "voie aérienne", "label": "Trachée",                 "color": (52, 152, 219, 200)},
    "lung_left":                {"task": _T, "type": "poumon",        "label": "Poumon gauche",           "color": (26, 188, 156, 160)},
    "lung_right":               {"task": _T, "type": "poumon",        "label": "Poumon droit",            "color": (26, 188, 156, 160)},
    "lung_upper_lobe_left":     {"task": _T, "type": "lobe pulmonaire", "label": "Lobe supérieur gauche", "color": (29, 185, 84, 190)},
    "lung_middle_lobe_left":    {"task": _T, "type": "lobe pulmonaire", "label": "Lobe moyen gauche",     "color": (46, 204, 113, 190)},
    "lung_lower_lobe_left":     {"task": _T, "type": "lobe pulmonaire", "label": "Lobe inférieur gauche", "color": (88, 214, 141, 190)},
    "lung_upper_lobe_right":    {"task": _T, "type": "lobe pulmonaire", "label": "Lobe supérieur droit",  "color": (26, 179, 148, 190)},
    "lung_middle_lobe_right":   {"task": _T, "type": "lobe pulmonaire", "label": "Lobe moyen droit",      "color": (30, 132, 73, 190)},
    "lung_lower_lobe_right":    {"task": _T, "type": "lobe pulmonaire", "label": "Lobe inférieur droit",  "color": (15, 157, 88, 190)},
    "heart":                    {"task": _T, "type": "cœur",          "label": "Cœur",                    "color": (231, 76, 60, 205)},
    "heart_atrium_left":        {"task": _T, "type": "cavité cardiaque", "label": "Oreillette gauche",   "color": (192, 57, 43, 205)},
    "heart_atrium_right":       {"task": _T, "type": "cavité cardiaque", "label": "Oreillette droite",   "color": (155, 89, 182, 205)},
    "heart_ventricle_left":     {"task": _T, "type": "cavité cardiaque", "label": "Ventricule gauche",   "color": (231, 76, 60, 205)},
    "heart_ventricle_right":    {"task": _T, "type": "cavité cardiaque", "label": "Ventricule droit",    "color": (211, 84, 0, 205)},
    "aorta":                    {"task": _T, "type": "vaisseau",      "label": "Aorte",                   "color": (255, 107, 53, 220)},
    "pulmonary_artery":         {"task": _T, "type": "vaisseau",      "label": "Artère pulmonaire",       "color": (230, 126, 34, 220)},
    "kidney_left":              {"task": _T, "type": "rein",          "label": "Rein gauche",             "color": (243, 156, 18, 210)},
    "kidney_right":             {"task": _T, "type": "rein",          "label": "Rein droit",              "color": (230, 126, 34, 210)},
    "urinary_bladder":          {"task": _T, "type": "organe",        "label": "Vessie",                  "color": (52, 152, 219, 190)},
    "prostate":                 {"task": _T, "type": "glande",        "label": "Prostate",                "color": (168, 100, 168, 210)},
    # Tâche dédiée kidney_vessels — arbre vasculaire rénal (utile à la planification
    # d'une néphrectomie) : artères/veines rénales gauche et droite.
    "kidney_artery_left":       {"task": _K, "type": "vaisseau",      "label": "Artère rénale gauche",    "color": (255, 107, 53, 220)},
    "kidney_artery_right":      {"task": _K, "type": "vaisseau",      "label": "Artère rénale droite",    "color": (255, 87, 34, 220)},
    "kidney_vein_left":         {"task": _K, "type": "vaisseau",      "label": "Veine rénale gauche",     "color": (30, 144, 255, 220)},
    "kidney_vein_right":        {"task": _K, "type": "vaisseau",      "label": "Veine rénale droite",     "color": (52, 152, 219, 220)},
}

# Structures segmentées via la tâche "total" pour chaque spécialité non-HBP.
# hbp et anesthesie_reanimation sont gérées à part :
#   - hbp → pipeline dédié liver_segments/liver_vessels (segments de Couinaud)
#   - anesthesie_reanimation → pas de segmentation organique pertinente.
SPECIALTY_STRUCTURES: Dict[str, List[str]] = {
    "colorectal": ["colon", "small_bowel"],
    "gastrique": ["stomach", "esophagus"],
    "thyroide": ["thyroid", "trachea"],
    "thoracique": [
        "lung_left", "lung_right",
        "lung_upper_lobe_left", "lung_middle_lobe_left", "lung_lower_lobe_left",
        "lung_upper_lobe_right", "lung_middle_lobe_right", "lung_lower_lobe_right",
        "trachea", "esophagus",
    ],
    "cardiaque": [
        "heart", "heart_atrium_left", "heart_atrium_right",
        "heart_ventricle_left", "heart_ventricle_right",
        "aorta", "pulmonary_artery",
    ],
    "urologie": ["kidney_left", "kidney_right", "urinary_bladder", "prostate"],
}

# Tâches dédiées supplémentaires par spécialité (une inférence de plus chacune).
# key = nom de tâche TotalSegmentator, value = liste des structures à extraire.
SPECIALTY_EXTRA_TASKS: Dict[str, Dict[str, List[str]]] = {
    "urologie": {"kidney_vessels": ["kidney_artery_left", "kidney_artery_right",
                                     "kidney_vein_left", "kidney_vein_right"]},
}

# Spécialités couvertes par le pipeline générique "total_roi".
GENERIC_SPECIALTIES: List[str] = list(SPECIALTY_STRUCTURES.keys())

# Toutes les structures référencées dans les mappings ci-dessus doivent exister
# dans TOTAL_STRUCTURE_INFO (vérifié par un test unitaire).
ALL_REFERENCED = sorted(
    {s for structures in SPECIALTY_STRUCTURES.values() for s in structures}
    | {s for tasks in SPECIALTY_EXTRA_TASKS.values() for names in tasks.values() for s in names}
)


def is_known_structure(label: str) -> bool:
    return label in TOTAL_STRUCTURE_INFO


def structure_info(label: str) -> Dict:
    """Retourne l'info (nom affichable, type, couleur, tâche) d'une structure."""
    return TOTAL_STRUCTURE_INFO[label]


def valid_specialty_structures(specialty: str) -> List[str]:
    """Liste des structures 'total' valides pour cette spécialité (labels connus)."""
    return [s for s in SPECIALTY_STRUCTURES.get(specialty, []) if is_known_structure(s)]


def group_by_task(specialty: str) -> Dict[str, List[str]]:
    """Regroupe les structures de la spécialité par tâche TotalSegmentator, pour
    pouvoir lancer une inférence par tâche (roi_subset) puis extraire les labels.

    Ex. urologie → {"total": [kidney_left, ...], "kidney_vessels": [...]}.
    """
    groups: Dict[str, List[str]] = {}
    for label in SPECIALTY_STRUCTURES.get(specialty, []):
        info = TOTAL_STRUCTURE_INFO.get(label)
        if info:
            groups.setdefault(info["task"], []).append(label)
    for task, labels in SPECIALTY_EXTRA_TASKS.get(specialty, {}).items():
        groups.setdefault(task, []).extend(labels)
    return groups


def build_generic_segments_payload(
    specialty: str,
    volumes_by_label: Dict[str, float],
    mesh_builder: Callable[[str], Optional[str]],
) -> List[Dict]:
    """Construit le payload 'segments' (même contrat que le pipeline HBP : chaque
    entrée porte organ/type/label/volume_ml/mesh_url) pour une spécialité générique.

    Pure (aucune dépendance TotalSegmentator / réseau / disque) : testable
    unitairement. `volumes_by_label` = {label: volume_ml}, `mesh_builder(label)`
    retourne l'URL du maillage GLB ou None.
    """
    payload: List[Dict] = []
    for label in SPECIALTY_STRUCTURES.get(specialty, []):
        info = TOTAL_STRUCTURE_INFO.get(label)
        if not info:
            continue
        entry: Dict = {
            "organ": label,
            "type": info["type"],
            "label": info["label"],
            "volume_ml": round(volumes_by_label.get(label, 0.0), 1),
        }
        mesh_url = mesh_builder(label)
        if mesh_url:
            entry["mesh_url"] = mesh_url
        payload.append(entry)
    return payload


def build_generic_vessels_payload(
    specialty: str,
    volumes_by_label: Dict[str, float],
    mesh_builder: Callable[[str], Optional[str]],
) -> List[Dict]:
    """Comme ci-dessus mais pour les structures de type 'vaisseau' issues des
    tâches dédiées (ex. arbre vasculaire rénal) — intégrées à la clé 'vessels'
    du résultat, cohérent avec le contrat du frontend (result.vessels)."""
    payload: List[Dict] = []
    for task, labels in SPECIALTY_EXTRA_TASKS.get(specialty, {}).items():
        for label in labels:
            info = TOTAL_STRUCTURE_INFO.get(label)
            if not info:
                continue
            entry: Dict = {
                "name": info["label"],
                "label": label,
                "volume_ml": round(volumes_by_label.get(label, 0.0), 1),
            }
            mesh_url = mesh_builder(label)
            if mesh_url:
                entry["mesh_url"] = mesh_url
            payload.append(entry)
    return payload
