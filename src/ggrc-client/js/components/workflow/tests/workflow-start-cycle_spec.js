/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import component from '../workflow-start-cycle';
import * as helpers from '../../../plugins/utils/workflow-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';

describe('workflow-start-cycle component', function () {
  let events;
  beforeAll(function () {
    events = component.prototype.events;
  });

  describe('click event handler', function () {
    let handler;
    let workflowMock;
    let generateDfd;

    beforeEach(function () {
      handler = events.click;
      workflowMock = jasmine.createSpyObj('workflow', ['refresh_all']);
      generateDfd = $.Deferred();

      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(workflowMock);
      spyOn(helpers, 'generateCycle')
        .and.returnValue(generateDfd);
    });

    it('should update TaskGroups when cycle was generated', function (done) {
      handler();
      generateDfd.resolve().then(() => {
        expect(helpers.generateCycle).toHaveBeenCalled();
        expect(workflowMock.refresh_all)
          .toHaveBeenCalledWith('task_groups', 'task_group_tasks');
        done();
      });
    });

    it('shouldn\'t update TaskGroups when cycle wasn\'t generated',
      function () {
        handler();
        generateDfd.reject();

        expect(helpers.generateCycle).toHaveBeenCalled();
        expect(workflowMock.refresh_all)
          .not.toHaveBeenCalled();
      });
  });
});
