"""add operating_rooms, operating_schedules, equipments, schedule_equipments
(present in backend/models.py and used by routers/or_planning.py,
or_readiness_engine.py, or_constraint_engine.py, or_optimizer.py — but never
created by ANY migration, discovered only now)

Revision ID: f7a8b9c0d1e2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-13 02:00:00.000000

⚠️ BUG DE DÉPLOIEMENT CORRIGÉ : `alembic upgrade head` sur un PostgreSQL
fraîchement créé échouait à la migration suivante (g7h8i9j0k1l2) avec
`UndefinedTable: relation "operating_rooms" does not exist` (vérifié dans
cette session avec un conteneur Postgres 16 jetable — le tout premier test
réel de la chaîne de migrations contre un vrai PostgreSQL). Cette table
(ainsi qu'operating_schedules, equipments, schedule_equipments) n'avait
jamais reçu sa propre migration. Le chemin de développement
(`Base.metadata.create_all()`, utilisé par `main.py::init_db()` et par tous
les tests SQLite) crée toutes les tables du modèle d'un coup sans jamais
suivre la chaîne de migrations — ce trou était donc invisible en dev/tests,
seul un vrai `alembic upgrade head` contre PostgreSQL pouvait le révéler.

Insérée ICI (avant g7h8i9j0k1l2, pas après) parce que g7h8i9j0k1l2 référence
`operating_rooms`/`equipments` par clé étrangère ET fait des
`ALTER TABLE operating_schedules ADD COLUMN ...` — ces trois tables doivent
donc exister avant que g7h8i9j0k1l2 s'exécute. g7h8i9j0k1l2::down_revision a
été mis à jour pour pointer ici plutôt que vers f6a7b8c9d0e1. Ceci ne casse
aucun déploiement existant : g7h8i9j0k1l2 ne pouvait de toute façon jamais
avoir été appliquée avec succès par `alembic upgrade` avant ce correctif (la
table operating_rooms n'a jamais existé) — aucune base réelle ne peut donc
avoir cette révision enregistrée dans alembic_version via ce chemin.

Ne crée que le schéma de base d'operating_schedules — les colonnes
supplémentaires (procedure_id, actual_incision_time, delay_mins,
icu_bed_reserved, ...) restent ajoutées par g7h8i9j0k1l2, inchangée sur ce
point, pour ne pas dupliquer sa logique.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "operating_rooms",
        sa.Column("id", sa.String(length=36), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("type", sa.String(length=64), server_default="general"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("capabilities", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    op.create_table(
        "equipments",
        sa.Column("id", sa.String(length=36), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("quantity_available", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    # Schéma de base seulement — g7h8i9j0k1l2 (qui s'exécute juste après)
    # ajoute procedure_id/actual_incision_time/delay_mins/icu_bed_reserved/...
    op.create_table(
        "operating_schedules",
        sa.Column("id", sa.String(length=36), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("operating_room_id", sa.String(length=36),
                  sa.ForeignKey("operating_rooms.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("patient_id", sa.String(length=32),
                  sa.ForeignKey("patients.id", ondelete="CASCADE"), nullable=True),
        sa.Column("plan_id", sa.String(length=36),
                  sa.ForeignKey("surgical_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("estimated_duration_mins", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("primary_surgeon_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("anesthesiologist_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("nurse_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("urgency_level", sa.String(length=16), server_default="elective"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    op.create_table(
        "schedule_equipments",
        sa.Column("schedule_id", sa.String(length=36),
                  sa.ForeignKey("operating_schedules.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("equipment_id", sa.String(length=36),
                  sa.ForeignKey("equipments.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("quantity_needed", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(length=32), server_default="requested"),
    )


def downgrade() -> None:
    op.drop_table("schedule_equipments")
    op.drop_table("operating_schedules")
    op.drop_table("equipments")
    op.drop_table("operating_rooms")
