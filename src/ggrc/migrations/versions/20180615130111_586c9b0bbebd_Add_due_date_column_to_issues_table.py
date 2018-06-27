# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add due_date column to issues table

Create Date: 2018-06-15 13:01:11.165476
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '586c9b0bbebd'
down_revision = 'e1256da10630'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column('issues', sa.Column('due_date', sa.Date(), nullable=True))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_column('issues', 'due_date')
