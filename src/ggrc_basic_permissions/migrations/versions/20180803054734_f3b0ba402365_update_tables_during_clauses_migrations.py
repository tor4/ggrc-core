# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update entries according to Clause -> Requirement migration

Create Date: 2018-08-03 05:47:34.995016
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import json
from alembic import op
# from sqlalchemy import update
from ggrc.models import all_models

# revision identifiers, used by Alembic.
revision = 'f3b0ba402365'
down_revision = '61f4e42f00a9'


MODELS_FIELDS = [
    ("access_control_list", "object_type", "object_id"),
    ("revisions", "resource_type", "resource_id"),
]

# Constant definitions for merging ACR
CREATE_ACR_MAPPING = """
    CREATE TABLE `acr_mapping` (
        `clause_acr_id` int(11) NOT NULL,
        `requirement_acr_id` int(11) NOT NULL
    )
"""

FILL_ACR_MAPPING = """
    INSERT INTO `acr_mapping` (`clause_acr_id`,
                               `requirement_acr_id`)
    SELECT a1.`id`,
           a2.`id`
    FROM `access_control_roles` a1 JOIN `access_control_roles` a2
         ON a1.`name` = a2.`name` AND
            a1.`object_type` = "Clause" AND
            a2.`object_type` = "Requirement"
"""

UPDATE_ACR = """
    UPDATE `access_control_roles`
    SET `object_type` = "Requirement"
    WHERE `object_type` = "Clause" AND
          `id` NOT IN (SELECT `clause_acr_id` FROM `acr_mapping`)
"""

UPDATE_ACR_ID_IN_ACL = """
    UPDATE `access_control_list` acl
    SET `ac_role_id` = (SELECT `requirement_acr_id` FROM `acr_mapping`
                        WHERE `clause_acr_id` = acl.`ac_role_id`)
    WHERE `object_type` = "Clause" AND
          `ac_role_id`  IN (SELECT `clause_acr_id` FROM `acr_mapping`)
"""

# Constant definitions for populating revisions
RECEIVE_REVISIONS = """
    SELECT `id` , `content`
    FROM `revisions`
    WHERE `resource_type` = "Clause"
"""

RECEIVE_MAPPED_ACR = """
    SELECT `clause_acr_id`, `requirement_acr_id`
    FROM `acr_mapping`
"""

UPDATE_ACR_IN_REVISIONS = """
    UPDATE `revisions`
    SET `content` = :cont
    WHERE `id` = {id}
"""

# Constant definitions for tables update.
UPDATE_VALUES_WITH_ID = """
    UPDATE `{tab}` t
    SET `{col}` = "Requirement",
        `{id_col}` = (SELECT `requirement_id`
                         FROM `clause_id_mapping` mp
                         WHERE mp.`clause_id` = t.`{id_col}`)
    WHERE `{col}` = "Clause" AND
          `{id_col}` IN (SELECT `clause_id`
                         FROM `clause_id_mapping`)
"""

# Constant definitions for deleting temporary tables and obsolete values
DELETE_ACR = """
    DELETE FROM `access_control_roles`
    WHERE `object_type` = "Clause"
"""

DELETE_ACR_MAPPING = "DROP TABLE `acr_mapping`"


def populate_acr_in_revisions(connection):
  """Populates merged Clauses ACR in revisions."""
  revisions = connection.execute(RECEIVE_REVISIONS).fetchall()
  all_mapped_acr = connection.execute(RECEIVE_MAPPED_ACR).fetchall()

  mapped_acr = {old: new for old, new in all_mapped_acr}
  values = {rev[0]: json.loads(rev[1]) for rev in revisions}

  for r_id in values:
    content_acl = values[r_id].get("access_control_list")
    if content_acl:
      for acl in content_acl:
        acr = acl.get("ac_role_id", None)
        if acr in mapped_acr:
          acl["ac_role_id"] = mapped_acr[acr]
    values[r_id] = json.dumps(values[r_id])

  rev_table = all_models.Revision.__table__

  for r_id in values:
    connection.execute(
        rev_table.update().values(
            content=values[r_id]).where(rev_table.c.id == r_id)
    )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.execute(CREATE_ACR_MAPPING)
  op.execute(FILL_ACR_MAPPING)
  op.execute(UPDATE_ACR)
  op.execute(UPDATE_ACR_ID_IN_ACL)

  connection = op.get_bind()
  populate_acr_in_revisions(connection)

  for table, column, id_column in MODELS_FIELDS:
    connection.execute(UPDATE_VALUES_WITH_ID.format(col=column,
                                                    tab=table,
                                                    id_col=id_column))

  op.execute(DELETE_ACR)
  op.execute(DELETE_ACR_MAPPING)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
