/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

export default can.Component.extend({
  tag: 'info-pane-save-status',
  leakScope: true,
  viewModel: can.Map.extend({
    infoPaneSaving: false,
  }),
});
