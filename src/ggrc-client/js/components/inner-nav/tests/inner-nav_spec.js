/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */
import Component from '../inner-nav';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec_helpers';
import router, * as RouterUtils from '../../../router';
import * as ObjectVersionsUtils
  from '../../../plugins/utils/object-versions-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as WidgetsUtils from '../../../plugins/utils/widgets-utils';
import * as DashboardUtils from '../../../plugins/utils/dashboards-utils';
import Cacheable from '../../../models/cacheable';

describe('inner-nav component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('init() method', () => {
    let init;
    beforeEach(() => {
      init = Component.prototype.init.bind({
        viewModel,
      });
    });

    it('should call handleDescriptors()', () => {
      spyOn(viewModel, 'handleDescriptors');
      init();

      expect(viewModel.handleDescriptors).toHaveBeenCalled();
    });

    it('should call setTabsPriority()', () => {
      spyOn(viewModel, 'setTabsPriority');
      init();

      expect(viewModel.setTabsPriority).toHaveBeenCalled();
    });
  });

  describe('viewModel', () => {
    describe('showTabs prop', () => {
      it('returns TRUE when on Admin page', () => {
        spyOn(CurrentPageUtils, 'isAdmin').and.returnValue(true);
        spyOn(WidgetsUtils, 'getCounts').and.returnValue(new can.Map());

        expect(viewModel.attr('showTabs')).toBe(true);
      });

      it('returns FALSE when counts is empty and not Admin page', () => {
        spyOn(CurrentPageUtils, 'isAdmin').and.returnValue(false);
        spyOn(WidgetsUtils, 'getCounts').and.returnValue(new can.Map());

        expect(viewModel.attr('showTabs')).toBe(false);
      });

      it('returns TRUE when counts is not empty and not Admin page', () => {
        spyOn(CurrentPageUtils, 'isAdmin').and.returnValue(false);
        spyOn(WidgetsUtils, 'getCounts').and.returnValue(new can.Map({
          Assessment: 10,
        }));

        expect(viewModel.attr('showTabs')).toBe(true);
      });
    });

    describe('showAllTabs prop', () => {
      it('should return show_all_tabs value from instance model', () => {
        let instance = makeFakeInstance({model: Cacheable, staticProps: {
          obj_nav_options: {
            show_all_tabs: true,
          },
        }})();

        spyOn(CurrentPageUtils, 'getPageInstance').and.returnValue(instance);

        expect(viewModel.attr('showAllTabs')).toBe(true);
      });
    });

    describe('handleDescriptors() method', () => {
      it('should create widgets from descriptors', () => {
        spyOn(viewModel, 'createWidget').and.returnValue({});
        viewModel.attr('widgetList', null);

        let descriptors = [{}, {}, {}];
        viewModel.attr('widgetDescriptors', descriptors);

        viewModel.handleDescriptors();

        expect(viewModel.createWidget).toHaveBeenCalledTimes(3);
        expect(viewModel.attr('widgetList').length).toBe(3);
      });

      it('should sort widgets by order and title', () => {
        spyOn(viewModel, 'createWidget').and.callFake((descriptor) => {
          return {
            order: descriptor.order,
            title: descriptor.widget_name,
          };
        });

        let descriptors = [
          {order: 3, widget_name: 'b'},
          {order: 2, widget_name: 'a'},
          {order: 3, widget_name: 'a'},
          {order: 2, widget_name: 'b'},
        ];
        viewModel.attr('widgetDescriptors', descriptors);

        viewModel.handleDescriptors();

        let widgets = viewModel.attr('widgetList');

        expect(widgets[0].serialize())
          .toEqual(jasmine.objectContaining({order: 2, title: 'a'}));
        expect(widgets[1])
          .toEqual(jasmine.objectContaining({order: 2, title: 'b'}));
        expect(widgets[2])
          .toEqual(jasmine.objectContaining({order: 3, title: 'a'}));
        expect(widgets[3])
          .toEqual(jasmine.objectContaining({order: 3, title: 'b'}));
      });
    });

    describe('createWidget() method', () => {
      beforeEach(() => {
        let instance = makeFakeInstance({model: Cacheable, staticProps: {
          obj_nav_options: {
            force_show_list: ['force show widget title'],
          },
        }})();
        spyOn(CurrentPageUtils, 'getPageInstance').and.returnValue(instance);
      });

      it('should set id', () => {
        let result = viewModel.createWidget({widget_id: 'id', model: {}});
        expect(result.id).toBe('id');
      });

      it('should set title when widgetName is function in descriptor', () => {
        let result = viewModel.createWidget({
          widget_name: () => 'title',
          model: {},
        });
        expect(result.title).toBe('title');
      });

      it('should set title when widgetName is string in descriptor', () => {
        let result = viewModel.createWidget({
          widget_name: 'title',
          model: {},
        });
        expect(result.title).toBe('title');
      });

      it('should set empty type for not object version widgets', () => {
        spyOn(ObjectVersionsUtils, 'isObjectVersion').and.returnValue(false);
        let result = viewModel.createWidget({widget_id: 'id', model: {}});
        expect(result.type).toBe('');
      });

      it('shoult set version type for object versions widgets', () => {
        spyOn(ObjectVersionsUtils, 'isObjectVersion').and.returnValue(true);
        let result = viewModel.createWidget({widget_id: 'id', model: {}});
        expect(result.type).toBe('version');
      });

      it('should set icon', () => {
        let result = viewModel.createWidget({widget_icon: 'icon', model: {}});
        expect(result.icon).toBe('icon');
      });

      it('should set href', () => {
        spyOn(RouterUtils, 'buildUrl').and.returnValue('href');
        let result = viewModel.createWidget({widget_id: 'id', model: {}});
        expect(result.href).toBe('href');
      });

      it('should set model', () => {
        let result = viewModel.createWidget({model: 'model'});
        expect(result.model).toBe('model');
      });

      it('should set order', () => {
        let result = viewModel.createWidget({order: 'order', model: {}});
        expect(result.order).toBe('order');
      });

      it('should set uncountable', () => {
        let result = viewModel.createWidget({uncountable: true, model: {}});
        expect(result.uncountable).toBe(true);
      });

      it('should set forceRefetch', () => {
        let result = viewModel.createWidget({forceRefetch: true, model: {}});
        expect(result.forceRefetch).toBe(true);
      });

      it('should set default count', () => {
        let result = viewModel.createWidget({model: {}});
        expect(result.count).toBe(0);
      });

      it('should set counsName from descriptor if exists', () => {
        let result = viewModel.createWidget({countsName: 'name'});
        expect(result.countsName).toBe('name');
      });

      it('should set counsName from descriptor\'s content_controller_options '
      + 'if exists', () => {
        let result = viewModel.createWidget({
          content_controller_options: {
            countsName: 'name',
          },
        });
        expect(result.countsName).toBe('name');
      });

      it('should use model shortName as countsName if no other options', () => {
        let result = viewModel.createWidget({
          model: {
            shortName: 'name',
          },
        });
        expect(result.countsName).toBe('name');
      });

      it('should not set countsName if widget is uncountable', () => {
        let result = viewModel.createWidget({
          uncountable: true,
          model: {
            shortName: 'name',
          },
        });
        expect(result.countsName).toBe('');
      });

      it('should set default forceShow', () => {
        let result = viewModel.createWidget({model: {}});
        expect(result.forceShow).toBe(false);
      });

      it('should set inForceShowList TRUE '
        + 'if widget is in instance force show list', () => {
        let result = viewModel.createWidget({
          widget_name: 'force show widget title',
          model: {},
        });
        expect(result.inForceShowList).toBe(true);
      });

      it('should set inForceShowList FALSE '
        + 'if widget is not in instance force show list', () => {
        let result = viewModel.createWidget({
          widget_name: 'not in force show list widget title',
          model: {},
        });
        expect(result.inForceShowList).toBe(false);
      });
    });

    describe('setTabsPriority() method', () => {
      describe('for Audit object', () => {
        it('should set first 5 widgets as priority if dashboard is not enabled',
          () => {
            spyOn(CurrentPageUtils, 'getPageInstance')
              .and.returnValue(new can.Map({type: 'Audit'}));
            spyOn(DashboardUtils, 'isDashboardEnabled').and.returnValue(false);
            viewModel.attr('widgetList', [{id: 0}, {id: 1}, {id: 2},
              {id: 3}, {id: 4}, {id: 5}, {id: 6}]);

            viewModel.setTabsPriority();

            expect(viewModel.attr('priorityTabs').length).toBe(5);
            for (let i = 0; i < 5; i++) {
              expect(viewModel.attr('priorityTabs')[i].id).toBe(i);
            }

            expect(viewModel.attr('notPriorityTabs').length).toBe(2);
            for (let i = 0; i < 2; i++) {
              expect(viewModel.attr('notPriorityTabs')[i].id).toBe(i + 5);
            }
          });

        it('should set first 6 widgets as priority if dashboard is enabled',
          () => {
            spyOn(CurrentPageUtils, 'getPageInstance')
              .and.returnValue(new can.Map({type: 'Audit'}));
            spyOn(DashboardUtils, 'isDashboardEnabled').and.returnValue(true);
            viewModel.attr('widgetList', [{id: 0}, {id: 1}, {id: 2},
              {id: 3}, {id: 4}, {id: 5}, {id: 6}]);

            viewModel.setTabsPriority();

            expect(viewModel.attr('priorityTabs').length).toBe(6);
            for (let i = 0; i < 6; i++) {
              expect(viewModel.attr('priorityTabs')[i].id).toBe(i);
            }
            expect(viewModel.attr('notPriorityTabs').length).toBe(1);
            expect(viewModel.attr('notPriorityTabs')[0].id).toBe(6);
          });
      });

      describe('for all objects except Audit', () => {
        it('sets all available widgets as priority', () => {
          spyOn(CurrentPageUtils, 'getPageInstance')
            .and.returnValue(new can.Map({type: 'type'}));
          viewModel.attr('widgetList', [{}, {}, {}]);

          viewModel.setTabsPriority();

          expect(viewModel.attr('priorityTabs').length).toBe(3);
          expect(viewModel.attr('notPriorityTabs')).toBeNull();
        });
      });
    });

    describe('updateHiddenWidgets(widget) method', () => {
      let isInProhibitedMapSpy;

      beforeEach(() => {
        spyOn(viewModel, 'addToHiddenWidgets');
        spyOn(viewModel, 'removeFromHiddenWidgets');
        isInProhibitedMapSpy = spyOn(viewModel, 'isInProhibitedMap');
      });

      function showAllTabs(value) {
        let instance = makeFakeInstance({model: Cacheable, staticProps: {
          obj_nav_options: {
            show_all_tabs: value,
          },
        }})();
        spyOn(CurrentPageUtils, 'getPageInstance').and.returnValue(instance);
      }

      it('should do nothing if should be shown all widgets', () => {
        showAllTabs(true);

        viewModel.updateHiddenWidgets({});

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

      it('should do nothing if widget is in forceShowList', () => {
        showAllTabs(false);

        let widget = new can.Map({
          inForceShowList: true,
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

      it('should do nothing if widget has version type', () => {
        showAllTabs(false);

        let widget = new can.Map({
          type: 'version',
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

      it('should do nothing if widget is uncountable', () => {
        showAllTabs(false);

        let widget = new can.Map({
          uncountable: true,
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

      it('should do nothing if widget is in prohibited map list', () => {
        showAllTabs(false);

        isInProhibitedMapSpy.and.returnValue(true);

        let widget = new can.Map({
          uncountable: false,
          type: '',
          inForceShowList: false,
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

      it('should remove from hiddenWidgets when widget has count',
        () => {
          showAllTabs(false);

          let widget = new can.Map({
            count: 5,
            forceShow: false,
          });

          viewModel.updateHiddenWidgets(widget);

          expect(viewModel.removeFromHiddenWidgets)
            .toHaveBeenCalledWith(widget);
        });

      it('should remove from hiddenWidgets when widget forceShow is true',
        () => {
          showAllTabs(false);

          let widget = new can.Map({
            count: 0,
            forceShow: true,
          });

          viewModel.updateHiddenWidgets(widget);

          expect(viewModel.removeFromHiddenWidgets)
            .toHaveBeenCalledWith(widget);
        });

      it('should add to hiddenWidgets when widget has no count and '
        + 'forseShow is false', () => {
        showAllTabs(false);

        let widget = new can.Map({
          count: 0,
          forceShow: false,
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).toHaveBeenCalledWith(widget);
      });
    });

    describe('addToHiddenWidgets(widget) method', () => {
      it('should add widget if not in the list', () => {
        viewModel.attr('hiddenWidgets', []);

        let widget = new can.Map();
        viewModel.addToHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(1);
        expect(viewModel.attr('hiddenWidgets')[0]).toBe(widget);
      });

      it('should not add widget if already in the list', () => {
        let widget = new can.Map({id: '1'});
        viewModel.attr('hiddenWidgets', [widget]);

        viewModel.addToHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(1);
        expect(viewModel.attr('hiddenWidgets')[0]).toBe(widget);
      });
    });

    describe('removeFromHiddenWidgets(widget) method', () => {
      it('should remove widget if it is in the list', () => {
        let widget = new can.Map({id: '1'});
        viewModel.attr('hiddenWidgets', [widget]);

        viewModel.removeFromHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(0);
      });

      it('should not remove widget if it is not in the list', () => {
        let widget = new can.Map({id: '1'});
        viewModel.attr('hiddenWidgets', [widget]);

        viewModel.removeFromHiddenWidgets({id: '2'});

        expect(viewModel.attr('hiddenWidgets').length).toBe(1);
      });
    });

    describe('route(widgetId) method', () => {
      beforeEach(() => {
        spyOn(viewModel, 'updateHiddenWidgets');
      });

      it('should find widget in widgetList', () => {
        spyOn(viewModel, 'findWidgetById');

        viewModel.route('widget id');

        expect(viewModel.findWidgetById).toHaveBeenCalledWith('widget id');
      });

      it('should select first widget from widgetList '
        + 'if selected widget is not in the list', () => {
        spyOn(viewModel, 'findWidgetById').and.returnValue(null);
        viewModel.attr('widgetList', [{id: '1'}, {id: '2'}]);
        spyOn(router, 'attr');

        viewModel.route('selected widget id');
        expect(router.attr).toHaveBeenCalledWith('widget', '1');
      });

      it('should set forceShow TRUE for widget', () => {
        let widget = new can.Map({id: '1', forceShow: false});
        spyOn(viewModel, 'findWidgetById').and.returnValue(widget);

        viewModel.route('1');

        expect(widget.attr('forceShow')).toBe(true);
      });

      it('should set activeWidget if widget is in widgetList ', () => {
        let widget = new can.Map({id: '1'});
        spyOn(viewModel, 'findWidgetById').and.returnValue(widget);
        viewModel.attr('activeWidget', null);

        viewModel.route('1');

        expect(viewModel.attr('activeWidget').serialize().id)
          .toEqual(widget.id);
      });

      it('should dispatch "activeChanged" event if widget is in widgetList',
        () => {
          spyOn(viewModel, 'dispatch');
          let widget = new can.Map({id: '1'});
          spyOn(viewModel, 'findWidgetById').and.returnValue(widget);

          viewModel.route('1');

          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'activeChanged',
            widget,
          });
        });

      it('should update hiddenWidgets list', () => {
        let widget = new can.Map({id: '1'});
        spyOn(viewModel, 'findWidgetById').and.returnValue(widget);

        viewModel.route('1');

        expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
      });
    });

    describe('findWidgetById(widgetId) method', () => {
      it('should search widgets by id in widgetList', () => {
        let widget1 = {id: '1'};
        let widget2 = {id: '2'};
        viewModel.attr('widgetList', [widget1, widget2]);

        let result = viewModel.findWidgetById('2');

        expect(result.serialize()).toEqual(widget2);
      });

      it('retuns undefined when widget is not found', () => {
        let widget1 = {id: '1'};
        let widget2 = {id: '2'};
        viewModel.attr('widgetList', [widget1, widget2]);

        let result = viewModel.findWidgetById('3');

        expect(result).toBeUndefined();
      });
    });

    describe('findWidgetsByCountsName(countsName) method', () => {
      it('should search widgets by countsName in widgetList', () => {
        let widget1 = {id: '1', countsName: 'name1'};
        let widget2 = {id: '2', countsName: 'name2'};
        viewModel.attr('widgetList', [widget1, widget2]);

        let result = viewModel.findWidgetByCountsName('name2');

        expect(result.serialize()).toEqual(widget2);
      });

      it('retuns undefined when widget is not found', () => {
        let widget1 = {id: '1', countsName: 'name1'};
        let widget2 = {id: '2', countsName: 'name2'};
        viewModel.attr('widgetList', [widget1, widget2]);

        let result = viewModel.findWidgetByCountsName('name3');

        expect(result).toBeUndefined();
      });
    });

    describe('setWidgetCount(name, count) method', () => {
      it('should find widget in widgetList', () => {
        spyOn(viewModel, 'findWidgetByCountsName');

        viewModel.setWidgetCount('name', 5);

        expect(viewModel.findWidgetByCountsName).toHaveBeenCalledWith('name');
      });

      it('should set count to widget', () => {
        spyOn(viewModel, 'updateHiddenWidgets');
        let widget = new can.Map();
        spyOn(viewModel, 'findWidgetByCountsName').and.returnValue(widget);

        viewModel.setWidgetCount('name', 5);

        expect(widget.count).toBe(5);
      });

      it('should update hiddenWidgets list', () => {
        spyOn(viewModel, 'updateHiddenWidgets');
        let widget = new can.Map();
        spyOn(viewModel, 'findWidgetByCountsName').and.returnValue(widget);

        viewModel.setWidgetCount('name', 5);

        expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
      });
    });

    describe('closeTab(event) method', () => {
      beforeEach(() => {
        spyOn(viewModel, 'updateHiddenWidgets');
      });

      it('shoule set forceShow FALSE for widget', () => {
        let widget = new can.Map({id: '1', forceShow: true});

        viewModel.closeTab({widget});

        expect(widget.attr('forceShow')).toBe(false);
      });

      it('should not update router if closed tab is not currently selected',
        () => {
          router.attr('widget', 'selected');

          viewModel.closeTab({widget: new can.Map({id: 'another widget'})});

          expect(router.attr('widget')).toBe('selected');
        });

      it('should open first tab in widgetList '
        + 'if closed tab is currently selected',
      () => {
        router.attr('widget', 'selected');
        viewModel.attr('widgetList', [new can.Map({id: 'first tab'})]);

        viewModel.closeTab({widget: new can.Map({id: 'selected'})});

        expect(router.attr('widget')).toBe('first tab');
      });

      it('should update hiddenWidgets list', () => {
        let widget = new can.Map({id: '1', forceShow: true});

        viewModel.closeTab({widget});

        expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
      });
    });
  });

  describe('events', () => {
    describe('inserted event', () => {
      let event;
      beforeEach(() => {
        event = Component.prototype.events['inserted'].bind({viewModel});
      });

      it('should subscribe on router widget change', () => {
        spyOn(router, 'bind');

        event();
        expect(router.bind)
          .toHaveBeenCalledWith('widget', jasmine.any(Function));
      });

      it('should route to selected in router widget', () => {
        spyOn(viewModel, 'route');
        router.attr('widget', 'selected widget');
        event();

        expect(viewModel.route).toHaveBeenCalledWith('selected widget');
      });
    });
  });
});