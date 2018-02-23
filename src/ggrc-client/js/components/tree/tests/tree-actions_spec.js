/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../tree-actions';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';

describe('tree-actions component', () => {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
  });

  describe('addItem get() method', () => {
    describe('if there is options.objectVersion', () => {
      beforeEach(function () {
        vm.attr('options', {objectVersion: {data: 1}});
      });

      it('returns false', () => {
        expect(vm.attr('addItem')).toBe(false);
      });
    });

    describe('if there is no options.objectVersion', () => {
      beforeEach(function () {
        vm.attr('options', {objectVersion: null});
      });

      it('returns options.add_item_view if it exists', () => {
        let expectedData = new can.Map({});
        vm.attr('options.add_item_view', expectedData);
        expect(vm.attr('addItem')).toBe(expectedData);
      });

      it('returns model.tree_view_options.add_item_view by default',
        () => {
          let expectedData = new can.Map({});
          vm.attr('options.add_item_view', null);
          vm.attr('model', {
            tree_view_options: {
              add_item_view: expectedData,
            },
          });
          expect(vm.attr('addItem')).toBe(expectedData);
        });
    });
  });

  describe('isSnapshot get() method', () => {
    let isSnapshotScope;
    let isSnapshotModel;

    beforeEach(() => {
      isSnapshotScope = spyOn(SnapshotUtils, 'isSnapshotScope');
      isSnapshotModel = spyOn(SnapshotUtils, 'isSnapshotModel');
    });

    describe('if parentInstance is a snapshot scope and ' +
    'model.model_singular is a snapshot model', () => {
      beforeEach(() => {
        vm.attr('parentInstance', {data: 'Data'});
        vm.attr('model', {model_singular: 'modelSingular'});

        isSnapshotScope.and.returnValue({data: '1'});
        isSnapshotModel.and.returnValue({data: '2'});
      });

      it('returns true value', () => {
        expect(vm.attr('isSnapshots')).toBeTruthy();
        expect(isSnapshotScope).toHaveBeenCalledWith(
          vm.attr('parentInstance')
        );
        expect(isSnapshotModel).toHaveBeenCalledWith(
          vm.attr('model.model_singular')
        );
      });
    });

    it('returns options.objectVersion by default', () => {
      vm.attr('options', {objectVersion: {data: 'Data'}});
      expect(vm.attr('isSnapshots')).toBeTruthy();
    });

    describe('if parentInstance is not a snapshot scope or ' +
    'model.model_singular is not a snapshot model', () => {
      beforeEach(() => {
        isSnapshotScope.and.returnValue(null);
        isSnapshotModel.and.returnValue(null);
      });

      it('returns true value if there is options.objectVersion', () => {
        vm.attr('options', {objectVersion: {data: 'Data'}});
        expect(vm.attr('isSnapshots')).toBeTruthy();
      });

      it('returns false value if there is no options.objectVersion',
        () => {
          vm.attr('options', {objectVersion: null});
          expect(vm.attr('isSnapshots')).toBeFalsy();
        });
    });
  });
});
