/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC.Components.gDriveFolderPicker', function () {
  'use strict';

  var Component;
  var events;
  var viewModel;
  var folderId = 'folder id';

  beforeAll(function () {
    Component = GGRC.Components.get('gDriveFolderPicker');
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = GGRC.Components.getViewModel('gDriveFolderPicker');
  });

  describe('events', function () {
    describe('"inserted" handler', function () {
      var method;
      var that;

      beforeEach(function () {
        that = {
          viewModel: viewModel,
          element: $('<div></div>')
        };
        method = events.inserted.bind(that);
      });

      it('does nothing when folder is not attached', function () {
        viewModel.attr('instance', {
          folder: null
        });
        viewModel.attr('readonly', true);

        spyOn(viewModel, 'setRevisionFolder');
        spyOn(viewModel, 'setCurrent');

        method();
        expect(viewModel.setRevisionFolder).not.toHaveBeenCalled();
        expect(viewModel.setCurrent).not.toHaveBeenCalled();
      });

      it('calls setRevisionFolder() for snapshot with attached folder',
      function () {
        viewModel.attr('instance', {
          folder: folderId
        });
        viewModel.attr('readonly', true);
        spyOn(viewModel, 'setRevisionFolder');

        method();
        expect(viewModel.setRevisionFolder).toHaveBeenCalled();
      });

      it('calls setCurrent() when folder is attached', function () {
        viewModel.attr('instance', {
          folder: folderId
        });
        viewModel.attr('readonly', false);
        spyOn(viewModel, 'setCurrent');

        method();
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
      });
    });

    describe('"a[data-toggle=gdrive-remover] click" handler', function () {
      var method;
      var that;

      beforeEach(function () {
        viewModel.attr('instance', {
          folder: folderId
        });

        that = {
          viewModel: viewModel,
          element: $('<div></div>')
        };
        method = events['a[data-toggle=gdrive-remover] click'].bind(that);
      });

      it('unsets folder id for deferred instance', function () {
        viewModel.attr('deferred', true);

        spyOn(viewModel, 'unsetCurrent');

        method();
        expect(viewModel.instance.attr('folder')).toEqual(null);
        expect(viewModel.unsetCurrent).toHaveBeenCalled();
      });

      it('calls unlinkFolder() for existing instance', function () {
        viewModel.attr('deferred', false);

        spyOn(viewModel, 'unsetCurrent');
        spyOn(viewModel, 'unlinkFolder')
          .and.returnValue(can.Deferred().resolve());

        method();
        expect(viewModel.unlinkFolder).toHaveBeenCalled();
        expect(viewModel.unsetCurrent).toHaveBeenCalled();
      });
    });

    describe('".entry-attachment picked" handler', function () {
      var method;
      var that;
      var element;
      var pickedFolders;

      beforeEach(function () {
        element = $('<div></div>').data('type', 'folders');
        viewModel.attr('instance', {
          folder: null
        });
        pickedFolders = {
          files: [{
            mimeType: 'application/vnd.google-apps.folder',
            id: folderId
          }]
        };

        that = {
          viewModel: viewModel
        };
        method = events['.entry-attachment picked'].bind(that);
      });

      it('notifies when selected not a folder', function () {
        var data = {
          files: [{mimeType: 'not a folder mime type'}]
        };
        spyOn($.fn, 'trigger').and.callThrough();

        method(element, jasmine.any(Object), data);
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
          {error: [jasmine.any(String)]});
      });

      it('set folder id for deferred instance', function () {
        viewModel.attr('deferred', true);

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder');

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.instance.attr('folder')).toEqual(folderId);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).not.toHaveBeenCalled();
      });

      it('calls linkFolder() for existing instance', function () {
        viewModel.attr('deferred', false);

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder').and.returnValue(can.Deferred());

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).toHaveBeenCalledWith(folderId);
      });
    });
  });
});
