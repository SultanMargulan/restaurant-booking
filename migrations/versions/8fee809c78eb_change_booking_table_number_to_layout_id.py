"""Change Booking.table_number to layout_id

Revision ID: 8fee809c78eb
Revises: 73946d14e379
Create Date: 2025-03-21 10:01:10.041309

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8fee809c78eb'
down_revision = '73946d14e379'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('booking', schema=None) as batch_op:
        batch_op.add_column(sa.Column('layout_id', sa.Integer(), nullable=False))
        batch_op.create_foreign_key(None, 'layout', ['layout_id'], ['id'])
        batch_op.drop_column('table_number')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('booking', schema=None) as batch_op:
        batch_op.add_column(sa.Column('table_number', sa.INTEGER(), autoincrement=False, nullable=False))
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('layout_id')

    # ### end Alembic commands ###
