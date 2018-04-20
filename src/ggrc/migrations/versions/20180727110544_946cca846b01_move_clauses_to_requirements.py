# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate Clauses into Requirements

Create Date: 2018-07-27 11:05:44.125518
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '946cca846b01'
down_revision = 'd617da1998ef'

# Constant definition for resolving slug and title conflicts
RESOLUTION_REQUIRED_QUERY = """
    SELECT EXISTS (
        SELECT `clauses`.`slug`
        FROM `clauses` JOIN `requirements`
                       ON `clauses`.`slug` = `requirements`.`slug`
        UNION
        SELECT `clauses`.`title`
        FROM `clauses` JOIN `requirements`
                       ON `clauses`.`title` = `requirements`.`title`
    )
"""

CREATE_TMP_TABLE_QUERY = """
    CREATE TABLE `tmp_conflicts` (
        `origin_slug` varchar(250) null,
        `new_slug` varchar(250) null,
        `origin_title` varchar(250) null,
        `new_title` varchar(250) null,
        `clause_id` int(11) NOT NULL)
"""

CREATE_TMP_ID_TABLE_QUERY = """
    CREATE TABLE `tmp_conflict_id` (
        `clause_id` int(11) NOT NULL
    )
"""

FILL_TMP_TABLE_QUERY = """
    INSERT INTO `tmp_conflicts` (`origin_slug`,
                                 `new_slug`,
                                 `origin_title`,
                                 `new_title`,
                                 `clause_id`)
    SELECT `clauses`.`slug`,
           `clauses`.`slug`,
           `clauses`.`title`,
           `clauses`.`title`,
           `clauses`.`id`
    FROM `clauses` JOIN `requirements`
         ON `clauses`.`slug` = `requirements`.`slug` OR
            `clauses`.`title` = `requirements`.`title`
"""

CONFLICTS_STILL_EXIST_QUERY = """
    SELECT EXISTS (
        SELECT *
        FROM `tmp_conflict_id`
    )
"""

UPDATE_TMP_TABLE_QUERY = """
    UPDATE `tmp_conflicts` cf
    SET `cf`.`new_{col}` =
        CONCAT(LEFT(`cf`.`origin_{col}`,
                    250 - LENGTH(CONCAT("_clause_", {attempt}))),
               "_clause_", {attempt})
    WHERE `cf`.`clause_id` IN (
        SELECT `clause_id`
        FROM `tmp_conflict_id`)
"""

FILL_TMP_ID_TABLE_QUERY = """
    INSERT INTO `tmp_conflict_id` (`clause_id`)
    SELECT *
    FROM (
        SELECT `tmp_conflicts`.`clause_id`
        FROM `tmp_conflicts` JOIN `clauses`
            ON `tmp_conflicts`.`new_{col}` = `clauses`.`{col}`
        WHERE `tmp_conflicts`.`new_{col}` != `tmp_conflicts`.`origin_{col}`
        UNION
        SELECT `tmp_conflicts`.`clause_id`
        FROM `tmp_conflicts` JOIN `requirements`
            ON `tmp_conflicts`.`new_{col}` = `requirements`.`{col}`
    ) t1
"""

UPDATE_INITIAL_TABLE_QUERY = """
    UPDATE `clauses` cl
        SET `cl`.`slug` = (SELECT `new_slug` FROM `tmp_conflicts` t
                           WHERE t.`clause_id` = cl.`id`),
            `cl`.`title` = (SELECT `new_title` FROM `tmp_conflicts` t
                            WHERE t.`clause_id` = cl.`id`)
        WHERE `cl`.`id` IN (
            SELECT `clause_id`
            FROM `tmp_conflicts`
        )
"""

DROP_TMP_TABLE_QUERY = "DROP TABLE `tmp_conflicts`"
DROP_TMP_ID_TABLE_QUERY = "DROP TABLE `tmp_conflict_id`"

# constant definitions for data migration
INSERT_CLAUSES_TO_REQUIREMENT_TABLE = """
    INSERT INTO `requirements` (`modified_by_id`,
                                `created_at`,
                                `updated_at`,
                                `description`,
                                `slug`,
                                `title`,
                                `notes`,
                                `context_id`,
                                `os_state`,
                                `status`,
                                `recipients`,
                                `send_by_default`,
                                `test_plan`,
                                `last_deprecated_date`,
                                `start_date`)
    SELECT `modified_by_id`,
           `created_at`,
           NOW(),
           `description`,
           `slug`,
           `title`,
           `notes`,
           `context_id`,
           `os_state`,
           `status`,
           `recipients`,
           `send_by_default`,
           `test_plan`,
           `end_date`,
           `start_date`
    FROM `clauses`
"""

# constant definitions for id mapping table used for related tables
CREATE_ID_MAPPING_TABLE = """
    CREATE TABLE `clause_id_mapping` (
        `clause_id` int(11) NOT NULL,
        `requirement_id` int(11) NOT NULL,
        `clause_slug` varchar(250) NOT NULL,
        UNIQUE KEY `uq_access_groups` (`clause_id`),
        UNIQUE KEY `uq1_access_groups` (`requirement_id`),
        UNIQUE KEY `uq2_access_groups` (`clause_slug`))
"""

FILL_ID_MAPPING_TABLE = """
    INSERT INTO `clause_id_mapping` (`clause_id`,
                                     `requirement_id`,
                                     `clause_slug`)
    SELECT `clauses`.`id`, `requirements`.`id`, `clauses`.`slug`
    FROM `clauses` JOIN `requirements`
        ON `clauses`.`slug` = `requirements`.`slug`
"""


def resolver(connection, column):
  """Resolves unique constraint conflicts for selected column"""
  attempt_num = 0
  connection.execute(FILL_TMP_ID_TABLE_QUERY.format(col=column))
  sql_existence = CONFLICTS_STILL_EXIST_QUERY.format(col=column)
  while connection.execute(sql_existence).fetchone()[0]:
    connection.execute(UPDATE_TMP_TABLE_QUERY.format(col=column,
                                                     attempt=attempt_num))
    attempt_num += 1
    connection.execute("TRUNCATE TABLE `tmp_conflict_id`")
    connection.execute(FILL_TMP_ID_TABLE_QUERY.format(col=column))


def ensure_clause_uniqueness(connection):
  """Ensures uniqueness for inserted clauses"""
  if not connection.execute(RESOLUTION_REQUIRED_QUERY).fetchone()[0]:
    return

  connection.execute(CREATE_TMP_TABLE_QUERY)
  connection.execute(FILL_TMP_TABLE_QUERY)
  connection.execute(CREATE_TMP_ID_TABLE_QUERY)

  # resolving conflicts
  resolver(connection, "slug")
  resolver(connection, "title")

  connection.execute(UPDATE_INITIAL_TABLE_QUERY)

  connection.execute(DROP_TMP_TABLE_QUERY)
  connection.execute(DROP_TMP_ID_TABLE_QUERY)


def upgrade():
  """Upgrade database data, creating a new revision."""
  connection = op.get_bind()
  ensure_clause_uniqueness(connection)

  op.execute(INSERT_CLAUSES_TO_REQUIREMENT_TABLE)

  op.execute(CREATE_ID_MAPPING_TABLE)
  op.execute(FILL_ID_MAPPING_TABLE)


def downgrade():
  """Downgrade database data back to the previous revision."""
  pass
