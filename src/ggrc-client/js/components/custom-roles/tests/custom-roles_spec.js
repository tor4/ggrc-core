/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ViewModel from '../custom-roles-vm';

describe('custom-roles view model', () => {
  let vm;

  beforeEach(() => {
    vm = new ViewModel();
  });

  describe('isReadonly prop', () => {
    it('returns false if there is no instance', () => {
      let falseInstances = [null, undefined, '', 0, false, NaN];

      falseInstances.forEach((instance) => {
        vm.attr('instance', instance);
        expect(vm.attr('isReadonly')).toBe(false);
      });
    });

    it('returns value of instance.class.isProposable if instance is defined ' +
      'and readonly is FALSE',
    () => {
      vm.attr('readOnly', false);
      let instance = {
        'class': {
          isProposable: true,
        },
        readonly: false,
      };
      vm.attr('instance', instance);

      expect(vm.attr('isReadonly')).toBe(true);

      vm.attr('instance.class.isProposable', false);
      expect(vm.attr('isReadonly')).toBe(false);
    });

    it('returns value of readOnly prop if instance is defined ' +
      'and instance.class.isProposable is FALSE',
    () => {
      let instance = {
        'class': {
          isProposable: false,
        },
        readonly: false,
      };
      vm.attr('instance', instance);

      vm.attr('readOnly', false);
      expect(vm.attr('isReadonly')).toBe(false);

      vm.attr('readOnly', true);
      expect(vm.attr('isReadonly')).toBe(true);
    });

    it('returns value of instance readonly prop if ' +
      'component readOnly is FALSE and instance.class.isProposable is FALSE',
    () => {
      vm.attr('readOnly', );
      let instance = {
        'class': {
          isProposable: false,
        },
        readonly: true,
      };
      vm.attr('instance', instance);

      expect(vm.attr('isReadonly')).toBe(true);

      vm.attr('instance.readonly', false);
      expect(vm.attr('isReadonly')).toBe(false);
    });
  });

  describe('filterACL() method', () => {
    let acl;

    beforeEach(() => {
      vm.attr('instance', {});
    });

    it('replaces access_control_list of instance ' +
    'excluding elements without id', () => {
      acl = [{id: 123}, {}, {id: 321}];

      vm.attr('instance.access_control_list', acl);
      vm.filterACL();

      expect(vm.attr('instance.access_control_list').serialize())
        .toEqual(acl.filter((role) => role.id));
    });
  });

  describe('save() method', () => {
    let args;
    let saveDfd;

    beforeEach(() => {
      args = {};
      saveDfd = new $.Deferred();
      vm.attr('instance', {
        save: jasmine.createSpy().and.returnValue(saveDfd),
      });
      spyOn(vm.attr('instance'), 'dispatch');
    });

    it('sets groupId of args to updatableGroupId attribute', () => {
      vm.attr('updatableGroupId', null);
      args.groupId = 123;
      vm.save(args);
      expect(vm.attr('updatableGroupId')).toBe(args.groupId);
    });

    describe('after getting response', () => {
      beforeEach(() => {
        saveDfd.resolve();
        spyOn(vm, 'filterACL');
      });

      it('calls filterACL', (done) => {
        vm.save(args).then(() => {
          expect(vm.filterACL).toHaveBeenCalled();
          done();
        });
      });

      it('sets null to updatableGroupId attribute', (done) => {
        vm.save(args).then(() => {
          expect(vm.attr('updatableGroupId')).toBe(null);
          done();
        });
      });
    });
  });
});
