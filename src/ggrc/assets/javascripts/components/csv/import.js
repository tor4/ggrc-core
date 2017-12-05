/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../../plugins/utils/controllers';
import {warning} from '../../plugins/utils/modals';
import {hasWarningType} from '../../plugins/utils/controllers';
import './csv-template';
import '../show-more/show-more';
import template from './templates/csv-import.mustache';

export default can.Component.extend({
  tag: 'csv-import',
  template: template,
  requestData: null,
  viewModel: {
    importUrl: '/_service/import_csv',
    'import': null,
    fileId: '',
    fileName: '',
    isLoading: false,
    state: 'select',
    helpUrl: GGRC.config.external_import_help_url,
    states: function () {
      var state = this.attr('state') || 'select';
      var states = {
            select: {
              'class': 'btn-green',
              text: 'Choose file to import',
            },
            analyzing: {
              'class': 'btn-white',
              showSpinner: true,
              isDisabled: true,
              text: 'Analyzing',
            },
            'import': {
              'class': 'btn-green',
              text: 'Import',
              isDisabled: function () {
                // info on blocks to import
                var toImport = this.import;
                var nonEmptyBlockExists;
                var hasErrors;

                if (!toImport || toImport.length < 1) {
                  return true;
                }

                // A non-empty block is a block containing at least one
                // line that is not ignored (due to errors, etc.).
                nonEmptyBlockExists = _.any(toImport, function (block) {
                  return block.rows > block.ignored;
                });

                hasErrors = _.any(toImport, function (block) {
                  return block.block_errors.length;
                });

                return hasErrors || !nonEmptyBlockExists;
              }.bind(this),
            },
            importing: {
              'class': 'btn-white',
              showSpinner: true,
              isDisabled: true,
              text: 'Importing',
            },
            success: {
              'class': 'btn-green',
              isDisabled: true,
              text: '<i class="fa fa-check-square-o white">'+
                '</i> Import successful',
            },
          };

      return _.extend(states[state], {state: state});
    },
    prepareDataForCheck: function (requestData) {
      var checkResult = {
        hasDeprecations: false,
        hasDeletions: false,
      };

      // check if imported data has deprecated or deleted objects
      _.each(requestData, function (element) {
        if (
          checkResult.hasDeprecations &&
          checkResult.hasDeletions
        ) {
          return false;
        }

        if (!checkResult.hasDeletions) {
          checkResult.hasDeletions = (element.deleted > 0);
        }

        if (!checkResult.hasDeprecations) {
          checkResult.hasDeprecations = (element.deprecated > 0);
        }
      });

      return {
        data: requestData,
        check: checkResult,
      };
    },
    processLoadedInfo: function (data) {
      this.attr('import', _.map(data, function (element) {
        element.data = [];
        if (element.block_errors.concat(element.row_errors).length) {
          element.data.push({
            status: 'errors',
            messages: element.block_errors.concat(element.row_errors),
          });
        }
        if (element.block_warnings.concat(element.row_warnings).length) {
          element.data.push({
            status: 'warnings',
            messages: element.block_warnings.concat(element.row_warnings),
          });
        }
        return element;
      }));
      this.attr('state', 'import');
    },
    needWarning: function (checkObj, data) {
      var hasWarningTypes = _.every(data, function (item) {
        return hasWarningType({type: item.name});
      });
      return hasWarningTypes &&
        (
          checkObj.hasDeletions ||
          checkObj.hasDeprecations
        );
    },
    beforeProcess: function (check, data, element) {
      var operation;
      var needWarning = this.needWarning(check, data);

      if (needWarning) {
        operation = this.getOperationNameFromCheckObj(check);

        warning(
          {
            objectShortInfo: 'imported object(s)',
            modal_description:
              'In the result of import some Products, Systems or ' +
              'Processes will be ' + operation.past + '.',
            operation: operation.action,
          },
          () => {
            this.processLoadedInfo(data);
          },
          () => {
            this.attr('state', 'import');
            this.resetFile(element);
          }
        );
        return;
      }

      this.processLoadedInfo(data);
    },
    getOperationNameFromCheckObj: function (checkObj) {
      var action = _.compact([
        checkObj.hasDeletions ? 'deletion' : '',
        checkObj.hasDeprecations ? 'deprecation' : '',
      ]).join(' and ');
      var pastForm = _.compact([
        checkObj.hasDeletions ? 'deleted' : '',
        checkObj.hasDeprecations ? 'deprecated' : '',
      ]).join(' and ');

      return {
        action: action,
        past: pastForm,
      };
    },
    resetFile: function (element) {
      this.attr({
        state: 'select',
        fileId: '',
        fileName: '',
        'import': null
      });
      element.find('.csv-upload').val('');
    },
    requestImport: function (file) {
      this.attr('state', 'analyzing');
      this.attr('isLoading', true);
      this.attr('fileId', file.id);
      this.attr('fileName', file.name);

      GGRC.Utils.import_request({data: {id: file.id}}, true)
        .then(this.prepareDataForCheck)
        .then((checkObject) => {
          this.beforeProcess(
            checkObject.check,
            checkObject.data,
            this.element
          );
        })
        .fail((data) => {
          this.attr('state', 'select');
          GGRC.Errors.notifier('error', data.responseJSON.message);
        })
        .always(() => {
          this.attr('isLoading', false);
        });
    },
  },
  events: {
    '.state-reset click': function (el, ev) {
      ev.preventDefault();
      this.viewModel.resetFile(this.element);
    },
    '.state-import click': function (el, ev) {
      ev.preventDefault();
      this.viewModel.attr('state', 'importing');

      GGRC.Utils.import_request({
        data: {id: this.viewModel.attr('fileId')},
      }, false)
      .done((data) => {
        var result_count = data.reduce(function (prev, curr) {
              _.each(Object.keys(prev), function (key) {
                prev[key] += curr[key] || 0;
              });
              return prev;
            }, {created: 0, updated: 0, deleted: 0, ignored: 0});

        this.viewModel.attr('state', 'success');
        this.viewModel.attr('data', [result_count]);
      })
      .fail((data) => {
        this.viewModel.attr('state', 'select');
        GGRC.Errors.notifier('error', data.responseJSON.message);
      })
      .always(() => {
        this.viewModel.attr('isLoading', false);
      });
    },
    '#import_btn.state-select click': function (el, ev) {
      var that = this;
      var allowedTypes = ['text/csv', 'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet'];

      GGRC.Controllers.GAPI
        .reAuthorize(gapi.auth.getToken())
        .done(()=>{
          gapi.load('picker', {callback: createPicker});
        });

      function createPicker() {
        GGRC.Controllers.GAPI.oauth_dfd.done(function (token, oauth_user) {
          var dialog;
          var docsUploadView;
          var docsView;
          var picker = new google.picker.PickerBuilder()
                .setOAuthToken(gapi.auth.getToken().access_token)
                .setDeveloperKey(GGRC.config.GAPI_KEY)
                .setCallback(pickerCallback);

          docsUploadView = new google.picker.DocsUploadView();
          docsView = new google.picker.DocsView()
            .setMimeTypes(allowedTypes);

          picker.addView(docsUploadView)
            .addView(docsView);

          picker = picker.build();
          picker.setVisible(true);

          $('div.picker-dialog-bg').css('zIndex', 4000);

          dialog = GGRC.Utils.getPickerElement(picker);
          if (dialog) {
            dialog.style.zIndex = 4001;
          }
        });
      }

      function pickerCallback(data) {
        var file;
        var model;
        var PICKED = google.picker.Action.PICKED;
        var ACTION = google.picker.Response.ACTION;
        var DOCUMENTS = google.picker.Response.DOCUMENTS;

        if (data[ACTION] === PICKED) {
          model = CMS.Models.GDriveFile;
          file = model.models(data[DOCUMENTS])[0];

          if (file && _.any(allowedTypes, function (type) {
            return type === file.mimeType;
          })) {
            that.viewModel.requestImport(file);
          } else {
            GGRC.Errors.notifier('error',
              'Something other than a csv-file was chosen. ' +
              'Please choose a csv-file.');
          }
        }
      }
    },
  },
});
