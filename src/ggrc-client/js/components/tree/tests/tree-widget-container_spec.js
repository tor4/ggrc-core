/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import * as ObjectVersions from '../../../plugins/utils/object-versions-utils';
import tracker from '../../../tracker';

describe('GGRC.Components.treeWidgetContainer', function () {
  'use strict';

  let vm;
  let Component;

  beforeEach(function () {
    Component = GGRC.Components.get('treeWidgetContainer');
    vm = GGRC.Components.getViewModel('treeWidgetContainer');
  });

  describe('optionsData get() method', function () {
    let shortModelName = 'ModelName';

    beforeEach(function () {
      vm.attr('model', {
        shortName: shortModelName,
      });
    });

    describe('if options.objectVersion has a false value', function () {
      beforeEach(function () {
        vm.removeAttr('options.objectVersion', null);
      });

      it('returns appopriate object', function () {
        let modelName = shortModelName;
        let expectedResult = {
          name: modelName,
          loadItemsModelName: modelName,
          widgetId: modelName,
          countsName: modelName,
        };

        expect(vm.attr('optionsData')).toEqual(expectedResult);
      });
    });

    describe('returns widget config which', function () {
      beforeEach(function () {
        vm.attr('options.objectVersion', {
          data: 'Data',
        });
      });

      it('returns result of ObjectVersions.getWidgetConfig with ' +
      'passed params', function () {
        let expectedResult = {};
        let getWidgetConfig = spyOn(ObjectVersions, 'getWidgetConfig')
          .and.returnValue(expectedResult);
        let result = vm.attr('optionsData');

        expect(result).toBe(expectedResult);
        expect(getWidgetConfig).toHaveBeenCalledWith(shortModelName, true);
      });
    });
  });

  describe('display() method', function () {
    let display;
    let dfd;

    beforeEach(function () {
      dfd = new $.Deferred();

      display = vm.display.bind(vm);
      spyOn(vm, 'loadItems').and.returnValue(dfd);
      vm.attr('loaded', null);
      vm.attr('refreshLoaded', true);
    });

    it('sets loaded field if it does not exist', function () {
      display();
      expect(vm.attr('loaded')).not.toBeNull();
    });

    it('sets loaded field if needToRefresh param is true', function () {
      vm.attr('loaded', dfd);
      display(true);
      expect(vm.attr('loaded')).not.toBeNull();
    });

    it('sets refreshLoaded flag in false after resolve loaded field',
    function () {
      display(true);
      dfd.resolve();
      expect(vm.attr('refreshLoaded')).toBe(false);
    });

    it('returns value of loaded field', function () {
      let result;
      vm.attr('loaded', dfd);
      result = display();
      expect(result).toBe(dfd);
    });
  });

  describe('onSort() method', function () {
    let onSort;

    beforeEach(function () {
      onSort = vm.onSort.bind(vm);
      vm.attr('pageInfo.count', 3);

      spyOn(vm, 'loadItems');
      spyOn(vm, 'closeInfoPane');
    });

    it('sets current order properties', function () {
      onSort({
        field: 'col1',
        sortDirection: 'asc',
      });

      expect(vm.attr('sortingInfo.sortBy')).toEqual('col1');
      expect(vm.attr('sortingInfo.sortDirection')).toEqual('asc');
      expect(vm.attr('pageInfo.current')).toEqual(1);
      expect(vm.loadItems).toHaveBeenCalled();
      expect(vm.closeInfoPane).toHaveBeenCalled();
    });
  });

  describe('loadItems() method', function () {
    let loadItems;

    beforeEach(function () {
      vm.attr({
        model: {shortName: 'modelName'},
        options: {
          parent_instance: {},
        },
      });
      loadItems = vm.loadItems.bind(vm);
      spyOn(tracker, 'start').and.returnValue(() => {});
    });

    it('', function (done) {
      spyOn(TreeViewUtils, 'loadFirstTierItems')
        .and.returnValue(can.Deferred().resolve({
          total: 100,
          values: [],
        }));

      loadItems().then(function () {
        expect(vm.attr('pageInfo.total')).toEqual(100);
        expect(can.makeArray(vm.attr('showedItems'))).toEqual([]);
        done();
      });
    });
  });

  describe('setRefreshFlag() method', function () {
    let setRefreshFlag;

    beforeEach(function () {
      setRefreshFlag = vm.setRefreshFlag.bind(vm);
      vm.attr('refreshLoaded', null);
    });

    it('sets refreshLoaded state in true if refresh param is true',
    function () {
      setRefreshFlag(true);
      expect(vm.attr('refreshLoaded')).toBe(true);
    });

    it('sets refreshLoaded state in false if refresh param is false',
    function () {
      setRefreshFlag(false);
      expect(vm.attr('refreshLoaded')).toBe(false);
    });
  });

  describe('needToRefresh() method', function () {
    let needToRefresh;
    let setRefreshFlag;

    beforeEach(function () {
      needToRefresh = vm.needToRefresh.bind(vm);
      setRefreshFlag = vm.setRefreshFlag.bind(vm);
      vm.attr('refreshLoaded', null);
    });

    it('returns true if refreshLoaded field is true',
    function () {
      let result;
      setRefreshFlag(true);
      result = needToRefresh();

      expect(result).toBe(true);
    });

    it('returns false if refreshLoaded field is false',
    function () {
      let result;
      setRefreshFlag(false);
      result = needToRefresh();

      expect(result).toBe(false);
    });
  });

  describe('on widget appearing', function () {
    let _widgetShown;

    beforeEach(function () {
      _widgetShown = vm._widgetShown.bind(vm);
      spyOn(vm, '_triggerListeners');
      spyOn(vm, 'loadItems');
    });

    describe('for any viewModel except Issue', function () {
      beforeEach(function () {
        let modelName = 'Model';
        spyOn(CurrentPageUtils, 'getCounts').and.returnValue(
          _.set({}, modelName, 123)
        );
        vm.attr({
          model: {
            shortName: modelName,
          },
          modelName: modelName,
          loaded: {},
          pageInfo: {
            total: 123,
          },
        });
      });

      it('should only add listeners', function () {
        _widgetShown();
        expect(vm._triggerListeners).toHaveBeenCalled();
        expect(vm.loadItems).not.toHaveBeenCalled();
      });
    });

    describe('for Issue viewModel that wasn\'t loaded before', function () {
      let modelName = 'Issue';

      beforeEach(function () {
        vm.attr({
          model: {
            shortName: modelName,
          },
          modelName: modelName,
        });
        vm.attr('loaded', null);
        vm.attr('pageInfo', {
          total: 123,
        });
        spyOn(CurrentPageUtils, 'getCounts').and.returnValue(
          _.set({}, modelName, 123)
        );
      });

      it('should only add listeners', function () {
        _widgetShown();
        expect(vm._triggerListeners).toHaveBeenCalled();
        expect(vm.loadItems).not.toHaveBeenCalled();
      });
    });

    describe('for Issue viewModel that was loaded before' +
      'in case of equality between counts on tab ' +
      'and total counts in viewModel',
      function () {
        let modelName = 'Issue';

        beforeEach(function () {
          vm.attr({
            model: {
              shortName: modelName,
            },
            modelName: modelName,
          });
          vm.attr('loaded', {});
          vm.attr('pageInfo', {
            total: 123,
          });
          spyOn(CurrentPageUtils, 'getCounts').and.returnValue(
            _.set({}, modelName, 123)
          );
        });

        it('should only add listeners', function () {
          _widgetShown();
          expect(vm._triggerListeners).toHaveBeenCalled();
          expect(vm.loadItems).not.toHaveBeenCalled();
        });
      }
    );

    describe('for Issue viewModel that was loaded before' +
      'in case of inequality between counts on tab ' +
      'and total counts in viewModel',
      function () {
        let modelName = 'Issue';

        beforeEach(function () {
          vm.attr({
            model: {
              shortName: modelName,
            },
            modelName: modelName,
          });
          vm.attr('loaded', {});
          vm.attr('pageInfo', {
            total: 123,
          });
          spyOn(CurrentPageUtils, 'getCounts').and.returnValue(
            _.set({}, modelName, 124)
          );
        });

        it('should add listeners and update viewModel', function () {
          _widgetShown();
          expect(vm._triggerListeners).toHaveBeenCalled();
          expect(vm.loadItems).toHaveBeenCalled();
        });
      }
    );
  });

  describe('openAdvancedFilter() method', function () {
    it('copies applied filter and mapping items', function () {
      let appliedFilterItems = new can.List([
        AdvancedSearch.create.attribute(),
      ]);
      let appliedMappingItems = new can.List([
        AdvancedSearch.create.mappingCriteria({
          filter: AdvancedSearch.create.attribute(),
        }),
      ]);
      vm.attr('advancedSearch.appliedFilterItems', appliedFilterItems);
      vm.attr('advancedSearch.appliedMappingItems', appliedMappingItems);
      vm.attr('advancedSearch.filterItems', can.List());
      vm.attr('advancedSearch.mappingItems', can.List());

      vm.openAdvancedFilter();

      expect(vm.attr('advancedSearch.filterItems').attr())
        .toEqual(appliedFilterItems.attr());
      expect(vm.attr('advancedSearch.mappingItems').attr())
        .toEqual(appliedMappingItems.attr());
    });

    it('opens modal window', function () {
      vm.attr('advancedSearch.open', false);

      vm.openAdvancedFilter();

      expect(vm.attr('advancedSearch.open')).toBe(true);
    });
  });

  describe('applyAdvancedFilters() method', function () {
    let filterItems = new can.List([
      AdvancedSearch.create.attribute(),
    ]);
    let mappingItems = new can.List([
      AdvancedSearch.create.mappingCriteria({
        filter: AdvancedSearch.create.attribute(),
      }),
    ]);
    beforeEach(function () {
      vm.attr('advancedSearch.filterItems', filterItems);
      vm.attr('advancedSearch.mappingItems', mappingItems);
      vm.attr('advancedSearch.appliedFilterItems', can.List());
      vm.attr('advancedSearch.appliedMappingItems', can.List());
      spyOn(vm, 'onFilter');
      spyOn(AdvancedSearch, 'buildFilter')
        .and.callFake(function (items, request) {
          request.push({name: 'item'});
        });
    });

    it('copies filter and mapping items to applied', function () {
      vm.applyAdvancedFilters();

      expect(vm.attr('advancedSearch.appliedFilterItems').attr())
        .toEqual(filterItems.attr());
      expect(vm.attr('advancedSearch.appliedMappingItems').attr())
        .toEqual(mappingItems.attr());
    });

    it('initializes advancedSearch.filter property', function () {
      spyOn(GGRC.query_parser, 'join_queries').and.returnValue({
        name: 'test',
      });
      vm.attr('advancedSearch.filter', null);

      vm.applyAdvancedFilters();

      expect(vm.attr('advancedSearch.filter.name')).toBe('test');
    });

    it('initializes advancedSearch.request property', function () {
      vm.attr('advancedSearch.request', can.List());
      spyOn(GGRC.query_parser, 'join_queries');

      vm.applyAdvancedFilters();

      expect(vm.attr('advancedSearch.request.length')).toBe(2);
    });

    it('closes modal window', function () {
      vm.attr('advancedSearch.open', true);

      vm.applyAdvancedFilters();

      expect(vm.attr('advancedSearch.open')).toBe(false);
    });

    it('calls onFilter() method', function () {
      vm.applyAdvancedFilters();

      expect(vm.onFilter).toHaveBeenCalled();
    });
  });

  describe('removeAdvancedFilters() method', function () {
    beforeEach(function () {
      spyOn(vm, 'onFilter');
    });

    it('removes applied filter and mapping items', function () {
      vm.attr('advancedSearch.appliedFilterItems', new can.List([
        {title: 'item'},
      ]));
      vm.attr('advancedSearch.appliedMappingItems', new can.List([
        {title: 'item'},
      ]));

      vm.removeAdvancedFilters();

      expect(vm.attr('advancedSearch.appliedFilterItems.length')).toBe(0);
      expect(vm.attr('advancedSearch.appliedMappingItems.length')).toBe(0);
    });

    it('cleans advancedSearch.filter property', function () {
      vm.attr('advancedSearch.filter', {});

      vm.removeAdvancedFilters();

      expect(vm.attr('advancedSearch.filter')).toBe(null);
    });

    it('closes modal window', function () {
      vm.attr('advancedSearch.open', true);

      vm.removeAdvancedFilters();

      expect(vm.attr('advancedSearch.open')).toBe(false);
    });

    it('calls onFilter() method', function () {
      vm.removeAdvancedFilters();

      expect(vm.onFilter).toHaveBeenCalled();
    });

    it('resets advancedSearch.request list', function () {
      vm.attr('advancedSearch.request', new can.List([{data: 'test'}]));

      vm.removeAdvancedFilters();

      expect(vm.attr('advancedSearch.request.length')).toBe(0);
    });
  });

  describe('resetAdvancedFilters() method', function () {
    it('resets filter items', function () {
      vm.attr('advancedSearch.filterItems', new can.List([
        {title: 'item'},
      ]));

      vm.resetAdvancedFilters();

      expect(vm.attr('advancedSearch.filterItems.length')).toBe(0);
    });

    it('resets mapping items', function () {
      vm.attr('advancedSearch.mappingItems', new can.List([
        {title: 'item'},
      ]));

      vm.resetAdvancedFilters();

      expect(vm.attr('advancedSearch.mappingItems.length')).toBe(0);
    });
  });

  describe('getAbsoluteItemNumber() method', function () {
    beforeEach(function () {
      vm.attr({
        pageInfo: {
          pageSize: 10,
          count: 5,
        },
        showedItems: [{id: 1, type: 'object'},
          {id: 2, type: 'object'},
          {id: 3, type: 'object'}],
      });
      vm.attr('pageInfo.current', 3);
    });

    it('should return correct item number when item is on page',
      function () {
        let result;

        result = vm.getAbsoluteItemNumber({id: 2, type: 'object'});

        expect(result).toEqual(21);
      });

    it('should return "-1" when item is not on page',
       function () {
         let result;

         result = vm.getAbsoluteItemNumber({id: 4, type: 'object'});

         expect(result).toEqual(-1);
       });
    it('should return "-1" when item is of different type',
      function () {
        let result;

        result = vm.getAbsoluteItemNumber({id: 3, type: 'snapshot'});

        expect(result).toEqual(-1);
      });
    it('should return correct item number for first item on non first page',
       function () {
         let result;

         result = vm.getAbsoluteItemNumber({id: 1, type: 'object'});

         expect(result).toEqual(20);
       });
  });

  describe('getRelativeItemNumber() method', function () {
    it('should return correct item number on page', function () {
      let result = vm.getRelativeItemNumber(12, 5);

      expect(result).toEqual(2);
    });
  });

  describe('getNextItemPage() method', function () {
    beforeEach(function () {
      spyOn(vm, 'loadItems');
    });

    it('should load items for appropriate page when item is not loaded',
      function () {
        vm.getNextItemPage(10, {current: 2, pageSize: 5});

        expect(vm.attr('loading')).toBeTruthy();
        expect(vm.loadItems).toHaveBeenCalled();
      });

    it('shouldn\'t load items when current item was already loaded',
      function () {
        vm.getNextItemPage(10, {current: 3, pageSize: 5});

        expect(vm.attr('loading')).toBeFalsy();
        expect(vm.loadItems).not.toHaveBeenCalled();
      });
  });

  describe('setSortingConfiguration() method', () => {
    beforeEach(() => {
      vm.attr('model', {
        shortName: 'shortModelName',
      });
    });

    it('sets up default sorting configuration', () => {
      vm.attr('sortingInfo', {});
      spyOn(TreeViewUtils, 'getSortingForModel')
        .and.returnValue({
          key: 'key',
          direction: 'direction',
        });

      vm.setSortingConfiguration();

      expect(vm.attr('sortingInfo.sortBy')).toEqual('key');
      expect(vm.attr('sortingInfo.sortDirection')).toEqual('direction');
    });
  });

  describe('init() method', () => {
    let method;

    beforeEach(() => {
      vm.attr('model', {
        shortName: 'shortModelName',
      });
      method = Component.prototype.init.bind({viewModel: vm});
      spyOn(vm, 'setSortingConfiguration');
      spyOn(vm, 'setColumnsConfiguration');
      spyOn(CMS.Models.DisplayPrefs, 'getSingleton')
        .and.returnValue(can.Deferred().resolve());
    });

    it('sets up columns configuration', () => {
      method();
      expect(vm.setColumnsConfiguration).toHaveBeenCalled();
    });

    it('sets up sorting configuration', () => {
      method();
      expect(vm.setSortingConfiguration).toHaveBeenCalled();
    });
  });

  describe('getDepthFilter() method', function () {
    it('returns an empty string if depth is not set for filter', function () {
      let result;
      spyOn(vm, 'attr')
        .and.returnValue([{
          filter: '"task assignees" = "user@example.com"',
          operation: 'AND',
          name: 'custom',
        }, {
          filter: '"state" = "Assigned"',
          operation: 'AND',
          name: 'custom',
        }]);

      result = vm.getDepthFilter();

      expect(result).toBe('');
    });

    it('returns filter that applied for depth', function () {
      let result;
      spyOn(vm, 'attr')
        .and.returnValue([{
          filter: '"task assignees" = "user@example.com"',
          operation: 'AND',
          name: 'custom',
          depth: true,
          filterDeepLimit: 2,
        }, {
          filter: '"state" = "Assigned"',
          operation: 'AND',
          name: 'custom',
          depth: true,
          filterDeepLimit: 1,
        }]);

      result = vm.getDepthFilter(1);

      expect(result).toBe('"task assignees" = "user@example.com"');
    });
  });
});
