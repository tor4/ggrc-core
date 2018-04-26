# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control roles Program Managers propagation"""

import ddt

from ggrc.models import all_models
from integration.ggrc.access_control import rbac_factories
from integration.ggrc.access_control.acl_propagation import base
from integration.ggrc.utils import helpers


@ddt.ddt
class TestProgramManagersPropagation(base.TestACLPropagation):
  """Test Program Managers role permissions propagation"""

  PERMISSIONS = {
      "Creator": {
          "Program": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_control": True,
              "unmap_control": True,
              "read_mapped": True,
              "update_mapped": True,
              "delete_mapped": True,
          },
          "Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "clone": True,
              "read_revisions": True,
              "map_control": True,
              "deprecate": True,
              "archive": True,
              "unarchive": (False, "unimplemented"),
              "summary": True,
          },
          "Assessment": {
              "create": True,
              "generate": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_snapshot": True,
              "deprecate": True,
              "map_comment": True,
              "map_evidence": True,
              "related_assessments": True,
              "related_objects": True,
              "complete": True,
              "in_progress": True,
              "not_started": True,
              "decline": (False, "unimplemented"),
              "verify": (False, "unimplemented"),
          },
          "AssessmentTemplate": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": False,
              "create_and_map": True,
              "raise_issue": True,
              "unmap": True,
          },
          "Issue Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": False,
              "create_and_map": True,
              "unmap": True,
          },
      },
      "Reader": {
          "Program": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_control": True,
              "unmap_control": True,
              "read_mapped": True,
              "update_mapped": True,
              "delete_mapped": True,
          },
          "Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "clone": True,
              "read_revisions": True,
              "map_control": True,
              "deprecate": True,
              "archive": True,
              "unarchive": (False, "unimplemented"),
              "summary": True,
          },
          "Assessment": {
              "create": (True, "unimplemented"),
              "generate": (True, "unimplemented"),
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_snapshot": True,
              "deprecate": True,
              "map_comment": True,
              "map_evidence": True,
              "related_assessments": True,
              "related_objects": True,
              "complete": True,
              "in_progress": True,
              "not_started": True,
              "decline": (False, "unimplemented"),
              "verify": (False, "unimplemented"),
          },
          "AssessmentTemplate": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": False,
              "create_and_map": True,
              "raise_issue": True,
              "unmap": True,
          },
          "Issue Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": False,
              "create_and_map": True,
              "unmap": True,
          },
      },
      "Editor": {
          "Program": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_control": True,
              "unmap_control": True,
              "read_mapped": True,
              "update_mapped": True,
              "delete_mapped": True,
          },
          "Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "clone": True,
              "read_revisions": True,
              "map_control": True,
              "deprecate": True,
              "archive": True,
              "unarchive": (False, "unimplemented"),
              "summary": True,
          },
          "Assessment": {
              "create": True,
              "generate": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_snapshot": True,
              "deprecate": True,
              "map_comment": True,
              "map_evidence": True,
              "related_assessments": True,
              "related_objects": True,
              "complete": True,
              "in_progress": True,
              "not_started": True,
              "decline": (False, "unimplemented"),
              "verify": (False, "unimplemented"),
          },
          "AssessmentTemplate": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": True,
              "create_and_map": True,
              "raise_issue": True,
              "unmap": True,
          },
          "Issue Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": True,
              "create_and_map": True,
              "unmap": True,
          },
      },
  }

  def init_factory(self, role, model, parent):
    """Initialize RBAC factory with propagated Program Managers role.

    Args:
        role: Global Custom role that user have (Creator/Reader/Editor).
        model: Model name for which factory should be got.
        parent: Model name in scope of which objects should be installed.

    Returns:
        Initialized RBACFactory object.
    """
    self.setup_people()
    program_manager_acr = all_models.AccessControlRole.query.filter_by(
        name="Program Managers",
        object_type="Program",
    ).first()

    rbac_factory = rbac_factories.get_factory(model)
    return rbac_factory(self.people[role].id, program_manager_acr, parent)

  @helpers.unwrap(PERMISSIONS)
  def test_access(self, role, model, action_name, expected_result):
    """Program Managers {0:<7}: On {1:<20} test {2:<20} - Expected {3:<2} """
    self.runtest(role, model, action_name, expected_result)
