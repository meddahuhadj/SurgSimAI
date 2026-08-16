"""add VoiceNote table for Voice-First spoken notes (Premier Interlocuteur)

Revision ID: h9i0j1k2l3m4
Revises: g7h8i9j0k1l2
Create Date: 2026-08-11 18:30:00.000000

Persiste les notes dictées à la voix (« Note : … ») interprétées par voice_command_engine.py
et exposées via POST /api/v2/voice/notes — traçabilité MDR/IEC 62304 des intentions vocales.
Miroir de backend/models.py::VoiceNote et de backend/migrations/schema.sql.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h9i0j1k2l3m4"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "voice_notes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("patient_id", sa.String(length=32), sa.ForeignKey("patients.id", ondelete="CASCADE"), nullable=True),
        sa.Column("author_username", sa.String(length=64), nullable=False),
        sa.Column("specialty", sa.String(length=32), nullable=True),
        sa.Column("intent", sa.String(length=32), nullable=True),
        sa.Column("action_token", sa.String(length=64), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_voice_notes_patient", "voice_notes", ["patient_id"])
    op.create_index("idx_voice_notes_created", "voice_notes", ["created_at"], postgresql_using="BRIN")


def downgrade() -> None:
    op.drop_index("idx_voice_notes_created", table_name="voice_notes")
    op.drop_index("idx_voice_notes_patient", table_name="voice_notes")
    op.drop_table("voice_notes")
