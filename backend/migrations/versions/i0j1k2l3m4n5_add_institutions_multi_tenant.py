"""add institutions table + institution_id on users/patients (multi-tenant isolation)

Revision ID: i0j1k2l3m4n5
Revises: h9i0j1k2l3m4
Create Date: 2026-08-13 00:00:00.000000

Chaque utilisateur et chaque patient appartient désormais à exactement une
institution (tenant) — voir backend/tenancy.py (attribution à la création) et
deps.get_scoped_patient (seul point d'accès patient qui vérifie la frontière).

Sur une base déjà peuplée (déploiement pilote existant), tous les
users/patients pré-existants sont rattachés à UNE institution par défaut créée
par cette migration ("Institution par défaut (migration)") — préserve
exactement le comportement actuel (tout le monde voit tout) jusqu'à ce qu'un
administrateur réorganise manuellement en plusieurs institutions. C'est
pourquoi `institution_id` est ajoutée NULLABLE puis backfillée avant d'être
rendue NOT NULL, plutôt que directement NOT NULL (qui échouerait sur une base
non vide).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i0j1k2l3m4n5"
down_revision: Union[str, None] = "h9i0j1k2l3m4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None

_DEFAULT_INSTITUTION_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    op.create_table(
        "institutions",
        sa.Column("id", sa.String(length=36), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False, server_default="personal"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.add_column("users", sa.Column("institution_id", sa.String(length=36), nullable=True))
    op.add_column("patients", sa.Column("institution_id", sa.String(length=36), nullable=True))

    # Backfill : une institution par défaut pour tout ce qui existe déjà —
    # voir avertissement en tête de module.
    conn = op.get_bind()
    conn.execute(
        sa.text("INSERT INTO institutions (id, name, kind) VALUES (:id, :name, 'organization') "
                "ON CONFLICT (id) DO NOTHING"),
        {"id": _DEFAULT_INSTITUTION_ID, "name": "Institution par défaut (migration)"},
    )
    conn.execute(sa.text("UPDATE users SET institution_id = :id WHERE institution_id IS NULL"),
                 {"id": _DEFAULT_INSTITUTION_ID})
    conn.execute(sa.text("UPDATE patients SET institution_id = :id WHERE institution_id IS NULL"),
                 {"id": _DEFAULT_INSTITUTION_ID})

    op.alter_column("users", "institution_id", nullable=False)
    op.alter_column("patients", "institution_id", nullable=False)
    op.create_foreign_key("fk_users_institution", "users", "institutions", ["institution_id"], ["id"])
    op.create_foreign_key("fk_patients_institution", "patients", "institutions", ["institution_id"], ["id"])
    op.create_index("idx_patients_institution", "patients", ["institution_id"])


def downgrade() -> None:
    op.drop_index("idx_patients_institution", table_name="patients")
    op.drop_constraint("fk_patients_institution", "patients", type_="foreignkey")
    op.drop_constraint("fk_users_institution", "users", type_="foreignkey")
    op.drop_column("patients", "institution_id")
    op.drop_column("users", "institution_id")
    op.drop_table("institutions")
