"""add institution_licenses table (entitlement: plan/seats/modules/expiration)

Revision ID: j1k2l3m4n5o6
Revises: i0j1k2l3m4n5
Create Date: 2026-08-13 01:00:00.000000

Voir backend/licensing.py pour le catalogue de plans et backend/tenancy.py
pour l'attribution automatique d'une licence 'trial' à toute nouvelle
institution. Sur une base déjà peuplée (après la migration multi-tenant
i0j1k2l3m4n5), toute institution existante reçoit ici une licence par défaut
généreuse ('enterprise', tous modules) plutôt que 'trial' — un déploiement
pilote déjà en production ne doit pas se retrouver bridé du jour au lendemain
par l'introduction de ce système d'entitlement.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j1k2l3m4n5o6"
down_revision: Union[str, None] = "i0j1k2l3m4n5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None

_ENTERPRISE_MODULES = '["core", "academic", "research", "digital_twin", "pacs", "anesthesia_icu"]'


def upgrade() -> None:
    op.create_table(
        "institution_licenses",
        sa.Column("id", sa.String(length=36), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("institution_id", sa.String(length=36),
                  sa.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("plan", sa.String(length=32), nullable=False, server_default="trial"),
        sa.Column("max_seats", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("enabled_modules", sa.JSON(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    conn = op.get_bind()
    # Backfill : voir avertissement en tête de module — 'enterprise'/tous
    # modules pour ne pas régresser un pilote déjà en production.
    conn.execute(sa.text(
        "INSERT INTO institution_licenses (id, institution_id, plan, max_seats, enabled_modules) "
        "SELECT uuid_generate_v4(), id, 'enterprise', 500, :modules FROM institutions "
        "WHERE id NOT IN (SELECT institution_id FROM institution_licenses)"
    ), {"modules": _ENTERPRISE_MODULES})


def downgrade() -> None:
    op.drop_table("institution_licenses")
