/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';
import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {RELATED_AUDIT_LOADED} from '../../events/eventTypes';

export default Mixin('assessmentIssueTracker',
  issueTrackerUtils.issueTrackerStaticFields,
  {
    'after:init': function () {
      this.trackAuditUpdates();

      if (this.isNew()) {
        this.initIssueTracker();
      }
    },
    'before:refresh'() {
      issueTrackerUtils.cleanUpWarnings(this);
    },
    'before:destroy'() {
      this.unbind(RELATED_AUDIT_LOADED.type);
    },
    after_save() {
      issueTrackerUtils.checkWarnings(this);
    },
    trackAuditUpdates() {
      this.bind(RELATED_AUDIT_LOADED.type, () => {
        this.initIssueTracker();
      });
    },
    initIssueTracker() {
      if (!GGRC.ISSUE_TRACKER_ENABLED) {
        return can.Deferred().reject();
      }

      if (!this.attr('issue_tracker')) {
        this.attr('issue_tracker', new can.Map({}));
      }

      let audit = this.getParentAudit();
      if (audit) {
        this.initIssueTrackerForAssessment();
      }
    },
    getParentAudit() {
      if (this.isNew()) {
        let pageInstance = getPageInstance();
        if (pageInstance && pageInstance.type === 'Audit') {
          return pageInstance;
        }
      }

      return this.attr('audit');
    },
    /**
     * Initializes Issue Tracker for Assessment and Assessment Template
     */
    initIssueTrackerForAssessment() {
      let auditItr = this.attr('audit.issue_tracker') || {};
      let itrEnabled = this.isNew()
        // turned ON for Assessment & Assessment Template by default
        // for newly created instances
        ? (auditItr && auditItr.enabled)
        // for existing instance, the value from the server will be used
        : false;

      let issueTitle = this.title || '';

      let issueTracker = new can.Map(auditItr).attr({
        title: issueTitle,
        enabled: itrEnabled,
      });

      issueTrackerUtils.initIssueTrackerObject(
        this,
        issueTracker,
        auditItr.enabled
      );
    },
    issueCreated() {
      return GGRC.ISSUE_TRACKER_ENABLED
        && issueTrackerUtils.isIssueCreated(this);
    },
    issueTrackerEnabled() {
      return this.attr('can_use_issue_tracker')
        && issueTrackerUtils.isIssueTrackerEnabled(this);
    },
  },
);
