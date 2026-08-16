# Matrice de Traçabilité Réglementaire IEC 62304 / ISO 14971

> ⚠️ **Statut réel : NON CERTIFIÉ.** Ce document démontre une **méthodologie**
> de traçabilité exigence→risque→test sur 6 exigences illustratives — ce
> n'est **PAS** un dossier de conformité MDR, ni une preuve de certification.
> Statut réglementaire à jour, vérifiable à l'exécution :
> `GET /api/v2/compliance/mdr-fda-status` (répond `NOT_CERTIFIED` /
> `NOT_SUBMITTED`). Voir `REGULATORY_MDR_ISO14971.md` pour la feuille de
> route vers une certification réelle — cette matrice est un point de départ
> pour cette feuille de route, pas son aboutissement. "MDR Classe IIb"
> ci-dessous désigne la classification **envisagée** si une démarche de
> certification était engagée, pas une classification obtenue.

**Dispositif** : GeneralSurgPlan3D NextGen  
**Normes applicables** : IEC 62304:2006/AMD1:2015 (Logiciels de dispositifs médicaux), ISO 14971:2019 (Gestion des risques), Règlement UE 2017/745 (MDR Classe IIb envisagée — non obtenue).

---

## Matrice Spécifications (SRS) ➔ Risques (ISO 14971) ➔ Vérification (Tests)

| ID Exigence (SRS) | Description Métier / Clinique | Hazard ISO 14971 Associé | Mesure de Maîtrise du Risque | Test de Vérification Automatisé | Statut |
|---|---|---|---|---|---|
| **SRS-SEC-01** | Exigence stricte de 2FA/MFA en production HDS. | Accès non autorisé aux données de santé patient (PHI). | Blocage HTTP 403 en `APP_ENV=production` si 2FA inactif. | `tests/test_twin_elastography_2fa.py::test_mandatory_2fa_in_production` | 🟢 PASS |
| **SRS-OR-01** | Moteur de contraintes dures bloquantes (Salle/Matériel/Patient). | Programmation d'un patient non prêt ou salle indisponible. | Validation stricte pré-création/modification créneau. | `tests/test_or_planning.py::test_slot_constraint_engine_hard_blockers` | 🟢 PASS |
| **SRS-OR-02** | Gel de planning (`frozen`) et traçabilité obligatoire des motifs d'urgence. | Altération involontaire ou non tracée du programme figé. | Exception HTTP 400 sans `audit_reason` + écriture `audit_log`. | `tests/test_or_planning.py::test_schedule_freeze_and_audit` | 🟢 PASS |
| **SRS-BIOM-01** | Calibration biomécanique Mooney-Rivlin par élastographie MRE/SWE. | Simulation de déformation sur constantes théoriques non patient. | Endpoint `POST /twin/elastography` ($C_{10} = \mu / 2$). | `tests/test_twin_elastography_2fa.py::test_elastography_ingest_calibrates_twin` | 🟢 PASS |
| **SRS-PERF-01** | Maintien des SLA sous charge (latence P95 < 200 ms). | Indisponibilité du service pendant la planification. | Script k6 de test de charge automatisé (100 VUs). | `scripts/k6_load_test.js` | 🟢 PASS |
| **SRS-UI-01** | Avertissement réglementaire bloquant sur les modules de recherche (IEC 62366). | Utilisation d'un prototype d'IA expérimental pour décision clinique. | Modal d'avertissement obligatoire au clic sur `nav-explore`. | `index.html#modal-research-warning` | 🟢 PASS |

---

## Synthèse de Conformité
- **Couverture de Traçabilité Exigences / Tests** : 100% **des 6 exigences listées dans cette matrice** — pas 100% du logiciel. La très grande majorité des fonctionnalités du dépôt (segmentation, biomécanique, radiomics, licensing, etc.) n'a pas encore d'entrée SRS ici ; les étendre à mesure qu'une vraie démarche qualité (ISO 13485/IEC 62304 complète) est engagée est un travail futur, pas déjà fait.
- **Règles de Sécurité Actives** : Garde-fous `APP_ENV=production`, 2FA obligatoire, mode recherche isolé en CI/CD.
