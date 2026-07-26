

## 11. Stratégie de tests unitaires et cliniques

### 11.1 Pyramide de tests

```
                    ╱╲
                   ╱  ╲           E2E clinique (manuels + assistés)
                  ╱ 5% ╲          Sur dossiers réels, 1-2 services/unit
                 ╱──────╲
                ╱        ╲       Tests d'intégration
               ╱   15%    ╲      Services + DB + dépendances externes (mocks)
              ╱────────────╲
             ╱              ╲   Tests contractuels
            ╱      10%        ╲  Pact par consommateur, OpenAPI
           ╱──────────────────╲
          ╱                    ╲ Tests composants / unitaires
         ╱        70%            ╲ Fonctions, classes, modules
        ╱──────────────────────────╲
```

### 11.2 Couverture cible

| Couche | Couverture de ligne cible | Couverture de branche cible |
|---|---|---|
| Code métier (services, domaine) | ≥ 90 % | ≥ 85 % |
| Adaptateurs (DB, HTTP, PACS, FHIR) | ≥ 80 % | ≥ 75 % |
| Front (UI/3D) | ≥ 70 % | — |
| Algorithmes critiques (segmentation, simulation, jumeau) | ≥ 95 % | ≥ 90 % |
| Code généré | exclu | exclu |
| Glue code (config, DI) | ≥ 60 % | ≥ 50 % |

Seuils bloquants en CI : `coverage fail-under = 85` global, `90` pour les modules classés IEC 62304 classe C (IA décisionnelle, navigation, jumeau).

### 11.3 Tests unitaires

#### 11.3.1 Frameworks

- **Back Python** : `pytest` + `pytest-asyncio` + `hypothesis` (property-based) + `pytest-mock` + `pytest-benchmark` + `coverage` + `pytest-xdist` (parallélisation).
- **Back Rust** : `cargo test` (intégré) + `proptest` (property-based) + `criterion` (bench) + `cargo-mutants` (mutation testing) + `cargo-llvm-cov`.
- **Front** : `vitest` (rapide, ESM natif) + `@testing-library/dom` + `playwright` (composants) + `three-mock` (mock WebGL) + `happy-dom`.

#### 11.3.2 Exemples de tests unitaires (nouveau code)

**`twin/biomech.test.py`** : test de la fonction `Mooney-Rivlin energy` sur 1000 points aléatoires (hypothesis), vérification que l'énergie est ≥ 0, que le gradient tend vers 0 à l'état de repos, invariance par rotation.

**`sim/cut.test.py`** : test de la fonction `cut_mesh` : conservation du volume à 5 % près, pas d'arêtes non-manifold, comptage de sommets cohérent, idempotence sur coupe dégénérée.

**`ia/predict/calibration.test.py`** : test que les scores calibrés ont un Brier < 0.2 sur un dataset synthétique dont le taux d'événement est connu, et que les courbes de calibration sont dans l'enveloppe.

**`auth/passkey.test.py`** : test que la cérémonie WebAuthn rejette une signature contrefaite, accepte un nonce correct, et respecte le timeout.

#### 11.3.3 Mutation testing

- Objectif : ≥ 75 % de mutants tués sur les classes C IEC 62304.
- Outils : `mutmut` (Python), `cargo-mutants` (Rust), `stryker` (JS).
- Exécuté en CI nightly (pas sur chaque PR, trop long).

### 11.4 Tests d'intégration

#### 11.4.1 Environnements

- **local-dev** : docker-compose, données synthétiques, démarre en 5 min.
- **CI** : ephemeral par PR, base PostgreSQL éphémère (testcontainers), Redis, NATS, MinIO, Qdrant, Vault, Orthanc (mini-PACS).
- **staging** : dédié, données synthétiques réalistes, GPU disponible pour tests segmentation/simulation.

#### 11.4.2 Exemples

