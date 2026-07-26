# -*- coding: utf-8 -*-
"""
pacs_dimse.py — Connecteur PACS classique DIMSE (C-FIND / C-GET) via pynetdicom
==================================================================================
Complète pacs_client.py (DICOMweb) pour les PACS qui n'exposent QUE le
protocole DICOM historique (association TCP, AE Titles, C-FIND/C-MOVE/C-GET —
typiquement port 104 ou 11112), sans DICOMweb. API vérifiée sur le paquet
`pynetdicom` réellement installé (voir signatures ci-dessous).

Choix : C-GET plutôt que C-MOVE pour la récupération. C-MOVE demande au PACS
distant d'ouvrir une NOUVELLE association vers un Storage SCP que NOUS devrions
faire tourner en permanence (port ouvert, AE Title enregistré côté PACS à
l'avance) — lourd à opérer et à sécuriser pour un simple appel API. C-GET
récupère les images sur la MÊME association que la requête : plus simple à
intégrer dans un endpoint HTTP synchrone, au prix d'un usage un peu moins
répandu chez certains PACS anciens (à vérifier au cas par cas — voir
capabilities()).

Toutes les fonctions réseau sont synchrones (pynetdicom est basé sur des
threads internes, pas asyncio) : exécutées dans un threadpool par
pacs_router.py, protégées par resilience.DIMSE_BREAKER.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from pydicom.dataset import Dataset

try:
    from pynetdicom import AE, evt
    from pynetdicom.presentation import build_role
    from pynetdicom.sop_class import (
        PatientRootQueryRetrieveInformationModelFind,
        PatientRootQueryRetrieveInformationModelGet,
        StudyRootQueryRetrieveInformationModelFind,
        StudyRootQueryRetrieveInformationModelGet,
        CTImageStorage, MRImageStorage, SecondaryCaptureImageStorage,
        UltrasoundImageStorage, ComputedRadiographyImageStorage,
        DigitalXRayImageStorageForPresentation,
    )
    PYNETDICOM_AVAILABLE = True
except Exception:  # noqa: BLE001
    PYNETDICOM_AVAILABLE = False

# Classes de stockage les plus courantes qu'on doit être prêt à recevoir lors
# d'un C-GET (le SCU doit annoncer les contextes de présentation Storage qu'il
# accepte, faute de quoi le PACS distant refuse le sous-transfert C-STORE).
_STORAGE_SOP_CLASSES = []
if PYNETDICOM_AVAILABLE:
    _STORAGE_SOP_CLASSES = [
        CTImageStorage, MRImageStorage, SecondaryCaptureImageStorage,
        UltrasoundImageStorage, ComputedRadiographyImageStorage,
        DigitalXRayImageStorageForPresentation,
    ]


class DimseConnectionError(Exception):
    """Association DIMSE refusée/impossible, ou statut d'échec renvoyé par le PACS."""


@dataclass
class DimseConfig:
    host: str
    port: int
    called_ae_title: str = "ANY-SCP"     # AE Title du PACS distant
    calling_ae_title: str = "GENSURGPLAN"  # notre propre AE Title
    timeout_seconds: int = 15

    @classmethod
    def resolve(cls, host: Optional[str], port: Optional[int], called_ae: Optional[str],
                calling_ae: Optional[str]) -> "DimseConfig":
        import os
        h = host or os.getenv("PACS_DIMSE_HOST", "")
        if not h:
            raise DimseConnectionError("Aucun hôte DIMSE configuré (PACS_DIMSE_HOST ou paramètre host).")
        p = port or int(os.getenv("PACS_DIMSE_PORT", "104"))
        return cls(
            host=h, port=p,
            called_ae_title=called_ae or os.getenv("PACS_DIMSE_CALLED_AE", "ANY-SCP"),
            calling_ae_title=calling_ae or os.getenv("PACS_DIMSE_CALLING_AE", "GENSURGPLAN"),
            timeout_seconds=int(os.getenv("PACS_DIMSE_TIMEOUT", "15")),
        )


def capabilities() -> Dict[str, Any]:
    import os
    return {
        "pynetdicom_installed": PYNETDICOM_AVAILABLE,
        "dimse_configured_server_side": bool(os.getenv("PACS_DIMSE_HOST")),
        "dimse_host": os.getenv("PACS_DIMSE_HOST") or None,
        "retrieval_method": "C-GET (association unique) — pas de C-MOVE (nécessiterait un Storage SCP permanent côté serveur)",
        "storage_sop_classes_supported": [str(s) for s in _STORAGE_SOP_CLASSES] if PYNETDICOM_AVAILABLE else [],
    }


def _identifier_to_dict(ds: Dataset) -> Dict[str, Any]:
    return {
        "study_uid": getattr(ds, "StudyInstanceUID", None),
        "series_uid": getattr(ds, "SeriesInstanceUID", None),
        "patient_name": str(getattr(ds, "PatientName", "")) or None,
        "patient_id": getattr(ds, "PatientID", None),
        "study_date": getattr(ds, "StudyDate", None),
        "study_description": getattr(ds, "StudyDescription", None),
        "accession_number": getattr(ds, "AccessionNumber", None),
        "modality": getattr(ds, "Modality", None),
    }


