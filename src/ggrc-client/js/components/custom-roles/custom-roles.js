/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/editable-people-group';
import template from './templates/custom-roles.stache';
import viewModel from './custom-roles-vm';

export default can.Component.extend({
  tag: 'custom-roles',
  view: can.stache(template),
  leakScope: true,
  viewModel,
});
