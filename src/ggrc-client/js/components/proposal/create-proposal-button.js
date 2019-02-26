/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {isChangeableExternally} from '../../plugins/utils/ggrcq-utils';
import template from './templates/create-proposal-button.stache';

const tag = 'create-proposal-button';

export default can.Component.extend({
  tag,
  template,
  leakScope: true,
  viewModel: {
    define: {
      showProposalButton: {
        get() {
          const instance = this.attr('instance');
          if (!instance) {
            return false;
          }

          return instance.class.isProposable &&
            !isChangeableExternally(instance);
        },
      },
    },
    instance: {},
  },
});