**`integration/pacs_dicomweb.test.py`** : spin up Orthanc, pousser 50 instances via STOW-RS, requêter via QIDO-RS, récupérer via WADO-RS, vérifier le hash pixel, vérifier que `local_path` est créé, vérifier l'anonymisation.

**`integration/fhir.test.py`** : valider qu'un `POST /v1/patients` génère bien un `Patient` FHIR, qu'un `GET /fhir/Patient/{id}` retourne le bon profil, que la Subscription déclenche un événement downstream.

**`integration/segmentation_pipeline.test.py`** : pousser un dossier DICOM de 100 coupes, vérifier que `dicom2nifti` produit un NIfTI, que TotalSegmentator (ou un mock) produit un masque, que `mesh_export` produit un `.glb` valide, que les volumes calculés correspondent.

**`integration/or_optimize.test.py`** : fournir 30 chirurgies sur 3 salles avec chirurgiens, vérifier que le solveur CP-SAT produit un planning sans conflit, respecte les temps de repos, minimise le temps mort.

**`integration/offline_sync.test.py`** : simuler une déconnexion (Network Link Conditioner), vérifier que les actions sont mises en file dans IndexedDB, reconnecter, vérifier la synchronisation sans perte ni duplication.

### 11.5 Tests contractuels

#### 11.5.1 Approche consumer-driven (Pact)

- Chaque microservice publie un pact par consommateur.
- CI du producteur vérifie la compatibilité avec les pacts publiés.
- `pact-broker` centralise et versionne.
- Permet le déploiement indépendant (consumer-driven contract testing).

#### 11.5.2 OpenAPI schema testing

- `schemathesis` génère des cas à partir de l'OpenAPI, vérifie conformité, robustesse (fuzzing léger).
- Bloque la PR si une régression contractuelle est détectée.

### 11.6 Tests E2E (Playwright + Cypress)

- **Parcours chirurgien** : login → créer patient → import DICOM → segmentation → simulation → export PDF.
- **Parcours anesthésiste** : login → planning du jour → ouvrir dossier patient → voir alertes → valider check-list.
- **Parcours cadre de bloc** : login → résoudre un conflit planning → optimiser planning → notifier équipes.
- **Mode OR** : tous les boutons, cibles tactiles, mode lecture seule.
- **Mobile** : via WebDriverIO + Appium, parcours d'approbation.
- **Offline** : couper le réseau, continuer, reconnecter, vérifier sync.

### 11.7 Tests de performance

#### 11.7.1 k6 (back) + Playwright Trace (front)

**Scénarios** :
- `chat_streaming.js` : 100 VU pendant 5 min, p95 < 1 s first token.
- `dicom_wado.js` : 50 VU, 200 req chacune, p95 < 300 ms.
- `twin_snapshot.js` : 10 VU simultanés, p95 < 1 s.
- `or_optimize.js` : 1 VU, planning 7 jours, p95 < 5 s.
- `nav_stream.js` : 1 VU pendant 30 min, **latence < 100 ms garantie et soutenue (100% des trames)**. Note : Ce test est exécuté sur un profil de nœud edge local en salle d'opération (LAN bloc isolé sans dépendance WAN avec QoS DSCP Expedited Forwarding). Une évaluation au p95 est proscrite pour la navigation peropératoire (aucun pic > 100 ms toléré lors d'un clampage ou d'une exérèse).
- `load_global.js` : 200 VU mixant tous les endpoints, p95 < 500 ms global.

#### 11.7.2 Front

- **Web Vitals** : LCP < 1.5 s, INP < 100 ms, CLS < 0.05.
- **FPS 3D** : 60 fps soutenu sur scène 100k sommets (mesure via `requestAnimationFrame`).
- **Bundle size** : < 250 kB JS gzip sur la route principale, < 500 kB sur les routes lourdes (3D, simulation).

### 11.8 Tests de chaos

#### 11.8.1 Outils

