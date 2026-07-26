"""add nextgen v2 schema postgis pgvector

Revision ID: b2f3d4e5f6a7
Revises: a1f2c3d4e5f6
Create Date: 2026-07-06 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2f3d4e5f6a7'
down_revision: Union[str, None] = 'a1f2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extensions PostGIS et UUID si non présentes
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    # Remarque : En production, PostGIS et pgvector sont activés au niveau instance PostgreSQL :
    # op.execute('CREATE EXTENSION IF NOT EXISTS "postgis";')
    # op.execute('CREATE EXTENSION IF NOT EXISTS "vector";')

    # 2. Table: digital_twins (Jumeaux Numériques 3D et Biophysiques)
    op.create_table(
        'digital_twins',
        sa.Column('id', sa.String(length=36), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('patient_id', sa.String(length=32), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_series_id', sa.String(length=36), sa.ForeignKey('dicom_series.id', ondelete='SET NULL'), nullable=True),
        sa.Column('version', sa.String(length=32), nullable=False, server_default='v2.0-nextgen'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='READY'),
        sa.Column('organ_target', sa.String(length=64), nullable=False, server_default='HBP'),
        sa.Column('mesh_storage_uri', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('biophysical_props', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('vascular_graph_json', sa.JSON(), nullable=True),
        sa.Column('volumetric_metrics', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False)
    )
    op.create_index('ix_digital_twins_patient_id', 'digital_twins', ['patient_id'])

    # 3. Table: surgical_plans (Plans Chirurgicaux & Check-list IA)
    op.create_table(
        'surgical_plans',
        sa.Column('id', sa.String(length=36), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('twin_id', sa.String(length=36), sa.ForeignKey('digital_twins.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', sa.String(length=32), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lead_surgeon_username', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=256), nullable=False),
        sa.Column('specialty', sa.String(length=64), nullable=False, server_default='HBP'),
        sa.Column('planned_procedure_code', sa.String(length=64), nullable=False, server_default='CCAM-HMFA004'),
        sa.Column('strategy_status', sa.String(length=32), nullable=False, server_default='AI_PROPOSED'),
        sa.Column('resection_volume_ml', sa.Float(), nullable=True),
        sa.Column('remnant_volume_ml', sa.Float(), nullable=True),
        sa.Column('remnant_ratio_pct', sa.Float(), nullable=True),
        sa.Column('estimated_blood_loss_ml', sa.Float(), nullable=True),
        sa.Column('estimated_duration_min', sa.Integer(), nullable=True),
        sa.Column('safety_margins_mm', sa.Float(), server_default='5.0', nullable=False),
        sa.Column('ai_risk_score', sa.Float(), nullable=True),
        sa.Column('ai_shap_explanations', sa.JSON(), nullable=True),
        sa.Column('preop_checklist_status', sa.JSON(), nullable=False, server_default='{"all_cleared": false, "warnings": []}'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False)
    )
    op.create_index('ix_surgical_plans_patient_id', 'surgical_plans', ['patient_id'])
    op.create_index('ix_surgical_plans_status', 'surgical_plans', ['strategy_status'])

    # 4. Table: audit_logs (Traçabilité inviolable MDR / HIPAA avec chaînage SHA-256)
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('timestamp_utc', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(length=64), nullable=True),
        sa.Column('user_role', sa.String(length=64), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('action_type', sa.String(length=64), nullable=False),
        sa.Column('target_resource', sa.String(length=128), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('cryptographic_hash', sa.String(length=64), nullable=False),
        sa.Column('prev_log_hash', sa.String(length=64), nullable=True)
    )
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp_utc'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action_type'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('surgical_plans')
    op.drop_table('digital_twins')
