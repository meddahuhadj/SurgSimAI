# NOTE : test manuel (pas exécuté par la suite pytest automatisée) — nécessite
# un SCP DIMSE de test démarré au préalable sur le port 11112, par exemple
# l'implémentation de référence fournie par pynetdicom :
#   python3 -m pynetdicom.apps.qrscp.qrscp --port 11112
# Voir le README, section "PACS DIMSE classique", pour la procédure complète.
import io, sys, time
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid, CTImageStorage

import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

STUDY_UID = "1.2.826.0.1.3680043.8.498.999.1"
SERIES_UID = "1.2.826.0.1.3680043.8.498.999.2"
SOP_UID = "1.2.826.0.1.3680043.8.498.999.3"


def make_dataset():
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = CTImageStorage
    file_meta.MediaStorageSOPInstanceUID = SOP_UID
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    ds = pydicom.Dataset()
    ds.file_meta = file_meta
    ds.is_little_endian = True
    ds.is_implicit_VR = False
    ds.SOPClassUID = CTImageStorage
    ds.SOPInstanceUID = SOP_UID
    ds.StudyInstanceUID = STUDY_UID
    ds.SeriesInstanceUID = SERIES_UID
    ds.PatientName = "TESTDIMSE^MOCK"
    ds.PatientID = "DIMSE001"
    ds.Modality = "CT"
    ds.StudyDate = "20260704"
    ds.StudyDescription = "Etude DIMSE de test"
    ds.SeriesDescription = "Serie DIMSE de test"
    ds.AccessionNumber = "ACCDIMSE"
    ds.Rows = 4
    ds.Columns = 4
    ds.SliceThickness = "1.0"
    ds.BitsAllocated = 16
    ds.BitsStored = 16
    ds.HighBit = 15
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.PixelData = (b"\x00\x01" * 16)
    return ds


if __name__ == "__main__":
    from pynetdicom import AE
    from pynetdicom.sop_class import CTImageStorage as CTStorageSOP

    ds = make_dataset()

    # ── 1) Pousser le dataset vers le SCP de test (C-STORE) ──
    ae = AE(ae_title="STORESCU")
    ae.add_requested_context(CTStorageSOP)
    assoc = ae.associate("127.0.0.1", 11112, ae_title="QRSCP")
    assert assoc.is_established, "Association C-STORE refusée — le SCP de test tourne-t-il ?"
    status = assoc.send_c_store(ds)
    print("C-STORE status:", hex(status.Status) if status else None)
    assoc.release()
    assert status and status.Status == 0x0000, "Échec du C-STORE vers le SCP de test"
    print("✅ Dataset synthétique stocké dans le faux PACS DIMSE.")

    time.sleep(0.5)

    # ── 2) Tester notre connecteur réel pacs_dimse.py contre ce vrai SCP ──
    import pacs_dimse

    cfg = pacs_dimse.DimseConfig(host="127.0.0.1", port=11112, called_ae_title="QRSCP",
                                  calling_ae_title="GENSURGPLAN", timeout_seconds=10)

    studies = pacs_dimse.find_studies(cfg, patient_id="DIMSE001")
    print("\nC-FIND (studies):", studies)
    assert len(studies) == 1, f"Attendu 1 étude, trouvé {len(studies)}"
    assert studies[0]["study_uid"] == STUDY_UID
    assert studies[0]["patient_id"] == "DIMSE001"
    print("✅ C-FIND niveau étude : la vraie étude synthétique est retrouvée.")

    series = pacs_dimse.find_series(cfg, STUDY_UID)
    print("\nC-FIND (series):", series)
    assert len(series) == 1, f"Attendu 1 série, trouvé {len(series)}"
    assert series[0]["series_uid"] == SERIES_UID
    print("✅ C-FIND niveau série : la vraie série synthétique est retrouvée.")

    received = pacs_dimse.get_series(cfg, STUDY_UID, SERIES_UID)
    print(f"\nC-GET : {len(received)} instance(s) reçue(s)")
    assert len(received) == 1, f"Attendu 1 instance récupérée, reçu {len(received)}"
    recv_ds = received[0]
    assert recv_ds.SOPInstanceUID == SOP_UID
    assert recv_ds.PatientID == "DIMSE001"
    assert recv_ds.Modality == "CT"
    print("✅ C-GET : l'instance DICOM réelle a été rapatriée avec les bonnes métadonnées.")

    print("\n🎉 Connecteur DIMSE (C-FIND + C-GET) validé de bout en bout contre un vrai SCP DICOM.")