- **Chaos Mesh** ou **Litmus** (Kubernetes).
- **Toxiproxy** pour les bases de données (latence, paquets perdus).

#### 11.8.2 Scénarios

- Tuer 1 pod `twin-service` → vérifier que le load balancer reroute, latence p95 reste < 200 ms.
- Tuer la base PostgreSQL → vérifier que le service renvoie 503 propre (jamais 500), pas de fuite de connexion, recovery automatique.
- Injecter 500 ms de latence sur Gemini → vérifier que le circuit breaker s'ouvre après 3 échecs, que Groq prend le relais.
- Remplir le disque à 95 % → vérifier que les uploads DICOM sont refusés proprement, alertes monitoring.
- Déconnecter le PACS → vérifier que les requêtes en cours renvoient une erreur claire, pas d'attente > 5 s.
- **Coupure totale du réseau WAN / LAN hospitalier en pleine intervention chirurgicale** → vérifier que le nœud edge local de salle d'opération bascule instantanément en **mode fallback dégradé autonome**. Le `navigation-service` maintient le guidage sur le jumeau 3D préchargé en mémoire locale sans aucune perte de tracking, latence maintenue < 100 ms soutenue, zéro interruption pour le chirurgien.

### 11.9 Tests de sécurité

#### 11.9.1 SAST

- `semgrep` (règles Python, JS, Rust, Go custom).
- `bandit` (Python).
- `eslint-plugin-security` (JS).
- `clippy` (Rust) avec `cargo-deny` pour les dépendances.

Bloquant en CI : toute CVE connue, tout finding SAST `error` ou `warning` non documenté.

#### 11.9.2 DAST

- `OWASP ZAP` automatisé en nightly sur staging.
- Burp Suite Pro pour tests manuels trimestriels.

#### 11.9.3 Dependency scan

- `trivy` images Docker.
- `snyk` ou `dependabot` pour les CVE.
- `cargo-audit`, `npm audit`, `pip-audit`.

Bloquant : CVE critiques ou élevées non patchées depuis > 7 jours (sauf exception documentée).

#### 11.9.4 Penetration test

- Annuel par un tiers certifié PASSI.
- Bug bounty en complément (programme privé sur YesWeHack ou HackerOne).

### 11.10 Tests d'interopérabilité

#### 11.10.1 PACS

- Tests contre au moins 4 vendors : Orthanc (open source), dcm4chee (open source), GE Centricity (si accès), Philips Vue PACS (si accès).
- Vérifier : C-FIND, C-GET, C-MOVE, STOW-RS, WADO-RS, QIDO-RS, UPS-RS.
- Vérifier les particularités de chaque vendor (filtres QIDO, formats de réponse, retries).

#### 11.10.2 HIS / RIS

- Tests contre Mirth Connect (open source), InterSystems Ensemble, Dedalus.
- Vérifier : ADT^A01/A04/A08, ORM^O01, ORU^R01, SIU^S12, MLLP over TLS.

#### 11.10.3 FHIR servers

- Tests contre HAPI FHIR (open source), Smile CDR, Firely Server.
- Vérifier : Patient, ImagingStudy, DiagnosticReport, Observation, Subscription, SMART-on-FHIR, Bulk Data.

### 11.11 Tests cliniques

#### 11.11.1 Validation pré-marquage CE (PMCF / Investigation clinique)

- **Étude rétrospective** : 200 dossiers anonymisés de chaque centre partenaire, comparaison plan IA vs plan réalisé, accord inter-observateurs, métriques pré-spécifiées.
- **Étude prospective** : 50 patients par centre, plan IA soumis à un comité de 3 chirurgiens seniors, acceptabilité mesurée.
- **Critères primaires** : sécurité (pas de plan dangereux validé), utilité (gain de temps ≥ 20 %), concordance (kappa ≥ 0.6).
- **Critères secondaires** : durée d'utilisation, satisfaction (SUS ≥ 75), taux d'erreur récupérable, effets non intentionnels.