def _find(cfg: DimseConfig, query_ds: Dataset, level: str) -> List[Dict[str, Any]]:
    if not PYNETDICOM_AVAILABLE:
        raise DimseConnectionError("pynetdicom n'est pas installé côté serveur.")
    ae = AE(ae_title=cfg.calling_ae_title)
    ae.add_requested_context(StudyRootQueryRetrieveInformationModelFind)
    ae.network_timeout = cfg.timeout_seconds
    ae.acse_timeout = cfg.timeout_seconds
    ae.dimse_timeout = cfg.timeout_seconds
    assoc = ae.associate(cfg.host, cfg.port, ae_title=cfg.called_ae_title)
    if not assoc.is_established:
        raise DimseConnectionError(
            f"Association DIMSE refusée par {cfg.host}:{cfg.port} (AE distant '{cfg.called_ae_title}'). "
            "Vérifiez host/port/AE Title et que ce PACS autorise notre AE Title appelant."
        )
    results: List[Dict[str, Any]] = []
    try:
        query_ds.QueryRetrieveLevel = level
        for status, identifier in assoc.send_c_find(query_ds, StudyRootQueryRetrieveInformationModelFind):
            if status is None:
                raise DimseConnectionError("Pas de réponse du PACS distant (timeout DIMSE).")
            if status.Status in (0xFF00, 0xFF01) and identifier is not None:
                results.append(_identifier_to_dict(identifier))
            elif status.Status != 0x0000:
                raise DimseConnectionError(f"C-FIND a échoué, statut DICOM 0x{status.Status:04X}.")
    finally:
        assoc.release()
    return results


def find_studies(cfg: DimseConfig, patient_id: str = "", patient_name: str = "",
                  study_date: str = "", accession_number: str = "") -> List[Dict[str, Any]]:
    ds = Dataset()
    ds.PatientID = patient_id
    ds.PatientName = patient_name
    ds.StudyDate = study_date
    ds.AccessionNumber = accession_number
    ds.StudyInstanceUID = ""
    ds.StudyDescription = ""
    ds.ModalitiesInStudy = ""
    return _find(cfg, ds, "STUDY")


def find_series(cfg: DimseConfig, study_uid: str) -> List[Dict[str, Any]]:
    ds = Dataset()
    ds.StudyInstanceUID = study_uid
    ds.SeriesInstanceUID = ""
    ds.Modality = ""
    ds.SeriesDescription = ""
    ds.SeriesNumber = ""
    return _find(cfg, ds, "SERIES")


def get_series(cfg: DimseConfig, study_uid: str, series_uid: str) -> List[Dataset]:
    """C-GET : rapatrie les instances d'une série sur l'association en cours
    (le PACS distant nous les transfère via des sous-opérations C-STORE que
    nous acceptons nous-mêmes, dans la même association)."""
    if not PYNETDICOM_AVAILABLE:
        raise DimseConnectionError("pynetdicom n'est pas installé côté serveur.")

    received: List[Dataset] = []

    def _handle_store(event):
        ds = event.dataset
        ds.file_meta = event.file_meta
        received.append(ds)
        return 0x0000  # Success

    ae = AE(ae_title=cfg.calling_ae_title)
    ae.add_requested_context(StudyRootQueryRetrieveInformationModelGet)
    roles = []
    for sop in _STORAGE_SOP_CLASSES:
        ae.add_requested_context(sop)
        # Négociation de rôle : on annonce qu'on est prêt à jouer le rôle SCP
        # (recevoir les sous-opérations C-STORE) pour chacune de ces classes,
        # sur CETTE association — sans ça, le PACS distant refuse le transfert
        # avec un statut 0xA702 ("Unable to perform sub-operations"), comme
        # observé lors du premier test de ce connecteur contre un vrai SCP.
        roles.append(build_role(sop, scp_role=True))
    ae.network_timeout = cfg.timeout_seconds
    ae.acse_timeout = cfg.timeout_seconds
    ae.dimse_timeout = cfg.timeout_seconds

    assoc = ae.associate(cfg.host, cfg.port, ae_title=cfg.called_ae_title,
                          ext_neg=roles, evt_handlers=[(evt.EVT_C_STORE, _handle_store)])
    if not assoc.is_established:
        raise DimseConnectionError(f"Association DIMSE (C-GET) refusée par {cfg.host}:{cfg.port}.")
    try:
        ds = Dataset()
        ds.QueryRetrieveLevel = "SERIES"
        ds.StudyInstanceUID = study_uid
        ds.SeriesInstanceUID = series_uid
        for status, _identifier in assoc.send_c_get(ds, StudyRootQueryRetrieveInformationModelGet):
            if status is None:
                raise DimseConnectionError("Pas de réponse du PACS distant pendant le C-GET (timeout).")
            if status.Status not in (0x0000, 0xFF00, 0xFF01):
                raise DimseConnectionError(f"C-GET a échoué, statut DICOM 0x{status.Status:04X}.")
    finally:
        assoc.release()
    if not received:
        raise DimseConnectionError("C-GET terminé sans erreur mais aucune instance reçue "
                                    "(SOP class de stockage non supportée par ce connecteur ? "
                                    "voir capabilities().storage_sop_classes_supported).")
    return received
