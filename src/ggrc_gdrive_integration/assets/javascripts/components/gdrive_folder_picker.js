/*
 * Copyright (C) 2017 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  uploadFiles,
  GDRIVE_PICKER_ERR_CANCEL,
} from '../utils/gdrive-picker-utils.js';

(function (can, $) {
  'use strict';

  GGRC.Components('gDriveFolderPicker', {
    tag: 'ggrc-gdrive-folder-picker',
    template: can.view(GGRC.mustache_path + '/gdrive/gdrive_folder.mustache'),
    viewModel: {
      define: {
        readonly: {
          type: 'boolean',
          value: false
        },
        hasRevisionFolder: {
          type: 'boolean',
          get: function () {
            return this.attr('readonly') &&
              this.instance.folder;
          }
        },
        hideLabel: {
          type: 'boolean',
          value: false
        }
      },
      _folder_change_pending: false,
      no_detach: '@',
      deferred: '@',
      tabindex: '@',
      placeholder: '@',
      instance: null,
      isRevisionFolderLoaded: false,
      /**
       * Helper method for unlinking folder currently linked to the
       * given instance.
       *
       * @return {Object} - a deferred object that is resolved when the instance's
       *   folder has been successfully unlinked from it
       */
      unlinkFolder: function () {
        return this.instance.refresh().then(function () {
          this.instance.attr('folder', null);
          return this.instance.save();
        }.bind(this));
      },
      /**
       * Helper method for linking new folder to the given instance
       *
       * @param {String} folderId - GDrive folder id
       * @return {Object} - a deferred object that is resolved when the instance's
       *   folder has been successfully linked to it
       */
      linkFolder: function (folderId) {
        return this.instance.refresh().then(function () {
          this.instance.attr('folder', folderId);
          return this.instance.save();
        }.bind(this));
      },
      setCurrent: function (folderId) {
        var gdriveFolder;

        this.attr('_folder_change_pending', true);

        gdriveFolder = new CMS.Models.GDriveFolder({
          id: folderId,
          href: '/drive/v2/files/' + folderId
        });

        return gdriveFolder.refresh()
          .always(function () {
            this.attr('_folder_change_pending', false);
          }.bind(this))
          .done(function () {
            this.attr('current_folder', gdriveFolder);
            this.attr('folder_error', null);
          }.bind(this))
          .fail(function (error) {
            this.attr('folder_error', error);
          }.bind(this));
      },
      unsetCurrent: function () {
        this.attr('_folder_change_pending', false);
        this.attr('folder_error', null);
        this.attr('current_folder', null);
      },
      setRevisionFolder: function () {
        var folderId;

        if (!this.attr('hasRevisionFolder')) {
          this.attr('isRevisionFolderLoaded', true);
          return;
        }

        folderId = this.instance.attr('folder');
        if (folderId) {
          this.attr('isRevisionFolderLoaded', false);

          this.setCurrent(folderId)
            .then(function () {
              this.attr('isRevisionFolderLoaded', true);
            }.bind(this));
        }
      }
    },

    events: {
      inserted: function () {
        var viewModel = this.viewModel;
        var folderId;

        if (viewModel.attr('hasRevisionFolder')) {
          viewModel.setRevisionFolder();
        } else {
          this.element.removeAttr('tabindex');

          folderId = viewModel.instance.attr('folder');
          if (folderId) {
            viewModel.setCurrent(folderId);
          }
        }
      },

      '{viewModel.instance} change': function (inst, ev, attr) {
        var folderId;

        // Error recovery from previous refresh_instances error when we couldn't set up the binding.
        if (!this.viewModel.folder_error) {
          return;
        }

        folderId = this.viewModel.instance.attr('folder');
        if (folderId) {
          this.viewModel.setCurrent(folderId);
        }
      },

      /**
       * Handle a click on the button for detaching an upload folder from
       * a model instance (e.g. an Audit).
       *
       * @param {Object} el - The jQuery-wrapped DOM element on which the event
       *   has been triggered.
       * @param {Object} ev - The event object.
       */
      'a[data-toggle=gdrive-remover] click': function (el, ev) {
        var viewModel = this.viewModel;
        var dfd;

        if (viewModel.deferred) {
          viewModel.instance.attr('folder', null);
          dfd = $.when();
        } else {
          dfd = viewModel.unlinkFolder();
        }

        dfd.then(viewModel.unsetCurrent.bind(viewModel));
      },
      'a[data-toggle=gdrive-picker] click': function (el, ev) {
        uploadFiles({
          parentId: el.data('folder-id'),
          pickFolder: el.data('type') === 'folders',
        }).then((files, action) => {
          el.trigger('picked', {
            files,
          });
        })
        .fail((err)=>{
          if ( err && err.type === GDRIVE_PICKER_ERR_CANCEL ) {
            el.trigger('rejected');
          }
        });
      },

      /*
       * Handle an event of the user picking a new GDrive upload folder.
       *
       * @param {Object} el - The jQuery-wrapped DOM element on which the event
       *   has been triggered.
       * @param {Object} ev - The event object.
       * @param {Object} data - Additional event data.
       *   @param {Array} data.files - The list of GDrive folders the user picked
       *     in the GDrive folder picker modal.
       */
      '.entry-attachment picked': function (el, ev, data) {
        var dfd;
        var files = data.files || [];
        var folderId;
        var viewModel = this.viewModel;

        if (el.data('type') === 'folders' &&
            files.length &&
            files[0].mimeType !== 'application/vnd.google-apps.folder'
        ) {
          $(document.body).trigger('ajax:flash', {
            error: 'ERROR: Something other than a Drive folder was chosen for a folder slot.  Please choose a folder.'
          });
          return;
        }

        viewModel.attr('_folder_change_pending', true);

        folderId = files[0].id;
        if (viewModel.deferred) {
          viewModel.instance.attr('folder', folderId);
          dfd = $.when();
        } else {
          dfd = viewModel.linkFolder(folderId);
        }

        dfd.then(viewModel.setCurrent(folderId))
          .then(function () {
            if (viewModel.deferred && viewModel.instance._transient) {
              viewModel.instance.attr('_transient.folder', files[0]);
            }
          });
        return dfd;
      }
    }
  });
})(window.can, window.can.$);
