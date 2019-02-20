# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Editor permissions. """

# pylint: disable=invalid-name

scope = "System"
description = """
  This role grants a user basic object creation and editing permission.
  """
permissions = {
    "read": [
        "AccessControlRole",
        "BackgroundTask",
        "Workflow",
        "TaskGroup",
        "TaskGroupObject",
        "TaskGroupTask",
        "Cycle",
        "CycleTaskGroup",
        "CycleTaskGroupObjectTask",
        "CycleTaskEntry",
        "AccessControlList",
        "Audit",
        "Snapshot",
        "Comment",
        "Control",
        "Assessment",
        "AssessmentTemplate",
        "CustomAttributeDefinition",
        "CustomAttributeValue",
        "Issue",
        "DataAsset",
        "AccessGroup",
        "Directive",
        "Contract",
        "Policy",
        "Regulation",
        "Standard",
        "Document",
        "Evidence",
        "Facility",
        "Market",
        "Objective",
        "ObjectPerson",
        "Option",
        "OrgGroup",
        "Risk",
        "RiskAssessment",
        "Threat",
        "Vendor",
        "PopulationSample",
        "Product",
        "Project",
        "Relationship",
        "Requirement",
        "SystemOrProcess",
        "System",
        "KeyReport",
        "Process",
        "Metric",
        "Person",
        "Program",
        "Proposal",
        "TechnologyEnvironment",
        "Revision",
        "ProductGroup",
        "Role",
        "Context",
        "UserRole",
        "NotificationConfig",
        "PersonProfile",
    ],
    "create": [
        "Audit",
        "BackgroundTask",
        "Snapshot",
        "Workflow",
        "TaskGroup",
        "TaskGroupObject",
        "TaskGroupTask",
        "Cycle",
        "CycleTaskGroupObjectTask",
        "CycleTaskEntry",
        "Comment",
        "Control",
        "CustomAttributeDefinition",
        "CustomAttributeValue",
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "DataAsset",
        "AccessGroup",
        "Directive",
        "Contract",
        "Policy",
        "Regulation",
        "Standard",
        "Document",
        "Evidence",
        "Facility",
        "Market",
        "Objective",
        "ObjectPerson",
        "Option",
        "OrgGroup",
        "Risk",
        "RiskAssessment",
        "Threat",
        "Vendor",
        "PopulationSample",
        "Product",
        "Project",
        "Relationship",
        "Requirement",
        "SystemOrProcess",
        "System",
        "KeyReport",
        "Process",
        "Metric",
        "Program",
        "Proposal",
        "TechnologyEnvironment",
        "Role",
        "ProductGroup",
        "UserRole",
        "Context",
        "Review"
    ],
    "update": [
        {
            "type": "Audit",
            "terms": {
                "property_name": "archived",
                "prevent_if": True
            },
            "condition": "has_not_changed"
        },
        "Snapshot",
        "Workflow",
        "TaskGroup",
        "TaskGroupTask",
        "CycleTaskGroupObjectTask",
        "CycleTaskEntry",
        "Control",
        "CustomAttributeDefinition",
        "CustomAttributeValue",
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "DataAsset",
        "AccessGroup",
        "Directive",
        "Contract",
        "Policy",
        "Regulation",
        "Standard",
        "Document",
        "Evidence",
        "Facility",
        "Market",
        "Objective",
        "ObjectPerson",
        "Person",
        "Option",
        "OrgGroup",
        "RiskAssessment",
        "Vendor",
        "PopulationSample",
        "Product",
        "Project",
        "Proposal",
        "TechnologyEnvironment",
        "Relationship",
        "Requirement",
        "SystemOrProcess",
        "System",
        "KeyReport",
        "Process",
        "Metric",
        "ProductGroup",
        "Program",
        "Role",
        "UserRole",
        "Context",
        "Review",
        "PersonProfile",
    ],
    "delete": [
        {
            "type": "Audit",
            "terms": {
                "property_name": "archived",
                "prevent_if": False
            },
            "condition": "has_changed"
        },
        "Workflow",
        "TaskGroup",
        "TaskGroupObject",
        "TaskGroupTask",
        "CycleTaskEntry",
        "Control",
        "CustomAttributeDefinition",
        "CustomAttributeValue",
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "DataAsset",
        "AccessGroup",
        "Directive",
        "Contract",
        "Policy",
        "Regulation",
        "Standard",
        "Facility",
        "Market",
        "Objective",
        "ObjectPerson",
        "Option",
        "OrgGroup",
        "RiskAssessment",
        "Vendor",
        "PopulationSample",
        "Product",
        "Project",
        "Relationship",
        "Requirement",
        "SystemOrProcess",
        "System",
        "KeyReport",
        "Process",
        "Metric",
        "Program",
        "TechnologyEnvironment",
        "Role",
        "UserRole",
        "ProductGroup",
        "Context",
    ]
}
