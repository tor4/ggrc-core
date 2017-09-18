# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add folder fields

Create Date: 2017-10-27 12:58:42.499466
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '5739abdd2fe4'
down_revision = '251191c050d0'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column('workflows', sa.Column('folder', sa.Text(), nullable=True))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_column('workflows', sa.Column('folder', sa.Text(), nullable=True))