#### 11.11.2 Validation simulation

- Comparaison volumes simulés vs volumes mesurés postop (DICOM postop).
- Comparaison marges prédites vs marges anapath.
- Critère : erreur volumique < 5 %, erreur marge < 2 mm dans 80 % des cas.

#### 11.11.3 Validation navigation

- Étude fantôme (mannequin + cibles fiducielles), erreur cible < 3 mm.
- Étude clinique : 30 patients, comparaison position instrument réel vs position prédite par navigation, taux d'écart > 5 mm.

#### 11.11.4 Validation AR/VR

- Mannequin : erreur de recalage < 5 mm, latence perçue < 100 ms.
- Utilisabilité (SUS), charge cognitive (NASA-TLX).
- Formation : comparaison pré/post formation sur simulateurs (amélioration ≥ 30 %).

#### 11.11.5 Validation IA prédictive

- Cohorte externe (autre centre) : discrimination AUC, calibration (Brier, calibration plot).
- Test de transportabilité : 3 centres différents.
- Decision curve analysis (bénéfice clinique net).
- SHAP sanity checks : features attendues en tête, pas d'effet absurde (ex. l'ID patient ne doit pas être prédictif).

#### 11.11.6 Validation IA conversationnelle

- Grille d'évaluation : exactitude factuelle, complétude, citation de sources, reconnaissance d'incertitude, respect des garde-fous.
- Évaluateurs : 2 chirurgiens + 1 médecin non-spécialiste.
- Taux cible : ≥ 90 % de réponses utiles ou correctes.

#### 11.11.7 Tests d'utilisabilité (IEC 62366)

- ≥ 15 utilisateurs représentatifs par persona.
- Tâches critiques (5 par persona), mesurées : taux de succès, temps, erreurs, demandes d'aide.
- SUS (System Usability Scale) ≥ 75.
- Tests sur environnement simulé (salle de bloc factice, équipement réel).
- Tests d'apprentissage : nouveau utilisateur, première session, doit compléter 80 % des tâches critiques.
- Tests sous stress (fatigue, interruption, urgence simulée).
- Tests sur sujets âgés / handicapés (accessibilité).

#### 11.11.8 Validation post-marché (PMS / PMCF)

- Surveillance en continu : logs, incidents, retours utilisateurs.
- Revue trimestrielle du fichier de gestion des risques.
- Veille bibliographique et réglementaire.
- Rapport PSUR (Periodic Safety Update Report) annuel.
- Études PMCF ciblées sur les risques résiduels.

### 11.12 Tests de conformité réglementaire

- **MDR** : audit interne semestriel, audit externe par organisme notifié pré-marquage puis post-marquage.
- **FDA** : soumission 510(k) avec documentation logicielle complète.
- **ISO 13485** : audit interne annuel, audit externe par organisme accrédité.
- **ISO 14971** : revue du fichier de gestion des risques à chaque release majeure.
- **IEC 62304** : vérification que la documentation logicielle (plans, requirements, design, tests) est complète et tracée.
- **IEC 62366** : vérification que le fichier d'ergonomie est complet.
- **HDS** : audit annuel hébergeur, audit interne sur les procédures.
- **RGPD** : audit interne annuel + DPIA à chaque nouveau traitement.

### 11.13 Pipeline CI/CD

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐
│   commit    │──▶│  PR checks   │──▶│  merge main  │──▶│  staging    │
└─────────────┘   └──────────────┘   └──────────────┘   └─────────────┘
                  │                   │                   │
                  ├─ lint            ├─ all of PR        ├─ smoke
                  ├─ format          ├─ mutation (night) ├─ e2e
                  ├─ sast            ├─ perf smoke       ├─ chaos
                  ├─ unit            ├─ contract         └─ manual QA
                  ├─ contract        └─ SBOM
                  ├─ schema validation
                  ├─ SBOM
                  ├─ vuln scan
                  └─ docker build
```

---
