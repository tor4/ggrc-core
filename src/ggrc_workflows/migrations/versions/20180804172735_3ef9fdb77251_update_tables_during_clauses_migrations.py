# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update entries according to Clause -> Requirement migration

Create Date: 2018-08-04 17:27:35.408322
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '3ef9fdb77251'
down_revision = 'c17f5f1f273e'


CHANGE_TASK_GROUP_OBJECT = """
    UPDATE `task_group_objects` t
    SET `object_type` = "Requirement",
    `object_id` = (SELECT `requirement_id`
                   FROM `clause_id_mapping` mp
                   WHERE mp.`clause_id` = t.`object_id`)
    WHERE `object_type` = "Clause" AND
          `object_id` IN (SELECT `clause_id`
                          FROM `clause_id_mapping`)
"""

DROP_ID_MAPPING_TABLE = "DROP TABLE `clause_id_mapping`"


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.execute(CHANGE_TASK_GROUP_OBJECT)
  op.execute(DROP_ID_MAPPING_TABLE)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
