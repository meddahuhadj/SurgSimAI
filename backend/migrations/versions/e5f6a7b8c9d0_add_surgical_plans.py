"""add surgical_plans table (versioned surgical plan workflow)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-03 00:00:00.000000

Cycle de planification réelle : plans chirurgicaux versionnés par patient,
avec statuts draft → reviewed → validated (signé) | rejected. Miroir de
models.SurgicalPlan (voir aussi migrations/schema.sql).

NOTE: la migration b2f3d4e5f6a7 (schéma v2-nextgen de recherche) créait déjà
une table surgical_plans (stratégie IA : twin_id, strategy_status, ai_risk_score…).
Ce nouveau cycle de planification versionné remplace cette table : on la supprime
d'abord pour rendre `alembic upgrade head` reproductible sur PostgreSQL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('surgical_plans')
    op.create_table('surgical_plans',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('patient_id', sa.String(length=32), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('procedure', sa.String(length=256), nullable=True),
    sa.Column('author_id', sa.Integer(), nullable=True),
    sa.Column('author_name', sa.String(length=128), nullable=True),
    sa.Column('snapshot', sa.JSON(), nullable=True),
    sa.Column('source_series_id', sa.String(length=36), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('signed_by', sa.String(length=128), nullable=True),
    sa.Column('signed_at', sa.DateTime(), nullable=True),
    sa.Column('reviewed_by', sa.String(length=128), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('patient_id', 'version', name='uq_surgical_plans_patient_version')
    )
    op.create_index('idx_surgical_plans_patient', 'surgical_plans', ['patient_id'], unique=False)
    op.create_index('idx_surgical_plans_status', 'surgical_plans', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_surgical_plans_status', table_name='surgical_plans')
    op.drop_index('idx_surgical_plans_patient', table_name='surgical_plans')
    op.drop_table('surgical_plans')
