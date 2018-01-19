/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../dropdown/multiselect-dropdown';
import {
  confirm,
} from '../../plugins/utils/modals';
import template from './templates/csv-template.mustache';

export default can.Component.extend({
  tag: 'csv-template',
  template,
  viewModel: {
    state: {
      open: false,
    },
    isLoading: false,
    options: [],
    selected: [],
    init() {
      this.attr('options', GGRC.Bootstrap.importable.map((item) => {
        return new can.Map({
          value: item.title_plural,
          object_name: item.model_singular,
          checked: false,
        });
      }));
    },
    showDialog() {
      this.attr('options').forEach((option) => option.attr('checked', false));
      this.attr('state.open', true);
    },
    downloadSheet() {
      this.exportTemplate('gdrive')
        .then((data) => {
          if (data) {
            let link = 'https://docs.google.com/spreadsheets/d/' + data.id;

            confirm({
              modal_title: 'Export Completed',
              modal_description: `File is exported successfully.
              You can view the file here:
              <a href="${link}" target="_blank">${link}</a>`,
              button_view:
                `${GGRC.mustache_path}/modals/close_buttons.mustache`,
            });
          }
        });
    },
    downloadCSV() {
      this.exportTemplate('csv')
        .then((data) => {
          if (data) {
            GGRC.Utils.download('import_template.csv', data);
          }
        });
    },
    exportTemplate(exportTo) {
      let dfd = new can.Deferred();
      let objects = _.map(this.attr('selected'), (el) => {
        return {
          object_name: el.object_name,
          fields: 'all',
        };
      });

      if (!objects.length) {
        return dfd.resolve();
      }

      this.attr('isLoading', true);
      GGRC.Utils.export_request({
        data: {
          objects: objects,
          export_to: exportTo,
        },
      }).then((data) => {
        this.attr('state.open', false);
        dfd.resolve(data);
      }).always(() => {
        this.attr('isLoading', false);
      });

      return dfd;
    },
  },
});
