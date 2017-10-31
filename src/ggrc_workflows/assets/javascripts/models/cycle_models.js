/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can) {
  var _mustachePath;

  function refreshAttr(instance, attr) {
    if (instance.attr(attr).reify().selfLink) {
      instance.attr(attr).reify().refresh();
    }
  }

  function refreshAttrWrap(attr) {
    return function (ev, instance) {
      if (instance instanceof this) {
        refreshAttr(instance, attr);
      }
    };
  }

  function populateFromWorkflow(form, workflow) {
    if (!workflow || typeof workflow === 'string') {
      // We need to invalidate the form, so we remove workflow and dependencies
      // if it's not set
      form.removeAttr('workflow');
      form.removeAttr('context');
      form.removeAttr('cycle');
      form.removeAttr('cycle_task_group');
      return;
    }
    if (workflow.reify) {
      workflow = workflow.reify();
    } else {
      console.log("Can't reify workflow");
      return;
    }
    if (typeof workflow.cycles === undefined || !workflow.cycles) {
      $(document.body).trigger(
        'ajax:flash',
        {warning: 'No cycles in the workflow!'}
      );
      return;
    }

    workflow.refresh_all('cycles').then(function (cycleList) {
      var activeCycleList = _.filter(cycleList, {is_current: true});
      var activeCycle;

      if (!activeCycleList.length) {
        $(document.body).trigger(
          'ajax:flash',
          {warning: 'No active cycles in the workflow!'}
        );
        return;
      }
      activeCycleList = _.sortByOrder(
        activeCycleList, ['start_date'], ['desc']);
      activeCycle = activeCycleList[0];
      form.attr('workflow', {id: workflow.id, type: 'Workflow'});
      form.attr('context', {id: workflow.context.id, type: 'Context'});
      form.attr('cycle', {id: activeCycle.id, type: 'Cycle'});

      //reset cycle task group after workflow updating
      form.removeAttr('cycle_task_group');
    });
  }

  _mustachePath = GGRC.mustache_path + '/cycles';
  can.Model.Cacheable('CMS.Models.Cycle', {
    root_object: 'cycle',
    root_collection: 'cycles',
    category: 'workflow',
    findAll: 'GET /api/cycles',
    findOne: 'GET /api/cycles/{id}',
    create: 'POST /api/cycles',
    update: 'PUT /api/cycles/{id}',
    destroy: 'DELETE /api/cycles/{id}',
    mixins: ['isOverdue'],
    attributes: {
      workflow: 'CMS.Models.Workflow.stub',
      cycle_task_groups: 'CMS.Models.CycleTaskGroup.stubs',
      modified_by: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub'
    },
    tree_view_options: {
      draw_children: true,
      attr_list: [{
        attr_title: 'Title',
        attr_name: 'title',
        order: 10
      }, {
        attr_title: 'State ',
        attr_name: 'status',
        order: 15
      }, {
        attr_title: 'End Date',
        attr_name: 'end_date',
        order: 20
      }],
      mandatory_attr_name: ['title', 'status', 'end_date'],
      disable_columns_configuration: true
    },
    init: function () {
      var that = this;
      this._super.apply(this, arguments);
      this.bind('created', refreshAttrWrap('workflow').bind(this));
      this.bind('destroyed', function (ev, inst) {
        if (inst instanceof that) {
          can.each(inst.cycle_task_groups, function (cycleTaskGroup) {
            if (!cycleTaskGroup) {
              return;
            }
            cycleTaskGroup = cycleTaskGroup.reify();
            can.trigger(cycleTaskGroup, 'destroyed');
            can.trigger(
              cycleTaskGroup.constructor, 'destroyed', cycleTaskGroup);
          });
        }
      });
    }
  }, {
    init: function () {
      var that = this;
      this._super.apply(this, arguments);
      this.bind('status', function (ev, newVal) {
        if (newVal === 'Verified') {
          new RefreshQueue().enqueue(this.workflow.reify())
            .trigger()
            .then(function (wfs) {
              return wfs[0].get_binding('owners').refresh_instances();
            })
            .then(function (wfOwnerBindings) {
              var currentUser = CMS.Models.get_instance(
                'Person', GGRC.current_user.id);
              if (
                ~can.inArray(
                  currentUser,
                  can.map(wfOwnerBindings, function (wfOwnerBinding) {
                    return wfOwnerBinding.instance;
                  })
                )
              ) {
                that.refresh().then(function () {
                  if (that.attr('is_current')) {
                    that.attr('is_current', false);
                    that.save();
                  }
                });
              }
            });
        }
      });
    }
  });

  _mustachePath = GGRC.mustache_path + '/cycle_task_entries';
  can.Model.Cacheable('CMS.Models.CycleTaskEntry', {
    root_object: 'cycle_task_entry',
    root_collection: 'cycle_task_entries',
    category: 'workflow',
    findAll: 'GET /api/cycle_task_entries',
    findOne: 'GET /api/cycle_task_entries/{id}',
    create: 'POST /api/cycle_task_entries',
    update: 'PUT /api/cycle_task_entries/{id}',
    destroy: 'DELETE /api/cycle_task_entries/{id}',
    info_pane_options: {
    },
    attributes: {
      cycle_task_group_object_task: 'CMS.Models.CycleTaskGroupObjectTask.stub',
      modified_by: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub',
      cycle: 'CMS.Models.Cycle.stub'
    },

    tree_view_options: {
      show_view: _mustachePath + '/tree.mustache',
      footer_view: _mustachePath + '/tree_footer.mustache'
    },
    init: function () {
      this._super.apply(this, arguments);
      this.bind('created',
        refreshAttrWrap('cycle_task_group_object_task').bind(this));
      this.validateNonBlank('description');
    }
  }, {});

  _mustachePath = GGRC.mustache_path + '/cycle_task_groups';
  can.Model.Cacheable('CMS.Models.CycleTaskGroup', {
    root_object: 'cycle_task_group',
    root_collection: 'cycle_task_groups',
    category: 'workflow',
    findAll: 'GET /api/cycle_task_groups',
    findOne: 'GET /api/cycle_task_groups/{id}',
    create: 'POST /api/cycle_task_groups',
    update: 'PUT /api/cycle_task_groups/{id}',
    destroy: 'DELETE /api/cycle_task_groups/{id}',
    mixins: ['isOverdue'],
    attributes: {
      cycle: 'CMS.Models.Cycle.stub',
      task_group: 'CMS.Models.TaskGroup.stub',
      cycle_task_group_tasks: 'CMS.Models.CycleTaskGroupObjectTask.stubs',
      modified_by: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub'
    },

    tree_view_options: {
      sort_property: 'sort_index',
      draw_children: true
    },

    init: function () {
      var that = this;
      this._super.apply(this, arguments);

      this.validateNonBlank('contact');
      this.validateContact(['_transient.contact', 'contact']);
      this.bind('updated', function (ev, instance) {
        var dfd;
        if (instance instanceof that) {
          dfd = instance.refresh_all_force('cycle', 'workflow');
          dfd.then(function () {
            return $.when(
              instance.refresh_all_force('related_objects'),
              instance.refresh_all_force('cycle_task_group_tasks')
            );
          });
        }
      });
      this.bind('destroyed', function (ev, inst) {
        if (inst instanceof that) {
          can.each(inst.cycle_task_group_tasks, function (ctgt) {
            if (!ctgt) {
              return;
            }
            ctgt = ctgt.reify();
            can.trigger(ctgt, 'destroyed');
            can.trigger(ctgt.constructor, 'destroyed', ctgt);
          });
        }
      });
    }
  }, {});

  _mustachePath = GGRC.mustache_path + '/cycle_task_group_object_tasks';
  can.Model.Cacheable('CMS.Models.CycleTaskGroupObjectTask', {
    root_object: 'cycle_task_group_object_task',
    root_collection: 'cycle_task_group_object_tasks',
    mixins: ['timeboxed', 'isOverdue', 'accessControlList', 'ca_update'],
    category: 'workflow',
    findAll: 'GET /api/cycle_task_group_object_tasks',
    findOne: 'GET /api/cycle_task_group_object_tasks/{id}',
    create: 'POST /api/cycle_task_group_object_tasks',
    update: 'PUT /api/cycle_task_group_object_tasks/{id}',
    destroy: 'DELETE /api/cycle_task_group_object_tasks/{id}',
    title_singular: 'Cycle Task',
    attributes: {
      cycle_task_group: 'CMS.Models.CycleTaskGroup.stub',
      task_group_task: 'CMS.Models.TaskGroupTask.stub',
      cycle_task_entries: 'CMS.Models.CycleTaskEntry.stubs',
      modified_by: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub',
      cycle: 'CMS.Models.Cycle.stub'
    },
    permalink_options: {
      url: '<%= base.viewLink %>#current_widget' +
      '/cycle/<%= instance.cycle.id %>' +
      '/cycle_task_group/<%= instance.cycle_task_group.id %>' +
      '/cycle_task_group_object_task/<%= instance.id %>',
      base: 'cycle:workflow'
    },
    info_pane_options: {
      mapped_objects: {
        model: can.Model.Cacheable,
        mapping: 'info_related_objects',
        show_view: GGRC.mustache_path + '/base_templates/subtree.mustache'
      },
      comments: {
        model: can.Model.Cacheable,
        mapping: 'cycle_task_entries',
        show_view: GGRC.mustache_path + '/cycle_task_entries/tree.mustache'
      }
    },
    tree_view_options: {
      sort_property: 'sort_index',
      attr_view: _mustachePath + '/tree-item-attr.mustache',
      attr_list: [
        {
          attr_title: 'Task title',
          attr_name: 'title',
          attr_sort_field: 'task title'
        },
        {
          attr_title: 'Cycle title',
          attr_name: 'workflow',
          attr_sort_field: 'cycle title'
        },
        {
          attr_title: 'Task state',
          attr_name: 'status',
          attr_sort_field: 'task state'
        },
        {
          attr_title: 'Task start date',
          attr_name: 'start_date',
          attr_sort_field: 'task start date'
        },
        {
          attr_title: 'Task due date',
          attr_name: 'end_date',
          attr_sort_field: 'task due date'
        },
        {
          attr_title: 'Task last updated',
          attr_name: 'updated_at',
          attr_sort_field: 'task last updated'
        },
        {
          attr_title: 'Task last updated by',
          attr_name: 'modified_by',
          attr_sort_field: 'task last updated by'
        }
      ],
      display_attr_names: ['title', 
                           'Task Assignees', 
                           'start_date', 
                           'end_date'],
      mandatory_attr_name: ['title'],
      draw_children: true
    },
    sub_tree_view_options: {
      default_filter: ['Control'],
    },
    init: function () {
      var that = this;
      var assigneeRole = _.find(GGRC.access_control_roles, {
        object_type: 'CycleTaskGroupObjectTask',
        name: 'Task Assignees',
      });
      this._super.apply(this, arguments);
      this.validateNonBlank('title');
      this.validateNonBlank('workflow');
      this.validateNonBlank('cycle');
      this.validateNonBlank('cycle_task_group');
      this.validateNonBlank('start_date');
      this.validateNonBlank('end_date');

      // instance.attr('access_control_list')
      //   .replace(...) doesn't raise change event
      // that's why we subscribe on access_control_list.length
      this.validate('access_control_list.length', function () {
        var that = this;
        var hasAssignee = assigneeRole && _.some(that.access_control_list, {
          ac_role_id: assigneeRole.id,
        });

        if (!hasAssignee) {
          return 'No valid contact selected for assignee';
        }
      });

      this.bind('updated', function (ev, instance) {
        if (instance instanceof that) {
          instance.refresh_all_force('related_objects').then(function (object) {
            return instance.refresh_all_force(
              'cycle_task_group', 'cycle', 'workflow');
          });
        }
      });
    }
  }, {
    _workflow: function () {
      return this.refresh_all('cycle', 'workflow').then(function (workflow) {
        return workflow;
      });
    },
    set_properties_from_workflow: function (workflow) {
      // The form sometimes returns plaintext instead of object,
      // return in that case
      // If workflow is empty form should be invalidated
      if (typeof workflow === 'string' && workflow !== '') {
        return;
      }
      populateFromWorkflow(this, workflow);
    },
    form_preload: function (newObjectForm, objectParams) {
      var form = this;
      var workflows;
      var _workflow;
      var cycle;

      if (newObjectForm) {
        // prepopulate dates with default ones
        this.attr('start_date', new Date());
        this.attr('end_date', moment().add({month: 3}).toDate());

        // if we are creating a task from the workflow page, the preset
        // workflow should be that one
        if (objectParams && objectParams.workflow !== undefined) {
          populateFromWorkflow(form, objectParams.workflow);
          return;
        }

        workflows = CMS.Models.Workflow.findAll({
          kind: 'Backlog', status: 'Active', __sort: '-created_at'});
        workflows.then(function (workflowList) {
          if (!workflowList.length) {
            $(document.body).trigger(
              'ajax:flash',
              {warning: 'No Backlog' +
              ' workflows found!' +
              ' Contact your administrator to enable this functionality.',
              }
            );
            return;
          }
          _workflow = workflowList[0];
          populateFromWorkflow(form, _workflow);
        });
      } else {
        cycle = form.cycle.reify();
        if (!_.isUndefined(cycle.workflow)) {
          form.attr('workflow', cycle.workflow.reify());
        }
      }
    },
    object: function () {
      return this.refresh_all(
        'task_group_object', 'object'
      ).then(function (object) {
        return object;
      });
    },

    /**
     * Determine whether the Task's response options can be edited, taking
     * the Task and Task's Cycle status into account.
     *
     * @return {Boolean} - true if editing response options is allowed,
     *   false otherwise
     */
    responseOptionsEditable: function () {
      var cycle = this.attr('cycle').reify();
      var status = this.attr('status');

      return cycle.attr('is_current') &&
        !_.contains(['Finished', 'Verified'], status);
    }
  });
})(window.can);
