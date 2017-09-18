# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
setup folder field value

Create Date: 2017-10-27 12:54:14.650691
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

from ggrc.migrations.utils import object_folders


# revision identifiers, used by Alembic.
revision = '526f9a224cb5'
down_revision = '18e8f4b274c3'


PAIRS = (
    ('programs', 'Program'),
    ('audits', 'Audit'),
    ('controls', 'Control'),
)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  for table, model in PAIRS:
    object_folders.update(op, table, model)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  for table, model in PAIRS:
    object_folders.downgrade(op, table, model)
