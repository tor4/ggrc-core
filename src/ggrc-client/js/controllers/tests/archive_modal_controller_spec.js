/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Ctrl from '../modals/archive_modal_controller';

describe('ToggleArchive modal', function () {
  'use strict';

  describe('click() event', function () {
    let displayName = 'DISPLAY NAME';
    let event;
    let eventObj;
    let $element;
    let instance;
    let ctrlInst;
    let pendingRefresh;
    let pendingSave;

    beforeEach(function () {
      pendingRefresh = new $.Deferred();
      pendingSave = new $.Deferred();

      $element = $('<div data-modal_form="">' +
        '<a data-dismiss="modal"></a>' +
        '</div>');
      instance = new can.Map({
        save: jasmine.createSpy('save')
          .and.returnValue(pendingSave.promise()),
        refresh: jasmine.createSpy('save')
          .and.returnValue(pendingRefresh.promise()),
        display_name: function () {
          return displayName;
        },
      });

      ctrlInst = {
        bindXHRToButton: jasmine.createSpy('bindXHRToButton'),
        element: $element,
        options: {
          instance: instance,
        },
      };
      spyOn($.fn, 'trigger').and.callThrough();
      event = Ctrl.prototype['a.btn[data-toggle=archive]:not(:disabled) click']
        .bind(ctrlInst);
      eventObj = $.Event();

      jasmine.clock().install();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('was notified when was archived successfully', function () {
      let successMessage = displayName + ' archived successfully';
      event($element, eventObj);
      pendingRefresh.resolve();
      pendingSave.resolve();

      jasmine.clock().tick(1);

      expect(instance.attr('archived')).toBeTruthy();
      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {success: [successMessage]});
    });

    it('was notified when was not archived successfully', function () {
      let errorMessage = 'Internal error';
      event($element, eventObj);
      pendingRefresh.resolve();
      pendingSave.reject({responseText: errorMessage});

      jasmine.clock().tick(1);

      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {error: [errorMessage]});
    });

    it('was notified when was not refreshed successfully', function () {
      let errorMessage = 'Internal error';
      event($element, eventObj);
      pendingRefresh.reject({responseText: errorMessage});

      jasmine.clock().tick(1);

      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).not.toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {error: [errorMessage]});
    });
  });
});
