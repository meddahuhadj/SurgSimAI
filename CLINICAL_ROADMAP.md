# 🏥 GeneralSurg Plan — Clinical Roadmap (MDR & Hospital Integration)

> **Statut Actuel** : Document de vision et d'exigences normatives pour les évolutions cliniques futures. La plateforme active **SurgSim 3D (V2.5)** opère de manière strictement isolée en environnement de recherche et simulation.

---

## 🛡️ 1. Exigences Réglementaires & Dispositifs Médicaux (MDR 2017/745)

Pour passer du laboratoire de simulation à l'aide au diagnostic/planification clinique en bloc opératoire, les étapes suivantes sont obligatoires :

1. **Classification Dispositif Médical Logiciel (SaMD)** :
   - Qualification sous la règle 11 de l'Annexe VIII (Classe IIa ou IIb selon la criticité des organes réséqués).
2. **Système de Management de la Qualité (SMQ)** :
   - Certification ISO 13485 (Exigences relatives aux DM).
   - ISO 14971 (Gestion des risques applicables aux dispositifs médicaux).
   - CEI 62304 (Logiciels de dispositifs médicaux — Processus du cycle de vie du logiciel).
3. **Évaluation Clinique & Essais Cliniques** :
   - Étude clinique prospective pour valider la non-infériorité des marges de résection planifiées vs réelles.

---

## 🔒 2. Cloisonnement & Sécurité des Données Patient (HIPAA / RGPD)

L'accès clinique au portail `CLINICAL (Restricted)` requiert l'implémentation de la pile de sécurité suivante :

```text
                  HOSPITAL PACS (DICOM)
                            │
               Anonymisation HIPAA / ISO 27701
                            ↓
               SSO Hospitalier (OAuth2 / SAML)
                            ↓
                  RBAC (Chirurgien Titulaire)
                            ↓
              GeneralSurg Plan Clinical Instance
```

---

## 📅 3. Jalons de Transition Clinique

- **Phase C1 (Q4 2026)** : Audit de conformité ISO 62304 du pipeline TotalSegmentator.
- **Phase C2 (Q2 2027)** : Intégration HL7 / DICOM Web PACS temps réel.
- **Phase C3 (Q4 2027)** : Dépôt du dossier de marquage CE DM Classe IIa.
