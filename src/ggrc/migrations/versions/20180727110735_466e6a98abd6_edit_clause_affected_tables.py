# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update tables affected with Clauses migration

Create Date: 2018-07-27 11:07:35.759282
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '466e6a98abd6'
down_revision = '946cca846b01'

MODELS_FIELDS = [
    ("assessments", "assessment_type", None),
    ("labels", "object_type", None),
    ("assessment_templates", "template_object_type", None),
    ("automappings", "source_type", "source_id"),
    ("automappings", "destination_type", "destination_id"),
    ("custom_attribute_values", "attributable_type", "attributable_id"),
    ("events", "resource_type", "resource_id"),
    ("fulltext_record_properties", "type", "key"),
    ("object_people", "personable_type", "personable_id"),
    ("relationships", "source_type", "source_id"),
    ("relationships", "destination_type", "destination_id"),
    ("contexts", "related_object_type", "related_object_id"),
    ("issuetracker_issues", "object_type", "object_id"),
    ("object_labels", "object_type", "object_id"),
    ("proposals", "instance_type", "instance_id"),
    ("snapshots", "child_type", "child_id"),
    ("snapshots", "parent_type", "parent_id"),
]

# Constant definitions for upgrade()
UPDATE_VALUES_WITH_ID = """
    UPDATE `{table}` t
    SET `{column}` = "Requirement",
        `{id_column}` = (SELECT `requirement_id`
                         FROM `clause_id_mapping` mp
                         WHERE mp.`clause_id` = t.`{id_column}`)
    WHERE `{column}` = "Clause" AND
          `{id_column}` IN (SELECT `clause_id`
                            FROM `clause_id_mapping`)
"""

UPDATE_VALUES = """
    UPDATE `{table}`
    SET `{column}` = "Requirement"
    WHERE `{column}` = "Clause"
"""

UPDATE_GLOBAL_CAD = """
    UPDATE `custom_attribute_definitions`
    SET `definition_type` = "requirement"
    WHERE `definition_type` = "clause" AND `definition_id` IS NULL
"""

UPDATE_LOCAL_CAD = """
    UPDATE `custom_attribute_definitions` cad
    SET `definition_type` = "requirement",
        `definition_id` = (SELECT `requirement_id`
                           FROM `clause_id_mapping` mp
                           WHERE mp.`clause_id` = cad.`definition_id`)
    WHERE `definition_type` = "clause" AND `definition_id` IS NOT NULL
"""


def update_tables(connection):
  """Updates affected tables"""

  for table, column, id_column in MODELS_FIELDS:
    if id_column:
      connection.execute(UPDATE_VALUES_WITH_ID.format(column=column,
                                                      table=table,
                                                      id_column=id_column))
    else:
      connection.execute(UPDATE_VALUES.format(column=column, table=table))

  connection.execute(UPDATE_GLOBAL_CAD)
  connection.execute(UPDATE_LOCAL_CAD)


def upgrade():
  """Upgrade database data, creating a new revision."""
  connection = op.get_bind()
  update_tables(connection)


def downgrade():
  """Downgrade database data back to the previous revision."""
  pass
