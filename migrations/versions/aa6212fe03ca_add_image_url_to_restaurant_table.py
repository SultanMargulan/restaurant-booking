"""Add image_url to Restaurant table

Revision ID: aa6212fe03ca
Revises: ef23f6cba8d2
Create Date: 2025-02-16 19:51:52.455952

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aa6212fe03ca'
down_revision = 'ef23f6cba8d2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.add_column(sa.Column('image_url', sa.String(length=300), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.drop_column('image_url')

    # ### end Alembic commands ###
