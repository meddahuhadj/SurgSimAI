# Dossier réglementaire — Classification MDR & Gestion des risques ISO 14971

**Statut : DOCUMENT DE TRAVAIL, PAS UNE CERTIFICATION.** Ce document est un point de
départ structuré pour un futur dossier réglementaire réel. Il a été rédigé par une IA
à partir d'une lecture du code source de la plateforme (pas d'un audit clinique ni
juridique) et **doit être revu, complété et validé par un consultant en affaires
réglementaires qualifié** (et, selon la classe retenue, un organisme notifié) avant
toute soumission ou tout usage clinique réel. Voir aussi `GET /api/v2/compliance/mdr-fda-status`
([backend/voice_llm_service.py](backend/voice_llm_service.py)), qui reflète l'absence
actuelle de certification de façon honnête et doit rester cohérent avec ce document.

---

## 1. Périmètre et déclaration d'usage prévu (intended use)

### 1.1 Ce que fait la plateforme aujourd'hui (fonctions candidates à la certification)

Ces fonctions sont actives par défaut (`RESEARCH_MODE=false`, voir [backend/main.py](backend/main.py))
et constituent le périmètre réel à classifier :

| Fonction | Fichier(s) | Nature |
|---|---|---|
| Segmentation anatomique DICOM (TotalSegmentator) | [backend/segmentation_service.py](backend/segmentation_service.py), [backend/segmentation_specialties.py](backend/segmentation_specialties.py) | Traitement d'image médicale, sortie utilisée pour la planification |
| Recalage rigide + non-rigide (ICP + FFD B-spline) | [backend/registration.py](backend/registration.py) | Alignement pré-op/peropératoire |
| Cycle de plan chirurgical versionné (draft→reviewed→validated) | [backend/routers/plans.py](backend/routers/plans.py) | Documentation et validation humaine d'une stratégie chirurgicale |
| Simulation PK/PD anesthésie (Schnider/Minto) + MABL | [backend/routers/pkpd_anesthesia.py](backend/routers/pkpd_anesthesia.py) | Aide à la décision posologique |
| Scores cliniques USI (SOFA, Glasgow, NEWS2, alerte sepsis) | [backend/clinical_scores.py](backend/clinical_scores.py) | Calcul de score clinique standardisé |
| Connecteurs PACS (DICOMweb QIDO/WADO-RS) | [backend/pacs_client.py](backend/pacs_client.py) | Import d'imagerie réelle |
| Export FHIR R4 / HL7 v2 | [backend/interop.py](backend/interop.py) | Interopérabilité SIH |
| Chat IA cloud (Gemini/Groq) avec pseudonymisation | routers `chat`, [backend/phi_filter.py](backend/phi_filter.py) | Assistance conversationnelle, PAS un moteur de décision clinique autonome |

### 1.2 Ce qui est explicitement HORS périmètre de certification

