"""add OR Command Center constraint engine tables and procedures

Revision ID: g7h8i9j0k1l2
Revises: f7a8b9c0d1e2
Create Date: 2026-08-10 00:00:00.000000

Moteur de contraintes et de pilotage du bloc :
  - surgical_procedures : catalogue métier des actes avec exigences matérielles/réa
  - staff_availabilities, room_availabilities, equipment_availabilities, bed_availabilities : objets de disponibilité
  - operating_schedules : ajouts procedure_id, temps réel (actual_incision_time, actual_end_time, delay_mins) et réservations USI.

⚠️ down_revision changé de 'f6a7b8c9d0e1' à 'f7a8b9c0d1e2' : cette migration
référence operating_rooms/equipments (FK) et ALTER operating_schedules, trois
tables qui n'avaient jamais été créées par aucune migration avant
f7a8b9c0d1e2 — voir son en-tête pour le détail du bug de déploiement corrigé.
Cette migration elle-même n'a donc jamais pu s'exécuter avec succès via
`alembic upgrade` avant ce correctif.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'g7h8i9j0k1l2'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. surgical_procedures
    op.create_table(
        'surgical_procedures',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('specialty', sa.String(length=32), nullable=False, server_default='hbp'),
        sa.Column('estimated_duration_mins', sa.Integer(), nullable=False, server_default='120'),
        sa.Column('min_duration_mins', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('max_duration_mins', sa.Integer(), nullable=False, server_default='300'),
        sa.Column('urgency_default', sa.String(length=16), server_default='elective'),
        sa.Column('complexity_level', sa.String(length=16), server_default='medium'),
        sa.Column('anesthesia_type', sa.String(length=32), server_default='general'),
        sa.Column('required_equipment', sa.JSON(), nullable=True),
        sa.Column('required_icu_bed', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('required_icu_duration_hours', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('required_surgeon_specialty', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. staff_availabilities
    op.create_table(
        'staff_availabilities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('availability_type', sa.String(length=32), server_default='available', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. room_availabilities
    op.create_table(
        'room_availabilities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('operating_room_id', sa.String(length=36), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('availability_type', sa.String(length=32), server_default='available', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['operating_room_id'], ['operating_rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. equipment_availabilities
    op.create_table(
        'equipment_availabilities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('equipment_id', sa.String(length=36), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('availability_type', sa.String(length=32), server_default='available', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. bed_availabilities
    op.create_table(
        'bed_availabilities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('bed_identifier', sa.String(length=64), nullable=False),
        sa.Column('department', sa.String(length=32), server_default='USI', nullable=False),
        sa.Column('is_occupied', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('occupied_by_patient_id', sa.String(length=32), nullable=True),
        sa.Column('reserved_from', sa.DateTime(), nullable=True),
        sa.Column('reserved_until', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['occupied_by_patient_id'], ['patients.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Extensions à operating_schedules
    op.add_column('operating_schedules', sa.Column('procedure_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_operating_schedules_procedure_id', 'operating_schedules', 'surgical_procedures', ['procedure_id'], ['id'], ondelete='SET NULL')
    
    op.add_column('operating_schedules', sa.Column('actual_incision_time', sa.DateTime(), nullable=True))
    op.add_column('operating_schedules', sa.Column('actual_end_time', sa.DateTime(), nullable=True))
    op.add_column('operating_schedules', sa.Column('delay_mins', sa.Integer(), server_default='0', nullable=False))
    op.add_column('operating_schedules', sa.Column('icu_bed_reserved', sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column('operating_schedules', sa.Column('icu_reservation_start', sa.DateTime(), nullable=True))
    op.add_column('operating_schedules', sa.Column('icu_reservation_end', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_constraint('fk_operating_schedules_procedure_id', 'operating_schedules', type_='foreignkey')
    op.drop_column('operating_schedules', 'icu_reservation_end')
    op.drop_column('operating_schedules', 'icu_reservation_start')
    op.drop_column('operating_schedules', 'icu_bed_reserved')
    op.drop_column('operating_schedules', 'delay_mins')
    op.drop_column('operating_schedules', 'actual_end_time')
    op.drop_column('operating_schedules', 'actual_incision_time')
    op.drop_column('operating_schedules', 'procedure_id')

    op.drop_table('bed_availabilities')
    op.drop_table('equipment_availabilities')
    op.drop_table('room_availabilities')
    op.drop_table('staff_availabilities')
    op.drop_table('surgical_procedures')
