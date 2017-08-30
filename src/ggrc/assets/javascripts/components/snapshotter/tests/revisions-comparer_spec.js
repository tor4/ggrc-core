/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('GGRC.Components.revisionsComparer', function () {
  'use strict';

  var Component;  // the component under test

  beforeAll(function () {
    Component = GGRC.Components.get('RevisionsComparer');
  });

  describe('prepareInstances() method', function () {
    var fakeData;
    var method;  // the method under test

    beforeEach(function () {
      method = Component.prototype.scope.prepareInstances;
      fakeData = [
        {
          id: 1,
          content: new can.Map({id: 1}),
          resource_type: 'Control'
        }, {
          id: 2,
          content: new can.Map({id: 1}),
          resource_type: 'Control'
        }
      ];
    });

    it('returns instances of necessary type and with isRevision', function () {
      var result = method(fakeData);
      result.forEach(function (item) {
        expect(item.instance instanceof CMS.Models.Control).toBeTruthy();
        expect(item.instance.type).toBe('Control');
        expect(item.instance.isRevision).toBe(true);
      });
    });

    it('returns the same length of instances as passed', function () {
      var result = method(fakeData);
      expect(result.length).toBe(fakeData.length);
    });

    it('returns the same data as passed with extra properties', function () {
      var result = method(fakeData);
      var data = fakeData;
      result.forEach(function (item, index) {
        expect(item.instance.id).toEqual(data[index].content.id);
      });
    });

    it('adds person stubs to access control list items', function () {
      var result;

      fakeData.forEach(function (item, i) {
        var acl = new can.List([
          {ac_role_id: i * 10, person_id: i * 10},
          {ac_role_id: i * 10, person_id: i * 10}
        ]);
        item.content.attr('access_control_list', acl);
      });

      result = method(fakeData);

      function checkAclItem(item) {
        expect(item.person).toBeDefined();
        expect(item.person.type).toEqual('Person');
        expect(item.person.id).toEqual(item.person_id);
      }

      result.forEach(function (item) {
        item.instance.access_control_list.forEach(checkAclItem);
      });
    });
  });

  describe('getInfopanes() method', function () {
    var fakeHTML;
    var method;  // the method under test

    beforeEach(function () {
      method = Component.prototype.scope.getInfopanes;
      fakeHTML = $('<div>' +
                      '<div class="info">' +
                        '<div class="tier-content"></div>' +
                      '</div>' +
                      '<div class="info">' +
                        '<div class="tier-content"></div>' +
                      '</div>' +
                    '</div>');
    });

    it('returns all info panes under the given element', function () {
      var result = method(fakeHTML);
      expect(result.length).toBe(2);
    });
  });

  describe('getCAPanes() method', function () {
    var fakeHTML;
    var method;  // the method under test

    beforeEach(function () {
      method = Component.prototype.scope.getCAPanes;
      fakeHTML = $('<div>' +
                      '<div class="info">' +
                        '<custom-attributes-wrap></custom-attributes-wrap>' +
                      '</div>' +
                      '<div class="info">' +
                        '<custom-attributes-wrap></custom-attributes-wrap>' +
                      '</div>' +
                    '</div>');
    });

    it('returns all panes with custom attributes', function () {
      var result = method(fakeHTML);
      expect(result.length).toBe(2);
    });
  });

  describe('getAttachmentsDfds() method', function () {
    var method;
    var revisions;

    beforeEach(function () {
      var prepareInstancesMethod = Component.prototype.scope.prepareInstances;
      var fakeData = [
        {
          id: 1,
          content: new can.Map({id: 1}),
          resource_type: 'Control'
        }, {
          id: 2,
          content: new can.Map({id: 1}),
          resource_type: 'Control'
        }
      ];

      method = Component.prototype.scope.getAttachmentsDfds
        .bind(Component.prototype.scope);
      revisions = new can.List(prepareInstancesMethod(fakeData));
    });

    it('getAttachmentsDfds() should return 1 dfd', function () {
      var dfds;
      revisions[0].attr('instance').folder = 'EWheNKvwjhrcwWer';
      dfds = method(revisions);
      expect(dfds.length).toEqual(1);
    });

    it('getAttachmentsDfds() should return 2 dfds', function () {
      var dfds;
      revisions[0].attr('instance').folder = 'EWheNKvwjhrcwWer';
      revisions[1].attr('instance').folder = 'vewbetWhercwWer';
      dfds = method(revisions);
      expect(dfds.length).toEqual(2);
    });

    it('getAttachmentsDfds() should return empty array', function () {
      var dfds = method();
      expect(dfds.length).toEqual(0);
    });
  });

  describe('getRevisions() method', function () {
    var method;
    var Revision;

    beforeEach(function () {
      method = Component.prototype.scope.getRevisions;
      Revision = CMS.Models.Revision;
    });

    it('when cache is empty doing ajax call for all revisions',
      function (done) {
        spyOn(Revision, 'findInCacheById').and.returnValue(undefined);

        spyOn(Revision, 'findAll').and.returnValue(
          can.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          can.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).toHaveBeenCalledWith({
            id__in: '42,11'
          });

          expect(Revision.findOne).not.toHaveBeenCalled();

          done();
        });
      });

    it('when in cache only one object doing findOne call',
      function (done) {
        spyOn(Revision, 'findInCacheById').and
          .returnValues({id: 42}, undefined);

        spyOn(Revision, 'findAll').and.returnValue(
          can.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          can.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).not.toHaveBeenCalled();

          expect(Revision.findOne).toHaveBeenCalledWith({id: 11});

          done();
        });
      });

    it('when cache contains all objects are not doing ajax call',
      function (done) {
        spyOn(Revision, 'findInCacheById').and.returnValues({id: 42}, {id: 11});

        spyOn(Revision, 'findAll').and.returnValue(
          can.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          can.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).not.toHaveBeenCalled();

          expect(Revision.findOne).not.toHaveBeenCalled();

          done();
        });
      });
  });
});
