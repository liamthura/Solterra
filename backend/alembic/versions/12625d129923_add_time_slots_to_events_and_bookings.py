"""add_time_slots_to_events_and_bookings

Revision ID: 12625d129923
Revises: 7ee058d5e342
Create Date: 2025-11-23 17:02:31.633871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '12625d129923'
down_revision: Union[str, None] = '7ee058d5e342'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade():
    # Add time_slots column to events
    op.add_column('events', sa.Column('time_slots', postgresql.JSON(), nullable=True))
    
    # Add time slot columns to bookings
    op.add_column('bookings', sa.Column('time_slot_start', sa.Time(), nullable=True))
    op.add_column('bookings', sa.Column('time_slot_end', sa.Time(), nullable=True))


def downgrade():
    # Remove columns
    op.drop_column('bookings', 'time_slot_end')
    op.drop_column('bookings', 'time_slot_start')
    op.drop_column('events', 'time_slots')