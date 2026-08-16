# -*- coding: utf-8 -*-
"""
voice_command_engine.py — Moteur de Résolution NLU pour la Voix comme Premier Interlocuteur (Voice-First)
===========================================================================================================
Concept : plutôt que de cliquer dans les menus, l'interne parle à l'application. Ce module est le
« cerveau » NLU côté serveur qui traduit une transcription vocale (français courant, avec fautes
d'orthographe / accents souvent absents dans la STT) en une intention structurée **et** en un
*action-token* partagé avec le frontend (voir app-part3.js `glActionMap()`).

Pourquoi un résolveur serveur alors que Gemini Live émet déjà les tokens [ACTION:xxx] ?
  1. Honnêteté réglementaire (IEC 62304 / MDR) : chaque commande interprétée côté serveur peut
     être journalisée dans `audit_logs` — traçabilité immuable de ce que la voix a déclenché.
  2. Robustesse : le chemin REST/chat (fallback Gemini) n'a pas Gemini pour émettre des tokens ;
     le frontend l'appelle donc `POST /voice/command` pour obtenir l'intent structuré.
  3. Source unique de vérité : même vocabulaire d'actions que Gemini est guidé pour produire
     (`[ACTION:xxx:param]`), évitant la divergence entre « Gemini émet un token » et « l'API
     résout autrement ».

Intents couverts (exemples d'énoncés) :
  - show_hysterectomy : « SurSim, montre-moi une hystérectomie chez une patiente obèse »
  - grow_lesion       : « Augmente la taille de la tumeur de 50 % »
  - identify_structure: « C'est quoi cette structure en bleu ? »
  - add_note          : « Note : cet étudiant est en difficulté sur les marges utérines »
  - vue_3d / vue_mpr / zoom_avant / zoom_arriere / mode_clair / mode_sombre ... (navigation)
  - switch_<module>   : « passe au module HBP » (et colorectal, gastrique, ...)
  - chat              : fallback lorsqu'aucune intention n'est reconnue avec certitude
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# Vocabulaire d'actions partagé avec le frontend (app-part3.js `glActionMap()`).
# Un `action` correspond exactement à une clé de `glActionMap()` → `[ACTION:<action>]`.
NAV_ACTIONS = [
    "vue_3d", "vue_mpr", "zoom_avant", "zoom_arriere",
    "mode_clair", "mode_sombre",
    "bloc_operatoire_on", "bloc_operatoire_off",
    "mode_tactile_on", "mode_tactile_off",
    "mode_lecture_seule_on", "mode_lecture_seule_off",
    "open_analyse", "open_ia", "open_plan", "open_implants",
    "open_patients", "open_settings", "close_modal",
    "recalc_analysis", "export_plan",
    "switch_hbp", "switch_colorectal", "switch_gastrique",
    "switch_thyroide", "switch_thoracique", "switch_cardiaque",
    "switch_urologie", "switch_gynecologie",
]

# Actions chirurgicales vocales (spécifiques au Voice-First, pas de navigation UI).
SURGICAL_ACTIONS = ["show_hysterectomy", "grow_lesion", "identify_structure", "add_note"]

# Mappage module → synonymes oraux (normalisés sans accent).
SPECIALTY_SYNONYMS: Dict[str, Tuple[str, ...]] = {
    "switch_hbp": ("hbp", "hepato", "hepatique", "foie", "hépatique", "voie biliaire"),
    "switch_colorectal": ("colorectal", "colon", "rectum", "intestin", "côlon"),
    "switch_gastrique": ("gastrique", "estomac", "gastrectomie"),
    "switch_thyroide": ("thyroïde", "thyr", "glande thyroïde", "thyroide"),
    "switch_thoracique": ("thoracique", "poumon", "poumons", "poitrine"),
    "switch_cardiaque": ("cardiaque", "cœur", "valve", "cardiaque"),
    "switch_urologie": ("urologie", "rénal", "renal", "prostate", "vessie"),
    "switch_gynecologie": ("gynécologie", "gyneco", "hystérectomie", "hystrectomie", "utérus", "utero", "hysté"),
}

# Couleurs chirurgicales fréquentes → nom français (pour identify_structure).
COLOR_NAMES: Dict[str, str] = {
    "4fc3f7": "bleu",
    "22c55e": "vert",
    "ff6b35": "orange",
    "ef4444": "rouge",
    "a855f7": "violet",
    "06b6d4": "turquoise",
    "14b8a6": "turquoise",
    "f59e0b": "jaune",
    "eab308": "jaune",
    "38bdf8": "bleu clair",
    "ffffff": "blanc",
    "000000": "noir",
}

# Mot-clés par action de navigation (tokens normalisés sans accent).
NAV_KEYWORDS: Dict[str, Tuple[str, ...]] = {
    "vue_3d": ("vue 3d", "affiche la 3d", "revenir a la 3d", "mode 3d", "vue 3d"),
    "vue_mpr": ("vue mpr", "coupe", "mode coupe", "vues en coupes", "coupage"),
    "zoom_avant": ("zoom avant", "rapproche", "agrandis", "grossir", "zoom positif", "approche"),
    "zoom_arriere": ("zoom arriere", "eloigne", "dezoome", "ecloigne", "zoom negatif", "reculer"),
    "mode_clair": ("mode clair", "theme clair", "passe en clair", "clair"),
    "mode_sombre": ("mode sombre", "theme sombre", "passe en sombre", "sombre"),
    "open_analyse": ("ouvre l analyse", "ouvre l'analyse", "montre le risque", "volumétrie", "ouvre la volumetrie", "la volumetrie"),
    "open_ia": ("ouvre le chat", "ouvre l'ia", "ouvre le chat ia", "ouvre le chat"),
    "open_plan": ("ouvre le plan", "plan chirurgical"),
    "open_implants": ("ouvre les implants", "implants"),
    "open_patients": ("ouvre la base patients", "base patients", "patients", "ouvre les patients"),
    "open_settings": ("ouvre les parametres", "ouvre les paramètres", "parametres", "parametres"),
    "close_modal": ("ferme", "ferme la fenetre", "ferme la fenêtre", "fermer", "ferme la fenetre"),
    "recalc_analysis": ("recalcule l analyse", "recalcule l'analyse", "recalcule le risque", "recalculer", "recalcule"),
    "export_plan": ("exporte le plan", "exporter le plan", "export"),
}


@dataclass(frozen=True)
class VoiceCommandIntent:
    """Intention structurée résolue à partir d'un énoncé vocal.

    `action` correspond exactement à une clé de `glActionMap()` côté frontend
    (`[ACTION:<action>]`) ou vaut `"chat"` / `None` lorsqu'aucune action
    explicite n'est reconnue → la réponse est traitée comme conversationnelle.
    """
    intent: str
    action: Optional[str]
    params: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    reply: str = ""
    notes_tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "intent": self.intent,
            "action": self.action,
            "params": self.params,
            "confidence": round(self.confidence, 2),
            "reply": self.reply,
            "notes_tags": list(self.notes_tags),
        }


@dataclass
class VoiceCommandContext:
    """Contexte patient/procédure disponible pour aiguiller la résolution."""
    patient_id: Optional[str] = None
    specialty: Optional[str] = None
    language: str = "fr"
    available_modules: Tuple[str, ...] = (
        "hbp", "colorectal", "gastrique", "thyroide",
        "thoracique", "cardiaque", "urologie", "gynecologie",
    )


_WAKE_RE = re.compile(r"^(sur[.\s]?sim|sur sim|hey\surgsim|sur-sim|assistant)\s*[,.]?\s*", re.I)
_PCT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*[%‰]?", re.I)
_NOTE_PREFIX_RE = re.compile(r"^\s*(?:note|not[ée]?|not[ée])\s*[:]\s*(.*)$", re.I)


def _strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))


def _normalize(text: str) -> str:
    """Lowercase, strip accents, collapse whitespace — tolérant aux fautes STT."""
    no_accents = _strip_accents(text).lower()
    no_accents = re.sub(r"[\u2019']", " ", no_accents)
    return re.sub(r"\s+", " ", no_accents).strip()


def _has_any(normalized: str, tokens: Tuple[str, ...]) -> bool:
    return any(tok in normalized for tok in tokens if tok)


def _extract_percentage(text: str) -> Optional[float]:
    m = _PCT_RE.search(text)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None


def _first_color_mentioned(text: str) -> Optional[str]:
    n = _normalize(text)
    for hex_key, name in COLOR_NAMES.items():
        if name in n:
            return name
    for name in ("bleu", "rouge", "vert", "jaune", "orange", "violet", "rose", "blanc", "noir", "turquoise"):
        if name in n:
            return name
    return None


def _tags_from_text(text: str) -> List[str]:
    """Extrait des tags cliniques pertinents d'un texte de note libre.
    `text` est normalisé en interne (sans accent) : les mots-clés ci-dessous
    le sont aussi pour garantir la correspondance accent-insensible."""
    n = _normalize(text)
    tags: List[str] = []
    if "etudiant" in n or "interne" in n or "junior" in n:
        tags.append("étudiant")
    if "difficile" in n or "difficulte" in n or "mal a l'aise" in n:
        tags.append("difficulté")
    if "marge" in n:
        tags.append("marges")
    if "uterine" in n or "utero" in n or "uterus" in n or "hysterectomie" in n or "hyst" in n:
        tags.append("utérines")
    if "tumeur" in n or "tumorale" in n or "tumor" in n:
        tags.append("tumeur")
    if "vasculaire" in n:
        tags.append("vasculaire")
    return tags


def _resolve_add_note(text: str) -> Optional[VoiceCommandIntent]:
    m = _NOTE_PREFIX_RE.match(text)
    if not m:
        return None
    note_text = m.group(1).strip()
    if not note_text:
        return None
    tags = _tags_from_text(text)
    return VoiceCommandIntent(
        intent="add_note",
        action="add_note",
        params={"text": note_text, "tags": tags},
        confidence=0.95,
        reply=f"Note enregistrée : « {note_text} »"
              + (f" (tags : {', '.join(tags)})" if tags else ""),
        notes_tags=tags,
    )


def _resolve_grow_lesion(text: str) -> Optional[VoiceCommandIntent]:
    n = _normalize(text)
    if not ("tumeur" in n or "lésion" in n or "lesion" in n or "masse" in n) or "augment" not in n:
        return None
    pct = _extract_percentage(text)
    if pct is None:
        pct = 50.0
    return VoiceCommandIntent(
        intent="grow_lesion",
        action="grow_lesion",
        params={"delta_pct": pct, "mode": "scale_up"},
        confidence=0.95 if pct != 50.0 else 0.9,
        reply=f"Augmentation de la taille de la tumeur de {pct:g} % — relancez le calcul des marges.",
    )


def _resolve_identify_structure(text: str) -> Optional[VoiceCommandIntent]:
    # "C'est quoi cette structure en bleu ?" → l'apostrophe devient un espace par
    # _normalize(), on ne peut donc pas matcher "c'est quoi" tel quel : on détecte
    # l'intention d'interrogation ("quoi" ou "quelle est") + présence de "structure".
    n = _normalize(text)
    asking = ("quoi" in n) or ("quelle" in n and "est" in n)
    pointing = ("structure" in n) or ("couleur" in n)
    if not (asking and pointing):
        return None
    color = _first_color_mentioned(text)
    return VoiceCommandIntent(
        intent="identify_structure",
        action="identify_structure",
        params={"color": color, "raycast": True, "origin": "screen_center"},
        confidence=0.9 if color else 0.8,
        reply="Identification de la structure pointée au centre de l'écran."
              + (f" Couleur détectée : {color}." if color else ""),
    )


def _resolve_show_hysterectomy(text: str) -> Optional[VoiceCommandIntent]:
    # "hyst" préfixe suffit : hystérectomie, hystéctomie, hysterectomie (STT anglaise)
    # se normalisent toutes en une chaîne contenant "hyst".
    n = _normalize(text)
    if "hyst" not in n and "hysté" not in n:
        return None
    obese = any(w in n for w in ("obèse", "obese", "obésité", "obesite", "graisseuse", "ima", "bmi"))
    params: Dict[str, Any] = {"procedure": "hystérectomie", "module": "gynecologie"}
    if obese:
        params["obesity_hint"] = True
    return VoiceCommandIntent(
        intent="show_hysterectomy",
        action="show_hysterectomy",
        params=params,
        confidence=0.95 if obese else 0.9,
        reply="Ouverture du module Gynécologie — hystérectomie"
              + (" chez patiente obèse (IMC élevé, adipeuse)." if obese else "."),
    )


# Paired on/off à toggler vocal : l'ON et l'OFF partagent un vocabulaire qui chevauche
# (ex. "mode OR" peut être allumé OU, avec "quitte", éteint). On détecte d'abord la
# négation → OFF prioritaire, sinon ON. Ordre de déclaration = ordre de priorité.
_TOGGLE_NEGATIONS = ("quitte", "quitter", "desactive", "desactive", "déconnecte", "deverrouille", "deverrouiller", "fin", "off")

TOGGLE_PAIRS = [
    # (on_action, off_action, on_keywords, off_keywords)
    ("bloc_operatoire_on", "bloc_operatoire_off",
     ("mode or", "mode bloc", "active le bloc", "ouvre le bloc"),
     ("quitte le mode or", "quitte le mode bloc", "desactive le bloc", "ferme le bloc")),
    ("mode_tactile_on", "mode_tactile_off",
     ("mode tactile", "active le tactile"),
     ("desactive le tactile", "quitter le tactile", "desactive le mode tactile")),
    ("mode_lecture_seule_on", "mode_lecture_seule_off",
     ("lecture seule", "verrouille l ecran", "verrouille"),
     ("desactive la lecture seule", "deverrouille", "deverrouiller")),
]


def _resolve_toggles(n: str) -> Optional[str]:
    """Renvoie l'action toggle (on/off) reconnue, ou None."""
    negated = any(w in n for w in _TOGGLE_NEGATIONS)
    for on_act, off_act, on_kw, off_kw in TOGGLE_PAIRS:
        on_match = _has_any(n, on_kw)
        off_match = _has_any(n, off_kw)
        if on_match or off_match:
            if off_match or (on_match and negated):
                return off_act
            return on_act
    return None


