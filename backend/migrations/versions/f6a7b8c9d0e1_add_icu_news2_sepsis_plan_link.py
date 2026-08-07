"""add ICU NEWS2, sepsis alert and validated-plan link

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-07 00:00:00.000000

Étend le suivi réanimation/USI :
  - constantes vitales NEWS2 (resp_rate_rpm, spo2_pct, supplemental_o2,
    systolic_bp_mmhg, heart_rate_bpm, temperature_c, avpu) + news2_total
    calculé côté serveur (clinical_scores.py) ;
  - sepsis_alert : dysfonction organique Sepsis-3 (SOFA >= 2) ;
  - plan_id : lien de traçabilité vers le plan chirurgical VALIDÉ
    (surgical_plans.id, ON DELETE SET NULL).
Miroir de models.IcuFollowUp (voir aussi migrations/schema.sql).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('icu_followups', sa.Column('resp_rate_rpm', sa.Integer(), nullable=True))
    op.add_column('icu_followups', sa.Column('spo2_pct', sa.Integer(), nullable=True))
    op.add_column('icu_followups', sa.Column('supplemental_o2', sa.Boolean(),
                                             server_default=sa.false(), nullable=False))
    op.add_column('icu_followups', sa.Column('systolic_bp_mmhg', sa.Integer(), nullable=True))
    op.add_column('icu_followups', sa.Column('heart_rate_bpm', sa.Integer(), nullable=True))
    op.add_column('icu_followups', sa.Column('temperature_c', sa.Float(), nullable=True))
    op.add_column('icu_followups', sa.Column('avpu', sa.String(length=8), nullable=True))
    op.add_column('icu_followups', sa.Column('news2_total', sa.Integer(), nullable=True))
    op.add_column('icu_followups', sa.Column('sepsis_alert', sa.Boolean(),
                                             server_default=sa.false(), nullable=False))
    op.add_column('icu_followups', sa.Column('plan_id', sa.String(length=36), nullable=True))
    op.create_index('ix_icu_followups_plan_id', 'icu_followups', ['plan_id'], unique=False)
    op.create_foreign_key(
        'fk_icu_followups_plan_id', 'icu_followups', 'surgical_plans',
        ['plan_id'], ['id'], ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_icu_followups_plan_id', 'icu_followups', type_='foreignkey')
    op.drop_index('ix_icu_followups_plan_id', table_name='icu_followups')
    op.drop_column('icu_followups', 'plan_id')
    op.drop_column('icu_followups', 'sepsis_alert')
    op.drop_column('icu_followups', 'news2_total')
    op.drop_column('icu_followups', 'avpu')
    op.drop_column('icu_followups', 'temperature_c')
    op.drop_column('icu_followups', 'heart_rate_bpm')
    op.drop_column('icu_followups', 'systolic_bp_mmhg')
    op.drop_column('icu_followups', 'supplemental_o2')
    op.drop_column('icu_followups', 'spo2_pct')
    op.drop_column('icu_followups', 'resp_rate_rpm')
