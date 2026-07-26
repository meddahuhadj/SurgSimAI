"""add local_path to dicom_series

Revision ID: a1f2c3d4e5f6
Revises: 85b9969d21f9
Create Date: 2026-07-05 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f2c3d4e5f6'
down_revision: Union[str, None] = '85b9969d21f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dossier disque contenant les fichiers .dcm réels d'une série, quand ils
    # ont été sauvegardés (import manuel, import PACS DICOMweb ou DIMSE).
    # Nullable : les séries importées AVANT cette migration n'ont pas de
    # pixels sauvegardés et devront être réimportées pour être segmentables.
    op.add_column('dicom_series', sa.Column('local_path', sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('dicom_series', 'local_path')
