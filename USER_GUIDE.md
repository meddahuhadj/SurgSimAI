# 🏥 Guide de Prise en Main & Maîtrise Complète : GeneralSurgPlan3D & GenyPedPlan3D

Bienvenue dans le guide d'utilisation et de maîtrise opérationnelle de **GeneralSurgPlan3D NextGen** et son module spécialisé **GenyPedPlan3D** (Gynécologie & Pédiatrie). 

Cette plateforme chirurgicale modulaire combine **segmentation 3D par IA**, **volumétrie prédictive**, **calcul de risque périopératoire** et **gestion de bloc opératoire**, avec une étanchéité stricte entre le **Cœur Clinique Certifiable** (MDR UE 2017/745 Classe IIb) et les **Modules de Recherche Expérimentaux**.

---

## 📋 Sommaire Executif

1. [Principes d'Architecture & Guardrails Réglementaires](#1-principes-darchitecture--guardrails-réglementaires)
2. [Authentification Forte & 2FA TOTP](#2-authentification-forte--2fa-totp)
3. [Workflow Opératoire Complet (6 Étapes)](#3-workflow-opératoire-complet-6-étapes)
   - [Étape 1 : Gestion Patient & Import DICOM](#étape-1--gestion-patient--import-dicom)
   - [Étape 2 : Inférence 3D & Volumétrie Organique](#étape-3-inférence-3d--volumétrie-organique)
   - [Étape 3 : Calcul des Marges Chirurgicales 3D (R0/R1)](#étape-3--calcul-des-marges-chirurgicales-3d-r0r1)
   - [Étape 4 : Scores Cliniques Périopératoires](#étape-4--scores-cliniques-périopératoires)
   - [Étape 5 : Command Center du Bloc Opératoire](#étape-5--command-center-du-bloc-opératoire)
   - [Étape 6 : Validation Médicale, Signature PRRC & Export FHIR](#étape-6--validation-médicale-signature-prrc--export-fhir)
4. [Monitoring de Sécurité HDS & Registre d'Audit](#4-monitoring-de-sécurité-hds--registre-daudit)
5. [Commandes de Maintenance & Exécution des Tests](#5-commandes-de-maintenance--exécution-des-tests)

---

## 1. Principes d'Architecture & Guardrails Réglementaires

L'application est structurée autour d'une séparation hermétique :

* **Cœur Clinique (`Core`)** : Validé par 185+ tests automatisés. Inclut la gestion patient, l'import DICOM, le calcul de volumétrie/marges, les scores cliniques et la traçabilité d'audit.
* **Mode Recherche (`RESEARCH_MODE`)** : Prototypes expérimentaux (IA générative, réalité augmentée, visio-navigation). En production, un modal de mise en garde réglementaire (**IEC 62366-1**) informe l'utilisateur que ces modules ne doivent pas servir de base décisionnelle autonome.

---

## 2. Authentification Forte & 2FA TOTP

1. **Connexion initialisatrice** :
   - Connectez-vous avec vos identifiants chirurgien ou administrateur.
   - En environnement de production (`APP_ENV=production`), l'activation de la **Double Authentification (2FA TOTP)** est **obligatoire**. L'accès aux endpoints est verrouillé par un code HTTP `403 Forbidden` tant que le 2FA n'est pas configuré.
2. **Activation du 2FA** :
   - Allez dans **Paramètres** ➔ **Securité 2FA**.
   - Scannez le QR Code via votre application Google Authenticator / FreeOTP / Bitwarden.
   - Entrez le code à 6 chiffres pour valider l'enrôlement.
   - **Important** : Conservez les 8 codes de secours générés.

---

## 3. Workflow Opératoire Complet (6 Étapes)

### Étape 1 : Gestion Patient & Import DICOM
- Allez dans l'onglet **Plan** ou **DICOM**.
- Recherchez un patient existant ou créez un nouveau dossier en renseignant : Nom, Âge, Sexe, Poids, Taille, Diagnostic et Chirurgien référent.
- Pour importer une série DICOM :
  - **DICOMweb** : Interrogez le PACS hospitalier via QIDO-RS / WADO-RS.
  - **PACS Historique (DIMSE)** : Interrogez le serveur PACS via C-FIND / C-GET (port 104/11112).

### Étape 2 : Inférence 3D & Volumétrie Organique
- Lancer la segmentation automatique **TotalSegmentator** (compatible GPU/CPU).
- Le moteur génère les masques 3D et calcule les volumes :
  - **Volume de l'Organe Cible** ($V_{\text{organe}}$)
  - **Volume de la Lésion / Tumeur** ($V_{\text{tumeur}}$)
  - **Reste Fonctionnel Parenchymateux (FLR/TLV)** : Ajusté au poids et à la surface corporelle (BSA).

### Étape 3 : Calcul des Marges Chirurgicales 3D (R0/R1)
- Exécutez le moteur de sécurité des marges ([`margin_safety_engine.py`](file:///d:/Travail/GeneralSurgPlan3D%20%20MIMO/pour%20%20Claude%202/GeneralSurgPlan3D_MIMO_enrichi%20%208%20-anesthesie+reanimation/backend/margin_safety_engine.py)).
- Le système analyse la proximité 3D (KDTree) entre la lésion et les structures vasculaires critiques (Vaines hépatiques, Arpère utérine, Vena Cava) :
  - **🟢 R0_SAFE** ($\ge 10\text{ mm}$) : Résection R0 chirurgicalement realizable.
  - **🟠 CAUTION_SUBOPTIMAL** ($5 - 10\text{ mm}$) : Marge étroite ➔ Contrôle échographique peropératoire requis.
  - **🔴 R1_CRITICAL_HAZARD** ($< 5\text{ mm}$) : Danger d'invasion ➔ Prévoir clampage / geste vasculaire.

### Étape 4 : Scores Cliniques Périopératoires
- Consultez l'onglet **Anesthésie & Réanimation** pour évaluer les scores réels :
  - **Child-Pugh (A/B/C)** & **MELD-Na** : Évaluation de la réserve fonctionnelle hépatique.
  - **Score RCRI de Lee** : Calcul du pourcentage de risque d'événement cardiaque opératoire.
  - **Score SOFA & NEWS2** : Surveillance de réanimation et alerte de dysfonction d'organe Sepsis-3.

### Étape 5 : Command Center du Bloc Opératoire
- Dans l'onglet **Bloc IA / SurgOR** :
  - visualisez le planning des salles d'opération et du personnel.
  - Le **Moteur de Contraintes** empêche les chevauchements de salles, la superposition d'équipes ou la programmation d'un patient avec bilan préopératoire incomplet (**Readiness Engine**).
  - En cas de modification d'un créneau fige (**Frozen**), saisissez la raison d'urgence obligatoire pour alimenter le registre d'audit.

### Étape 6 : Validation Médicale, Signature PRRC & Export FHIR
- Une fois le plan révisé, cliquez sur **✍️ Revue & Validation Plan**.
- Le chirurgien sénior valide le plan (`validated`).
- La Personne Responsable du Respect de la Conformité (**PRRC**) appose la **signature cryptographique Ed25519** (`signed`).
- **Exportateur SIH** :
  - Exporte le dossier sous forme de **Bundle FHIR R4** (`CarePlan` + `Procedure`) via `GET /patients/{id}/plans/{id}/export/fhir`.
  - Exporte les compte-rendus structurés **DICOM SR** et les messages **HL7 v2 ORU/ADT**.

---

## 4. Monitoring de Sécurité HDS & Registre d'Audit

- Cliquez sur **🛡️ Conformité MDR** dans la barre supérieure pour ouvrir le tableau de bord temps réel.
- Ce panneau vérifie automatiquement :
  - La classification du dispositif (**MDR UE 2017/745 Classe IIb**).
  - L'état d'enforcement du 2FA et du chiffrement **PostgreSQL pgcrypto**.
  - L'étanchéité de la CI/CD (`main` vs `research/*`).
  - Le nombre de dossiers patients et d'événements enregistrés dans l'**Audit Trail infalsifiable**.

---

## 5. Commandes de Maintenance & Exécution des Tests

### Lancer le Backend FastAPI
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Exécuter la Suite de Tests Complet (185+ Tests)
```bash
pytest tests/ -v
```

### Lancer le Test de Charge Automatisé (100 VUs)
```bash
k6 run scripts/k6_load_test.js
```

### Configurer le Chiffrement PostgreSQL HDS
```bash
psql -d generalsurg -f scripts/setup_pgcrypto.sql
```
