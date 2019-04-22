/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {initWidgets} from '../../plugins/utils/widgets-utils';
import {gapiClient} from '../../plugins/ggrc-gapi-client';
import {RouterConfig} from '../../router';

gapiClient.loadGapiClient();

RouterConfig.setupRoutes([]);

const csvExportTemplate = can.stache(
  '<csv-export filename:from="\'Export Objects\'"/>'
);
$('#csv_export').html(csvExportTemplate);
$('#page-header').html(can.stache('<page-header/>'));
initWidgets();
