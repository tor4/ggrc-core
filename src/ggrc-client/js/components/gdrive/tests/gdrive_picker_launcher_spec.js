/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as pickerUtils from '../../../plugins/utils/gdrive-picker-utils';
import tracker from '../../../tracker';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../gdrive_picker_launcher';

describe('gdrive-picker-launcher', function () {
  'use strict';

  let viewModel;
  let eventStub = {
    preventDefault: function () {},
  };

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    spyOn(tracker, 'start').and.returnValue(() => {});
  });

  describe('onClickHandler() method', function () {
    it('call confirmationCallback() if it is provided', function () {
      spyOn(viewModel, 'confirmationCallback');

      viewModel.onClickHandler(null, null, eventStub);

      expect(viewModel.confirmationCallback).toHaveBeenCalled();
    });

    it('pass callbackResult to $.when()', function () {
      let dfd = $.Deferred();
      let thenSpy = jasmine.createSpy('then');
      spyOn(viewModel, 'confirmationCallback').and.returnValue(dfd);
      spyOn($, 'when').and.returnValue({
        then: thenSpy,
      });

      viewModel.onClickHandler(null, null, eventStub);

      expect($.when).toHaveBeenCalledWith(dfd);
      expect(thenSpy).toHaveBeenCalled();
    });

    it('pass null to $.when() when callback is not provided', function () {
      let thenSpy = jasmine.createSpy('then');
      spyOn($, 'when').and.returnValue({
        then: thenSpy,
      });

      viewModel.onClickHandler(null, null, eventStub);

      expect($.when).toHaveBeenCalledWith(null);
      expect(thenSpy).toHaveBeenCalled();
    });
  });

  describe('onKeyup() method', function () {
    describe('if escape key was clicked', function () {
      let event;
      let element;

      beforeEach(function () {
        const ESCAPE_KEY_CODE = 27;
        event = {
          keyCode: ESCAPE_KEY_CODE,
          stopPropagation: jasmine.createSpy('stopPropagation'),
        };
        element = $('<div></div>');
      });

      it('calls stopPropagation for passed event', function () {
        viewModel.onKeyup(element, event);
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('unsets focus for element', function (done) {
        const blur = function () {
          done();
          element.off('blur', blur);
        };
        element.on('blur', blur);
        viewModel.onKeyup(element, event);
      });
    });
  });

  describe('trigger_upload() method', function () {
    let uploadFilesDfd;
    let createModelDfd;
    let el;

    beforeEach(function () {
      el = jasmine.createSpyObj(['data', 'trigger']);
      uploadFilesDfd = $.Deferred();
      spyOn(pickerUtils, 'uploadFiles').and.returnValue(uploadFilesDfd);
    });

    it('sets "isUploading" flag to true', function () {
      viewModel.attr('isUploading', false);

      viewModel.trigger_upload(viewModel, el);

      expect(viewModel.attr('isUploading')).toBe(true);
    });

    describe('sets "isUploading" flag to false', function () {
      beforeEach(function () {
        createModelDfd = $.Deferred();
        viewModel.attr('isUploading', true);
        spyOn(viewModel, 'createDocumentModel').and.returnValue(createModelDfd);
      });

      it('when uploadFiles() was failed', function (done) {
        uploadFilesDfd.reject();

        viewModel.trigger_upload(viewModel, el).fail(() => {
          expect(viewModel.attr('isUploading')).toBe(false);
          done();
        });
      });

      it('after createDocumentModel() success', function (done) {
        uploadFilesDfd.resolve();
        createModelDfd.resolve([]);

        viewModel.trigger_upload(viewModel, el).then(() => {
          expect(viewModel.attr('isUploading')).toBe(false);
          done();
        });
      });

      it('when createDocumentModel() was failed', function (done) {
        uploadFilesDfd.resolve();
        createModelDfd.reject();

        viewModel.trigger_upload(viewModel, el).fail(() => {
          expect(viewModel.attr('isUploading')).toBe(false);
          done();
        });
      });
    });
  });

  describe('trigger_upload_parent() method', function () {
    let uploadFilesDfd;
    let parentFolderDfd;
    let el;
    let parentFolderStub;

    beforeEach(function () {
      el = jasmine.createSpyObj(['data', 'trigger']);
      parentFolderStub = {id: 'id'};
      parentFolderDfd = $.Deferred();
      uploadFilesDfd = $.Deferred();

      spyOn(pickerUtils, 'findGDriveItemById').and.returnValue(parentFolderDfd);
      spyOn(pickerUtils, 'uploadFiles').and.returnValue(uploadFilesDfd);
    });

    it('sets "isUploading" flag to true', function (done) {
      parentFolderDfd.resolve(parentFolderStub);
      viewModel.attr('isUploading', false);

      viewModel.trigger_upload_parent(viewModel, el).then(() => {
        expect(viewModel.attr('isUploading')).toBe(true);
        done();
      });
    });

    describe('sets "isUploading" flag to false', function () {
      beforeEach(function () {
        viewModel.attr('isUploading', true);
      });

      it('after uploadFiles() success', function (done) {
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue($.Deferred().resolve());
        parentFolderDfd.resolve(parentFolderStub);
        uploadFilesDfd.resolve();

        viewModel.trigger_upload_parent(viewModel, el);

        expect(viewModel.attr('isUploading')).toBe(false);
      });

      it('when uploadFiles() was failed', function (done) {
        parentFolderDfd.resolve(parentFolderStub);
        uploadFilesDfd.reject();

        viewModel.trigger_upload_parent(viewModel, el);

        expect(viewModel.attr('isUploading')).toBe(false);
      });
    });
  });
});