Tous les modules chargés uniquement si `RESEARCH_MODE=true` (nanorobotique, interface
cerveau-machine, bioimpression, organoïdes, robotique RAS, épigénétique...) sont des
prototypes narratifs sans matériel réel connecté — voir la liste dans `backend/main.py`
autour de `RESEARCH_MODE`. **Recommandation : ces modules ne doivent JAMAIS entrer dans
le dossier technique d'un dispositif certifié.** Les en sortir physiquement (dépôt séparé)
avant tout dépôt réglementaire simplifierait grandement l'auditabilité du dossier — c'est
un chantier distinct, non traité par ce document (voir échanges précédents avec l'utilisateur).

### 1.3 Déclaration d'usage prévu (brouillon, à valider par un chirurgien + affaires réglementaires)

> Logiciel d'aide à la planification chirurgicale et périopératoire destiné à des
> professionnels de santé qualifiés (chirurgiens, anesthésistes-réanimateurs), fournissant :
> (a) une visualisation 3D de l'anatomie patient à partir d'images DICOM segmentées,
> (b) des simulations pharmacocinétiques indicatives pour l'anesthésie,
> (c) des scores cliniques de réanimation calculés selon des échelles publiées,
> (d) un support documentaire versionné et audité pour la validation d'un plan opératoire.
> **Le logiciel ne prend et ne doit jamais prendre de décision clinique de façon
> autonome : toute sortie doit être vérifiée et validée par le professionnel de santé
> responsable avant toute décision affectant un patient réel.**

---

## 2. Classification réglementaire (hypothèse de travail)

### 2.1 Union Européenne — Règlement (UE) 2017/745 (MDR)

- **Qualification** : logiciel autonome (« Medical Device Software », MDCG 2019-11) — oui,
  car il traite des données patient (images DICOM, constantes vitales, paramètres
  pharmacocinétiques) pour produire une information utilisée à des fins de diagnostic ou
  de traitement.
- **Règle de classification applicable** : **Règle 11, Annexe VIII** — logiciel destiné à
  fournir des informations utilisées pour prendre des décisions à des fins diagnostiques ou
  thérapeutiques.
  - Si les informations peuvent entraîner une décision ayant un effet grave sur l'état de
    santé (ex. dose d'anesthésique, stratégie de résection) → **Classe IIb**, voire **III**
    si la décision peut causer un décès ou une détérioration irréversible sans possibilité
    de contrôle par un professionnel avant action (ce qui n'est pas le cas ici puisque
    toute sortie est présentée comme non-finale et nécessitant validation humaine — à
    documenter et à défendre explicitement dans le dossier).
  - **Hypothèse de travail retenue ici : Classe IIb**, compte tenu de la présence de
    modules d'aide à la décision posologique (PK/PD) et de planification de résection,
    sous réserve de confirmation formelle par un consultant en affaires réglementaires
    (la frontière IIa/IIb/III dépend de nuances précises du texte et de la jurisprudence
    MDCG qui dépassent le cadre de ce document).
- **Conséquences pratiques d'une Classe IIb** : organisme notifié obligatoire, système de
  management de la qualité ISO 13485, dossier technique complet (Annexe II/III MDR),
  évaluation clinique (MEDDEV 2.7/1 rev4 ou MDCG équivalent), PMS (Post-Market Surveillance)
  et PMCF (Post-Market Clinical Follow-up), marquage CE par organisme notifié.

### 2.2 États-Unis — FDA

- Cadre probable : **Software as a Medical Device (SaMD)**, soumission **510(k)** si un
  prédicat existe, ou **De Novo** sinon. Aucun prédicat identifié à ce jour pour ce
  périmètre précis (voir `GET /api/v2/compliance/mdr-fda-status`, qui confirme
  `NOT_SUBMITTED` et l'absence de prédicat réel).
- Cadre de risque FDA pour SaMD (IMDRF) à évaluer par fonction : la fonction PK/PD
  (« informer une décision clinique » sur un « état de santé sérieux ») situe probablement
  la plateforme en catégorie **II ou III** de la matrice IMDRF selon la fonction considérée.

### 2.3 France — hébergement de données de santé

- Si déploiement avec données patient françaises réelles : hébergement **certifié HDS**
  obligatoire (indépendant de la classification MDR), voir gap déjà identifié dans
  `README.md` (persistance/hébergement).

---

## 3. Plan de gestion des risques — squelette ISO 14971:2019

### 3.1 Processus (à formaliser dans un SMQ ISO 13485 réel)

1. Identification des dangers → 2. Estimation du risque (sévérité × probabilité) →
3. Évaluation de l'acceptabilité → 4. Mesures de maîtrise → 5. Risque résiduel →
6. Bilan bénéfice/risque global → 7. Surveillance post-commercialisation (retour terrain).

Ce document ne fournit que l'étape 1-4 à titre de brouillon, par fonction, avec les
mesures de maîtrise **déjà présentes dans le code** (traçables) — pas une analyse
formelle complète (qui nécessite une équipe pluridisciplinaire : chirurgien, ingénieur,
qualiticien, selon ISO 14971 §4.2).

### 3.2 Table des dangers identifiés (brouillon, non exhaustif)

| # | Fonction | Danger identifié | Cause possible | Mesure de maîtrise déjà en place | Risque résiduel / action requise |
|---|---|---|---|---|---|
| R1 | PK/PD anesthésie | Le clinicien interprète la courbe Cp/Ce comme un profil de perfusion réel et ajuste le dosage en conséquence | Le modèle est une approximation mono-exponentielle (pas un algorithme de pompe TCI complet) — voir `PKPD_CURVE_NOTE` dans [backend/routers/pkpd_anesthesia.py](backend/routers/pkpd_anesthesia.py) | Champ `note` explicite sur chaque réponse ; libellé UI "aide à la décision non certifiée" | **Action requise** : bannière de confirmation active (pas seulement du texte passif) avant tout export/impression de ces valeurs dans un document patient |
| R2 | Segmentation TotalSegmentator | Faux négatif/positif sur une structure anatomique (ex. vaisseau non détecté) menant à une erreur de planification de résection | Limite intrinsèque du modèle nnU-Net (pas de garantie de sensibilité/spécificité publiée pour CE périmètre précis) | `GET /segmentation/capabilities` déclare l'état réel du pipeline ; échec explicite si dépendances absentes (pas de repli silencieux vers une fausse segmentation) | **Action requise** : jeu de validation avec métriques Dice/Hausdorff par structure et par spécialité, publiées dans l'UI (gap déjà identifié précédemment, non traité) |
| R3 | Recalage ICP+FFD | Recalage convergé mais anatomiquement incorrect (minimum local) utilisé en confiance | Limite algorithmique connue de l'ICP (sensible à l'initialisation) | Réponse inclut RMS réel calculé + `note` indiquant l'absence de validation clinique ([backend/registration.py](backend/registration.py)) | **Action requise** : seuil de RMS au-delà duquel l'UI bloque l'affichage plutôt que d'afficher un résultat "convergé" trompeur |
| R4 | Cycle de plan chirurgical | Un plan `draft` non finalisé est confondu avec un plan `validated` au bloc | Erreur d'interface / lecture rapide | Statuts distincts en base, workflow serveur qui refuse la modification d'un plan figé ([backend/routers/plans.py](backend/routers/plans.py)) | Risque résiduel jugé faible si l'UI affiche le statut de façon proéminente — **à vérifier par test d'utilisabilité réel (IEC 62366-1)**, pas seulement par relecture de code |
| R5 | Scores USI (NEWS2/SOFA) | Score mal calculé conduit à une sous-estimation de la gravité | Erreur de formule | Formules vérifiées contre RCP 2017 (NEWS2) et Vincent et al. 1996 (SOFA) ; calcul serveur = source de vérité, aperçu client clairement secondaire ([backend/clinical_scores.py](backend/clinical_scores.py)) | Risque résiduel faible ; **action requise** : tests de non-régression sur des cas cliniques publiés (pas seulement des cas synthétiques) |
| R6 | Chat IA cloud (Gemini/Groq) | Hallucination du LLM présentée comme un fait clinique | Limite inhérente aux LLM généralistes | Pseudonymisation avant envoi ; le chat n'écrit jamais directement dans le dossier patient sans action explicite de l'utilisateur | **Action requise** : bandeau permanent "vérifier toute information avant usage clinique" sur l'interface de chat, pas seulement au premier lancement |
| R7 | Panne base de données / perte de données | Perte du plan chirurgical ou du suivi USI avant validation | SQLite éphémère en environnement de démo (Render gratuit) | Guardrail qui bloque le démarrage en `APP_ENV=production` avec config non sûre ([backend/main.py](backend/main.py)) | Risque résiduel élevé tant qu'un hébergement PostgreSQL persistant + sauvegardes n'est pas en place en production réelle (gap déjà identifié) |
| R8 | Accès non autorisé aux données patient | Fuite de données de santé | Authentification faible / absence de 2FA | JWT + 2FA TOTP opt-in, audit trail complet, garde-fous production ([backend/security.py](backend/security.py)) | **Action requise** : rendre la 2FA obligatoire (pas seulement opt-in) pour tout rôle ayant accès à des données patient réelles avant mise en production |

### 3.3 Bénéfice/risque global (à compléter par un chirurgien référent)

Non renseigné — nécessite une évaluation clinique formelle (littérature comparable +
avis d'expert), hors de portée d'une analyse de code.

---

## 4. Classification logicielle IEC 62304 (brouillon)

- **Classe proposée : B** (défaillance logicielle pouvant entraîner une blessure non
  sérieuse) pour les fonctions d'aide à la décision avec validation humaine obligatoire
  documentée (R1-R6 ci-dessus) — **à confirmer**, une réévaluation vers la Classe C
  n'est pas à exclure si l'évaluation clinique bénéfice/risque (§3.3) montre qu'une
  défaillance non détectée pourrait causer un dommage sérieux avant qu'un clinicien
  n'intervienne.
- **Écarts identifiés par rapport à un dossier IEC 62304 complet** :
  - ✅ Gestion de configuration : présente (git, historique de commits horodaté).
  - ✅ Tests de vérification : présents (277 tests automatisés, exécutés en CI GitHub Actions).
  - ❌ Plan de développement logiciel formel (SDP) : absent.
  - ❌ Spécification des exigences logicielles (SRS) tracée formellement vers les tests : absente (les tests existent mais ne sont pas reliés à des exigences numérotées).
  - ❌ Liste SOUP (Software of Unknown Provenance) avec évaluation de risque par dépendance tierce (TotalSegmentator, dicomweb-client, etc.) : absente.
  - ❌ Processus formel de résolution de problèmes (bug tracker relié à une procédure documentée) : absent (actuellement géré de façon ad hoc via conversations et commits).
  - ❌ Rapport de vérification/validation logicielle formel : absent (les tests passent, mais aucun rapport de synthèse signé n'existe).

---

## 5. Plan d'action priorisé (issu de ce document)

1. Faire trancher la classification MDR/IEC 62304 réelle par un consultant en affaires
   réglementaires qualifié — tout le reste en dépend.
2. Sortir les modules `RESEARCH_MODE` du périmètre auditable (dépôt séparé).
3. Construire le jeu de validation clinique (Dice/Hausdorff segmentation, erreur de
   recalage en mm, cas cliniques publiés pour les scores USI) — condition nécessaire à
   toute évaluation clinique MDR.
4. Rendre la 2FA obligatoire pour tout accès à des données patient réelles.
5. Hébergement PostgreSQL persistant + chiffrement au repos + sauvegardes + HDS si
   données françaises réelles (gap déjà en cours de traitement séparément).
6. Formaliser SDP, SRS tracée, liste SOUP et processus de résolution de problèmes
   (IEC 62304) une fois la classification confirmée.

---

*Document généré par IA à partir d'une lecture du code source le 2026-08-08. Ne
constitue ni un avis juridique, ni un avis médical, ni une évaluation réglementaire
opposable. À faire réviser par un professionnel qualifié avant toute utilisation
officielle.*
