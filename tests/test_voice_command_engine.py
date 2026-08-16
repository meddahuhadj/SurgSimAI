# -*- coding: utf-8 -*-
"""
test_voice_command_engine.py — Tests de l'interpréteur NLU Voice-First (cerveau serveur partagé avec le frontend).

Couverture :
  - Les 4 intents chirurgicaux du cahier des charges (hystérectomie/obèse, +50 % tumeur,
    identification structure bleue, note d'étudiant en difficulté).
  - Résilience STT : accents, apostrophes, espace insécable, wake-word "SurSim".
  - Extraction de paramètres (pourcentage, couleur, texte de note, tags).
  - Navigation existante (vue 3D/MPR, zoom, thème, bloc OR, ouverture d'onglet, export…).
  - Commutation d'module par spécialité.
  - Fallback conversationnel + entrée vide.
  - Cohérence du vocabulaire d'action avec le frontend (glActionMap()).
"""
import pytest

from voice_command_engine import (
    resolve_voice_command,
    VoiceCommandContext,
    voice_command_help,
    NAV_ACTIONS,
    SURGICAL_ACTIONS,
)


# ── Intent chirurgical : hystérectomie chez patiente obèse ──

def test_show_hysterectomy_obese_patient():
    i = resolve_voice_command("SurSim, montre-moi une hystérectomie chez une patiente obèse")
    assert i.intent == "show_hysterectomy"
    assert i.action == "show_hysterectomy"
    assert i.params["procedure"] == "hystérectomie"
    assert i.params["module"] == "gynecologie"
    assert i.params["obesity_hint"] is True
    assert i.confidence >= 0.9


def test_show_hysterectomy_without_obesity_hint():
    i = resolve_voice_command("Montre une hystérectomie")
    assert i.intent == "show_hysterectomy"
    assert "obesity_hint" not in i.params


def test_hysterectomy_typo_and_english_stt():
    # STT peut produire "hysterectomie" (anglicisme) ou perdre les accents.
    for utt in ("hystérectomie", "hysterectomie", "hystéctomie"):
        i = resolve_voice_command(f"Montre-moi une {utt}")
        assert i.intent == "show_hysterectomy", utt


# ── Intent chirurgical : agrandir la tumeur ──

def test_grow_lesion_with_percentage():
    i = resolve_voice_command("Augmente la taille de la tumeur de 50 %")
    assert i.intent == "grow_lesion"
    assert i.action == "grow_lesion"
    assert i.params["delta_pct"] == 50.0
    assert i.params["mode"] == "scale_up"


def test_grow_lesion_default_percentage_when_absent():
    i = resolve_voice_command("Augmente la taille de la tumeur")
    assert i.params["delta_pct"] == 50.0


def test_grow_lesion_non_integer_percentage():
    i = resolve_voice_command("Augmente la taille de la tumeur de 12,5 pour cent")
    assert i.intent == "grow_lesion"
    assert i.params["delta_pct"] == 12.5


def test_grow_lesion_rejects_unrelated_growth():
    # "Augmente le zoom" n'est pas une demande de taille de tumeur.
    i = resolve_voice_command("Augmente le zoom avant")
    assert i.intent == "navigation"
    assert i.action == "zoom_avant"


# ── Intent chirurgical : identifier une structure pointée ──

def test_identify_structure_with_color():
    i = resolve_voice_command("C'est quoi cette structure en bleu ?")
    assert i.intent == "identify_structure"
    assert i.action == "identify_structure"
    assert i.params["color"] == "bleu"
    assert i.params["raycast"] is True
    assert i.params["origin"] == "screen_center"


def test_identify_structure_without_color_mentioned():
    i = resolve_voice_command("C'est quoi cette structure ?")
    assert i.intent == "identify_structure"
    assert i.params["color"] is None


def test_identify_structure_apostrophe_normalized():
    i = resolve_voice_command("Quelle est cette structure en rouge ?")
    assert i.intent == "identify_structure"
    assert i.params["color"] == "rouge"


# ── Intent chirurgical : note libre ──

def test_add_note_student_difficulty():
    i = resolve_voice_command("Note: cet étudiant est en difficulté sur les marges utérines")
    assert i.intent == "add_note"
    assert i.action == "add_note"
    assert "étudiant" in i.params["text"]
    assert "marges" in i.notes_tags
    assert "difficulté" in i.notes_tags
    assert "utérines" in i.notes_tags


