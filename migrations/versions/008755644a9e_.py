"""empty message

Revision ID: 008755644a9e
Revises: 8db0da8f5eca
Create Date: 2025-03-28 15:34:17.822154

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008755644a9e'
down_revision = '8db0da8f5eca'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.add_column(sa.Column('promo', sa.String(length=200), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.drop_column('promo')

    # ### end Alembic commands ###
