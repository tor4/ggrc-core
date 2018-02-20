/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import tracker from '../../../../tracker';
import DeferredTransaction from '../../../../plugins/utils/deferred-transaction-utils';

describe('GGRC.Components.assessmentInfoPane', function () {
  let vm;
  let instanceSave;

  beforeEach(function () {
    instanceSave = can.Deferred();
    vm = GGRC.Components.getViewModel('assessmentInfoPane');
    vm.attr('instance', {
      save: () => instanceSave,
    });
  });

  describe('editMode attribute', function () {
    const editableStatuses = ['Not Started', 'In Progress', 'Rework Needed'];
    const nonEditableStates = ['In Review', 'Completed', 'Deprecated'];
    const allStatuses = editableStatuses.concat(nonEditableStates);

    describe('get() method', function () {
      it('returns false if instance is archived', function () {
        vm.attr('instance.archived', true);

        allStatuses.forEach((status) => {
          vm.attr('instance.status', status);
          expect(vm.attr('editMode')).toBe(false);
        });
      });

      describe('if instance is not archived', function () {
        it('returns true if instance status is editable otherwise false',
        function () {
          allStatuses.forEach((status) => {
            vm.attr('instance.status', status);
            expect(vm.attr('editMode'))
              .toBe(editableStatuses.includes(status));
          });
        });
      });
    });
  });

  describe('onStateChange() method', () => {
    let method;
    beforeEach(() => {
      method = vm.onStateChange.bind(vm);
      spyOn(tracker, 'start').and.returnValue(() => {});
      spyOn(vm, 'initializeFormFields').and.returnValue(() => {});

      vm.attr('deferredSave', new DeferredTransaction(
        (resolve, reject) => {
          vm.attr('instance').save().done(resolve).fail(reject);
        }, 0, true));
    });

    it('sets status', (done) => {
      vm.attr('instance.previousStatus', 'FooBar');
      instanceSave.resolve();

      method({
        state: 'newStatus',
      }).then(() => {
        expect(vm.attr('instance.status')).toBe('newStatus');
        done();
      });
    });

    it('returns status back on undo action', (done) => {
      vm.attr('instance.previousStatus', 'FooBar');
      instanceSave.resolve();

      method({
        undo: true,
        state: 'newStatus',
      }).then(() => {
        expect(vm.attr('instance.status')).toBe('FooBar');
        done();
      });
    });

    it('resets status after conflict', (done) => {
      vm.attr('instance.status', 'Baz');
      instanceSave.reject({}, {
        status: 409,
        remoteObject: {
          status: 'Foo',
        },
      });

      method({
        state: 'Bar',
      }).fail(() => {
        expect(vm.attr('instance.status')).toBe('Foo');
        done();
      });
    });
  });
});
