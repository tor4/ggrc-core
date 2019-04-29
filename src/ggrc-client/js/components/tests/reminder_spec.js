/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../reminder';

describe('reminder component', function () {
  describe('reminder() method', function () {
    let eventObj;
    let instance;
    let method; // the method under test
    let pendingRefresh;
    let pendingSave;
    let viewModel;
    let $element;

    beforeEach(function () {
      pendingRefresh = new $.Deferred();
      pendingSave = new $.Deferred();

      instance = new can.Map({
        refresh: jasmine.createSpy('refresh')
          .and.returnValue(pendingRefresh.promise()),
        save: jasmine.createSpy('save')
          .and.returnValue(pendingSave.promise()),
      });

      viewModel = new can.Map({
        instance: instance,
      });
      eventObj = $.Event();
      $element = $('<div></div>');

      method = Component.prototype.viewModel.prototype.reminder.bind(viewModel);
    });

    it('saves the instance only after it has been refreshed', function () {
      method(viewModel, $element, eventObj);

      expect(instance.save).not.toHaveBeenCalled();
      pendingRefresh.resolve(instance);
      expect(instance.save).toHaveBeenCalled();
    });
  });
});
