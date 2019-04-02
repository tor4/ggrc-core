/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {reify} from '../../plugins/utils/reify-utils';

export default Mixin.extend(
  issueTrackerUtils.issueTrackerStaticFields,
  {
    'after:init': function () {
      this.initIssueTracker();
      this.trackAuditUpdates();
    },
    'before:refresh'() {
      issueTrackerUtils.cleanUpWarnings(this);
    },
    after_save() {
      issueTrackerUtils.checkWarnings(this);
    },
    trackAuditUpdates() {
      if (!GGRC.ISSUE_TRACKER_ENABLED) {
        return;
      }

      const audit = this.attr('audit') && reify(this.attr('audit'));

      if (!audit) {
        return;
      }

      audit.bind('updated', (event) => {
        this.attr('audit', event.target);
        this.initIssueTrackerForAssessment();
      });
    },
    initIssueTracker() {
      if (!GGRC.ISSUE_TRACKER_ENABLED) {
        return;
      }

      if (!this.attr('issue_tracker')) {
        this.attr('issue_tracker', new can.Map({}));
      }

      let audit = this.getParentAudit();

      this.attr('audit', audit);
      this.initIssueTrackerForAssessment();
    },
    getParentAudit() {
      if (this.isNew()) {
        return getPageInstance();
      } else {
        return this.audit;
      }
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
      return this.attr('can_use_issue_tracker')
        && issueTrackerUtils.isIssueCreated(this);
    },
    issueTrackerEnabled() {
      return this.attr('can_use_issue_tracker')
        && issueTrackerUtils.isIssueTrackerEnabled(this);
    },
  },
);
