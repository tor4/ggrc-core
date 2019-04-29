/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../mapper-results-item-details';

describe('mapper-results-item-details component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    let init;
    init = Component.prototype.viewModel.prototype.init;
    Component.prototype.viewModel.prototype.init = undefined;
    viewModel = getComponentVM(Component);
    Component.prototype.viewModel.prototype.init = init;
    viewModel.init = init;
  });

  describe('init() method', function () {
    let instance;
    beforeEach(function () {
      instance = {
        type: 'Control',
      };
      viewModel.attr('instance', instance);
    });
    it('sets correct instance for Snapshot objects', function () {
      let result;
      let snapshotInstance = {
        snapshotObject: 'snapshotObject',
      };
      viewModel.attr('instance', snapshotInstance);
      viewModel.init();
      result = viewModel.attr('instance');
      expect(result).toEqual('snapshotObject');
    });

    it('sets model for non-snapshot objects', function () {
      let result;
      viewModel.init();
      result = viewModel.attr('model');
      expect(result.model_singular)
        .toEqual('Control');
    });
  });
});
