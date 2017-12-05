/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../import';

describe('GGRC.Components.csvImportWidget', function () {
  'use strict';

  var method; // the method under test
  var viewModel;

  beforeEach(function () {
    viewModel = new (can.Map.extend(Component.prototype.viewModel));
  });

  describe('viewModel.states() method', function () {
    beforeEach(function () {
      method = Component.prototype.viewModel.states.bind(viewModel);
    });

    describe('the returned "import" state config\'s isDisabled() method',
      function () {
        var isDisabled; // the method under test

        /**
         * A factory function for dummy import block info objects.
         *
         * @param {String} objectType - the name of the block, usually the object
         *   type that is represented by it, e.g. "Assessment"
         * @param {Object} rowCounts - the object containing the counts for
         *   different groups of of rows
         *   @param {Number} [rowCounts.totalRows=0] - the number of all rows
         *     in the block, must equal (created + updated + deleted + ignored)
         *   @param {Number} [rowCounts.created=0] - total rows to create
         *   @param {Number} [rowCounts.updated=0] - total rows to update
         *   @param {Number} [rowCounts.deleted=0] - total rows to delete
         *   @param {Number} [rowCounts.ignored=0] - total rows to ignore
         * @param {Boolean} hasErrors - if true then add non empty array "block_errors"
         *    to block, if false then add empty array
         *
         * @return {can.Map} - a new dummy import block info instance
         */
        function makeImportBlock(objectType, rowCounts, hasErrors) {
          var COUNT_FIELD_NAMES = ['created', 'updated', 'deleted', 'ignored'];
          var COUNT_ERR = 'Invalid row counts, the sum of created, updated, ' +
              'deleted, and ignored must equal the total row count.';

          var blockOptions = {
            name: objectType,
            rows: rowCounts.totalRows || 0,
            block_errors: hasErrors ? new can.List({}) : new can.List()
          };
          var combinedCount = 0;

          COUNT_FIELD_NAMES.forEach(function (field) {
            blockOptions[field] = rowCounts[field] || 0;
            combinedCount += blockOptions[field];
          });

          if (combinedCount !== blockOptions.rows) {
            throw new Error(COUNT_ERR);
          }

          return new can.Map(blockOptions);
        }

        beforeEach(function () {
          var importStateConfig;
          viewModel.attr('state', 'import');
          importStateConfig = method();
          isDisabled = importStateConfig.isDisabled;
        });

        it('returns true when import blocks list not available', function () {
          var result;
          viewModel.attr('import', null);
          result = isDisabled();
          expect(result).toBe(true);
        });

        it('returns true when import blocks list is empty', function () {
          var result;
          viewModel.attr('import', []);
          result = isDisabled();
          expect(result).toBe(true);
        });

        it('returns true if all blocks in the list empty', function () {
          var result;
          var importBlocks = [
            makeImportBlock('Assessment', {totalRows: 0}),
            makeImportBlock('Market', {totalRows: 0})
          ];
          viewModel.attr('import', importBlocks);

          result = isDisabled();

          expect(result).toBe(true);
        });

        it('returns true if blocks has errors', function () {
          var result;
          var importBlocks = [
            makeImportBlock('Assessment', {totalRows: 4, ignored: 4}, true),
            makeImportBlock('Market', {totalRows: 0, ignored: 0}),
            makeImportBlock(
              'Contract', {totalRows: 3, created: 1, ignored: 2})
          ];
          viewModel.attr('import', importBlocks);

          result = isDisabled();

          expect(result).toBe(true);
        });

        it('returns true for non-empty block that have all rows ignored',
          function () {
            var result;
            var importBlocks = [
              makeImportBlock('Assessment', {totalRows: 4, ignored: 4})
            ];
            viewModel.attr('import', importBlocks);

            result = isDisabled();

            expect(result).toBe(true);
          }
        );

        it('returns false if there are non-empty blocks containing ' +
          'non-ignored lines',
          function () {
            var result;
            var importBlocks = [
              makeImportBlock('Assessment', {totalRows: 4, ignored: 4}),
              makeImportBlock('Market', {totalRows: 0, ignored: 0}),
              makeImportBlock(
                'Contract', {totalRows: 3, created: 1, ignored: 2})
            ];
            viewModel.attr('import', importBlocks);

            result = isDisabled();

            expect(result).toBe(false);
          }
        );
      }
    );
  });

  describe('requestImport() method', function () {
    var importDfd;

    beforeEach(function () {
      method = Component.prototype.viewModel.requestImport.bind(viewModel);
      importDfd = new can.Deferred();
      spyOn(GGRC.Utils, 'import_request').and.returnValue(importDfd);
      viewModel.prepareDataForCheck = jasmine.createSpy();
      viewModel.beforeProcess = jasmine.createSpy();
    });

    it('sets "analyzing" value to "state" attribute', function () {
      viewModel.attr('state', null);
      method({});
      expect(viewModel.attr('state')).toEqual('analyzing');
    });

    it('sets true to "isLoading" attribute', function () {
      viewModel.attr('isLoading', null);
      method({});
      expect(viewModel.attr('isLoading')).toEqual(true);
    });

    it('sets file id to "fileId" attribute', function () {
      viewModel.attr('fileId', null);
      method({id: '12343'});
      expect(viewModel.attr('fileId')).toEqual('12343');
    });

    it('sets file name to "fileName" attribute', function () {
      viewModel.attr('fileName', null);
      method({name: 'import_objects'});
      expect(viewModel.attr('fileName')).toEqual('import_objects');
    });

    it('calls import_request method from utils with data containing file id' +
    ' to check data for import', function () {
      method({id: '12343'});
      expect(GGRC.Utils.import_request).toHaveBeenCalledWith({
        data: {id: '12343'},
      }, true);
    });

    describe('after getting response', function () {
      var checkObject;

      beforeEach(function () {
        viewModel.element = 'element';
        checkObject = {
          check: 'check',
          data: 'data',
        };
        viewModel.prepareDataForCheck.and.returnValue(checkObject);
      });

      describe('in case of success', function () {
        it('calls prepareDataForCheck method', function (done) {
          var mockData = {data: 'data'};
          importDfd.resolve(mockData);
          method({});
          expect(viewModel.prepareDataForCheck).toHaveBeenCalledWith(mockData);
          done();
        });

        it('calls beforeProcess method', function (done) {
          importDfd.resolve();
          method({});
          expect(viewModel.beforeProcess).toHaveBeenCalledWith(
            checkObject.check, checkObject.data, viewModel.element);
          done();
        });

        it('sets false to isLoading attribute', function (done) {
          importDfd.resolve();
          method({});
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });
      });

      describe('in case of fail', function () {
        var failData;

        beforeEach(function () {
          failData = {
            responseJSON: {message: 'message'},
          };
          spyOn(GGRC.Errors, 'notifier');
        });

        it('sets "select" value to state attribute', function (done) {
          importDfd.reject(failData);
          method({});
          expect(viewModel.attr('state')).toEqual('select');
          done();
        });

        it('calls GGRC errors notifier with error message', function (done) {
          importDfd.reject(failData);
          method({});
          expect(GGRC.Errors.notifier).toHaveBeenCalledWith('error',
            failData.responseJSON.message);
          done();
        });

        it('sets false to isLoading attribute', function (done) {
          importDfd.reject(failData);
          method({});
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });
      });
    });
  });

  describe('"#import_btn.state-select click" handler',
  function () {
    var authDfd;

    beforeEach(function () {
      method = Component.prototype
        .events['#import_btn.state-select click'];
      authDfd = new can.Deferred();
      spyOn(GGRC.Controllers.GAPI, 'reAuthorize').and.returnValue(authDfd);
      spyOn(gapi.auth, 'getToken').and.returnValue('mockToken');
      spyOn(gapi, 'load');
      spyOn(GGRC.Controllers.GAPI, 'oauth_dfd');
    });

    it('calls gdrive authorization', function () {
      method();
      expect(GGRC.Controllers.GAPI.reAuthorize)
        .toHaveBeenCalledWith('mockToken');
    });

    it('loads gdrive picker after authorization', function () {
      authDfd.resolve();

      method();
      expect(gapi.load).toHaveBeenCalledWith('picker',
        {callback: jasmine.any(Function)});
    });
  });

  describe('".state-import click" handler', () => {
    let method;
    let ev;

    beforeEach(() => {
      method = Component.prototype.events['.state-import click']
        .bind({viewModel});
      ev = document.createEvent('event');
    });

    it('sets "importing" state', () => {
      viewModel.attr('state', 'any state');
      spyOn(GGRC.Utils, 'import_request').and.returnValue(can.Deferred());

      method({}, ev);
      expect(viewModel.attr('state')).toEqual('importing');
    });

    it('makes import request', () => {
      spyOn(GGRC.Utils, 'import_request').and.returnValue(can.Deferred());

      method({}, ev);
      expect(GGRC.Utils.import_request).toHaveBeenCalled();
    });

    it('handles success request result', () => {
      let dfd = can.Deferred().resolve();

      viewModel.attr('isLoading', true);
      spyOn(GGRC.Utils, 'import_request').and
        .returnValue(dfd);
      spyOn(viewModel, 'processLoadedInfo');

      method({}, ev);

      expect(viewModel.processLoadedInfo).toHaveBeenCalled();
      expect(viewModel.attr('state')).toEqual('success');
      expect(viewModel.attr('isLoading')).toEqual(false);
    });

    it('handles failed request result', () => {
      let dfd = can.Deferred().reject({responseJSON: {}});

      viewModel.attr('isLoading', true);
      spyOn(GGRC.Utils, 'import_request').and
        .returnValue(dfd);
      spyOn(GGRC.Errors, 'notifier');

      method({}, ev);

      expect(viewModel.attr('state')).toEqual('select');
      expect(GGRC.Errors.notifier).toHaveBeenCalled();
      expect(viewModel.attr('isLoading')).toEqual(false);
    });
  });
});
