# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update propagation rules for evidence

Create Date: 2018-04-25 11:28:29.915881
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants as prev_rules
from ggrc.migrations.utils import acr_propagation_constants_document_epic \
  as doc_epic_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = 'b1cb47a3bb3b'
down_revision = '7b9aae5d448a'


def remove_old_rule_tree():
  propagation = prev_rules.GGRC_PROPAGATION
  for object_type, roles_tree in propagation.items():
    acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  remove_old_rule_tree()
  acr_propagation.propagate_roles(
    doc_epic_rules.GGRC_PROPAGATION)
