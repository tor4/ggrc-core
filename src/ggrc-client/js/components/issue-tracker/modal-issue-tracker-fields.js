/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../dropdown/dropdown';
import '../numberbox/numberbox';
import template from './templates/modal-issue-tracker-fields.mustache';
import {showTrackerNotification} from
  './temporary-issue-tracker-notification';

const tag = 'modal-issue-tracker-fields';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    instance: {},
    note: '',
    linkingNote: '',
    setIssueTitle: false,
    allowToChangeId: false,
    isTicketIdMandatory: false,
    setTicketIdMandatory() {
      let instance = this.attr('instance');

      if (instance.class.model_singular === 'Issue') {
        this.attr('isTicketIdMandatory',
          ['Fixed', 'Fixed and Verified', 'Deprecated']
            .includes(instance.attr('status')));
      }
    },
  },
  events: {
    inserted() {
      this.viewModel.setTicketIdMandatory();
    },
    '{viewModel.instance.issue_tracker} hotlist_id'() {
      if (this.viewModel.instance.attr('type') === 'Assessment') {
        showTrackerNotification();
      }
    },
    '{viewModel.instance} status'() {
      this.viewModel.setTicketIdMandatory();
    },
  },
});
