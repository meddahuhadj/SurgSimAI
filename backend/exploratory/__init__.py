# -*- coding: utf-8 -*-
"""
backend/exploratory/ — Services de recherche spéculative (Jalons M21-M40)
==========================================================================
⚠️ AUCUN de ces modules n'est un dispositif médical validé, ni même un prototype clinique
fonctionnel : nanorobotique, interface cerveau-machine, cryo-BNCT, bio-impression,
épigénétique, robotique RAS, WebXR, etc. sont des concepts narratifs (formules linéaires
illustratives, aucun matériel réel piloté) — voir l'avertissement en tête de chaque fichier.

Isolés dans ce package pour deux raisons :
1. Ils ne se chargent JAMAIS par défaut (`RESEARCH_MODE=false`, voir `backend/main.py`)
   — un déploiement clinique ne les expose jamais, même par erreur de configuration.
2. Auditabilité réglementaire : un futur dossier technique MDR/IEC 62304 (voir
   `REGULATORY_MDR_ISO14971.md` à la racine du dépôt) peut exclure ce package entier
   du périmètre à auditer d'un simple coup d'œil, plutôt que de trier fichier par fichier
   parmi les modules cliniques réels (segmentation, PK/PD, plans, PACS...).

Ce package reste dans `backend/` (et non un dépôt séparé) pour rester déployable en un
seul `git clone` / `docker build` tant qu'aucune décision n'a été prise sur l'hébergement
d'un futur dépôt "recherche" distinct — voir la discussion correspondante avec l'équipe
produit avant toute extraction effective.
"""