def test_add_note_without_prefix_is_not_a_note():
    i = resolve_voice_command("Le patient présente des marges utérines étroites")
    assert i.intent == "chat"


def test_add_note_empty_text_falls_through():
    i = resolve_voice_command("Note:")
    assert i.intent == "chat"


# ── Navigation & commutation de module ──

@pytest.mark.parametrize("utterance,action", [
    ("Vue 3D", "vue_3d"),
    ("affiche la 3D", "vue_3d"),
    ("vue MPR", "vue_mpr"),
    ("mode coupe", "vue_mpr"),
    ("zoom avant", "zoom_avant"),
    ("rapproche", "zoom_avant"),
    ("éloigne", "zoom_arriere"),
    ("mode clair", "mode_clair"),
    ("passe en sombre", "mode_sombre"),
    ("active le bloc opératoire", "bloc_operatoire_on"),
    ("quitte le mode OR", "bloc_operatoire_off"),
    ("mode tactile", "mode_tactile_on"),
    ("ouvre l'analyse", "open_analyse"),
    ("montre le risque", "open_analyse"),
    ("exporte le plan", "export_plan"),
    ("recalcule l'analyse", "recalc_analysis"),
    ("ferme la fenêtre", "close_modal"),
    ("mode tactile", "mode_tactile_on"),
    ("désactive le tactile", "mode_tactile_off"),
    ("mode bloc opératoire", "bloc_operatoire_on"),
    ("quitte le mode OR", "bloc_operatoire_off"),
    ("active la lecture seule", "mode_lecture_seule_on"),
    ("déverrouille", "mode_lecture_seule_off"),
])
def test_navigation_actions(utterance, action):
    i = resolve_voice_command(utterance)
    assert i.intent in ("navigation", "switch_module"), utterance
    assert i.action == action, f"{utterance} -> {i.action} (attendu {action})"


@pytest.mark.parametrize("utterance,module", [
    ("passe au module HBP", "hbp"),
    ("passe au hub colorectal", "colorectal"),
    ("passe au module gastrique", "gastrique"),
    ("passe au module thyroïde", "thyroide"),
    ("passe au module urologie", "urologie"),
    ("module gynecologie", "gynecologie"),
])
def test_switch_module_actions(utterance, module):
    i = resolve_voice_command(utterance)
    assert i.intent == "switch_module", utterance
    assert i.action == f"switch_{module}"
    assert i.params["module"] == module


# ── Résilience STT & fallback ──

def test_wake_word_prefix_stripped():
    i = resolve_voice_command("SurSim, vue 3D")
    assert i.action == "vue_3d"


def test_empty_or_nonsense_returns_chat():
    assert resolve_voice_command("").intent == "chat"
    assert resolve_voice_command("   ").intent == "chat"
    assert resolve_voice_command("blirz").intent == "chat"
    assert resolve_voice_command("blirz").action is None


def test_context_optional_and_accepted():
    i = resolve_voice_command("Augmente la tumeur de 30 %", VoiceCommandContext(patient_id="P1", specialty="hbp"))
    assert i.intent == "grow_lesion"
    assert i.params["delta_pct"] == 30.0


def test_action_vocabulary_is_consistent_for_frontend():
    # Tout action renvoyé par le résolveur doit être une clé valide de glActionMap()
    # (frontend) ou un fallback chat. Cohérence du contrat d'interface.
    utterances = [
        "Vue 3D", "Vue MPR", "zoom avant", "zoom arrière",
        "mode clair", "mode sombre", "active le bloc opératoire",
        "mode tactile", "lecture seule", "ouvre l'analyse", "ouvre le chat",
        "ouvre le plan", "exporte le plan", "ferme la fenêtre",
        "passe au module HBP", "montre-moi une hystérectomie obèse",
        "augmente la tumeur de 50 %", "c'est quoi cette structure en bleu ?",
        "Note: difficulté marges utérines",
    ]
    for u in utterances:
        i = resolve_voice_command(u)
        assert i.action in NAV_ACTIONS or i.action in SURGICAL_ACTIONS or i.action is None or i.action == "chat", u


def test_help_list_is_non_empty():
    help_text = voice_command_help()
    assert len(help_text) >= 9
    assert any("hystérectomie" in cmd.lower() for cmd in help_text)