def _resolve_nav(text: str) -> Optional[VoiceCommandIntent]:
    n = _normalize(text)
    toggle = _resolve_toggles(n)
    if toggle:
        on = toggle.endswith("_on")
        return VoiceCommandIntent(
            intent="navigation",
            action=toggle,
            confidence=0.9,
            reply=f"Mode {'activé' if on else 'désactivé'} — {toggle.replace('_', ' ')}.",
        )
    for action, syns in SPECIALTY_SYNONYMS.items():
        if _has_any(n, syns):
            module = action.replace("switch_", "")
            return VoiceCommandIntent(
                intent="switch_module",
                action=action,
                params={"module": module},
                confidence=0.9,
                reply=f"Module {module} sélectionné.",
            )
    for action, keywords in NAV_KEYWORDS.items():
        if _has_any(n, keywords):
            return VoiceCommandIntent(
                intent="navigation",
                action=action,
                confidence=0.9,
                reply=f"Action d'interface : {action.replace('_', ' ')}.",
            )
    return None


_SURGICAL_RESOLVERS = (
    _resolve_add_note,
    _resolve_grow_lesion,
    _resolve_identify_structure,
    _resolve_show_hysterectomy,
)


def resolve_voice_command(
    transcript: str,
    context: Optional[VoiceCommandContext] = None,
) -> VoiceCommandIntent:
    """Résout une transcription vocale en intention structurée + action-token partagé.

    Tolère les fautes d'orthographe/typographie courantes de la STT (accents,
    apostrophes, espaces insécables). Une confiance < 1.0 signale au frontend
    qu'il peut demander une clarification à l'utilisateur.
    """
    if not transcript or not transcript.strip():
        return VoiceCommandIntent(intent="chat", action=None, confidence=0.0,
                                  reply="Je n'ai pas entendu de commande.")

    context = context or VoiceCommandContext()
    text = _WAKE_RE.sub("", transcript)

    for resolver in _SURGICAL_RESOLVERS:
        intent = resolver(text)
        if intent:
            return intent

    nav = _resolve_nav(text)
    if nav:
        return nav

    return VoiceCommandIntent(
        intent="chat",
        action=None,
        confidence=0.3,
        reply="Je suis désolé, je n'ai pas bien compris. Reformulez ou dites « aide » pour la liste des commandes.",
    )


def voice_command_help() -> List[str]:
    """Renvoie la liste lisible des commandes vocales (pour l'UI d'aide)."""
    return [
        "SurSim, montre-moi une hystérectomie chez une patiente obèse",
        "Augmente la taille de la tumeur de 50 %",
        "C'est quoi cette structure en bleu ?",
        "Note : cet étudiant est en difficulté sur les marges utérines",
        "Vue 3D / Vue MPR / Zoom avant / Zoom arrière",
        "Mode clair / Mode sombre / Mode bloc opératoire / Mode tactile / Lecture seule",
        "Ouvre l'analyse / Ouvre le plan / Ouvre les implants / Ouvre les paramètres",
        "Recalcule l'analyse / Exporte le plan / Ferme la fenêtre",
        "Passe au module HBP / Colorectal / Gastrique / Thyroïde / Thoracique / Cardiaque / Urologie / Gynécologie",
    ]
