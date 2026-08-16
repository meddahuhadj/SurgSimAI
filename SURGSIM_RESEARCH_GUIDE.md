# 🧪 SurgSim 3D — Research & Academic Guide

Bienvenue dans le guide de recherche et d'enseignement de **SurgSim 3D (V2.5)**.

> **Note importante** : SurgSim 3D est un environnement de laboratoire numérique dédié exclusivement à la **recherche scientifique**, l'**enseignement médical**, la **simulation chirurgicale** et l'**expérimentation d'interfaces Voice-First et d'IA**.

---

## 🎯 1. Principes Directeurs du Laboratoire

1. **Reproductibilité Scientifique** : Utilisation d'un `Seed` numérique unique (ex: `#8347291`) pour générer des cas anatomiques synthétiques identiques entre tous les groupes de participants.
2. **Exactitude Géométrique** : Calculs des distances minimales et des volumes effectués par le moteur 3D (*Surface-to-Surface Mesh BBox / Raycast*). L'IA n'invente jamais de métriques.
3. **Traçabilité Intégrale (Event Logger)** : Chaque clic, rotation de caméra, création de scénario ou commande vocale est horodaté et exportable aux formats JSON/CSV.
4. **Postures IA Pédagogiques** :
   - 👨‍🏫 **AI Tutor** : Explications anatomiques et physiologiques.
   - 🤝 **AI Assistant** : Alertes de proximité vasculaire en temps réel.
   - ⚔️ **AI Adversary (Surgical Debate Tutor)** : Challenge actif des décisions cliniques de l'interne.

---

## 🧪 2. Protocoles d'Expérimentation Scientifique

### Configuration d'une étude A/B

Dans le **Mode Recherche**, vous pouvez comparer plusieurs interfaces ou modes d'assistance :

| Étude | Groupe A (Contrôle) | Groupe B (Expérimental) | Endpoint Primaire |
| :--- | :--- | :--- | :--- |
| **Étude R-001** | Interface Classique (Souris) | Interface Voice-First | Temps de planification (s) |
| **Étude R-002** | Chirurgien Seul | Chirurgien + IA Assistant | Nombre d'erreurs de marge (mm) |
| **Étude R-003** | Modèle 3D Seul | 3D + Simulation & Fork A/B | Réduction du volume réséqué (%) |

### Randomisation Serveur & Verrouillage
L'API FastAPI (`/api/v2/synthetic/randomize`) attribue et verrouille automatiquement les participants aux groupes expérimentaux sans biais de navigation local.

---

## 📹 3. Session Replayer & Analyse des Interaction (HCI)

Chaque session de simulation enregistre la séquence temporelle complète des actions. 
Grâce au **Session Replayer** (`ResearchMode.replayer`), le chercheur peut rejouer pas à pas la session d'un participant :

```text
▶ PLAY | ⏸ PAUSE | [00:18] Sélection tumeur -> [00:42] Affichage VSH -> [01:13] Mesure 3D -> [03:41] Fork Scénario B
```

---

## 📥 4. Export des Données de Recherche

Les fichiers JSON et CSV exportés contiennent la structure suivante :

```json
{
  "ts": 42100,
  "event": "SCENARIO_FORK",
  "data": {
    "parentScenario": "Scénario A",
    "newScenario": "Scénario B",
    "seed": 8347291
  }
}
```

Les jeux de données sont prêts pour analyse statistique sous R, Python (Pandas) ou SPSS.
