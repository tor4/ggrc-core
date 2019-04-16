/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import RefreshQueue from '../refresh_queue';
import Mappings from './mappings';

(function (GGRC, can) {
  GGRC.ListLoaders.ReifyingListLoader =
    GGRC.ListLoaders.BaseListLoader.extend({}, {
      init: function (source) {
        this._super();

        if (source instanceof GGRC.ListLoaders.ListBinding) {
          this.source_binding = source;
        } else {
          this.source = source;
        }
      },
      insert_from_source_binding: function (binding, results) {
        let self = this;
        let refreshQueue = new RefreshQueue();
        let newResults = [];

        _.forEach(results, function (result) {
          refreshQueue.enqueue(result.instance);
          newResults.push(self.make_result(result.instance, [result], binding));
        });
        return refreshQueue.trigger().then(function () {
          self.insert_results(binding, newResults);
        });
      },
      init_listeners: function (binding) {
        let self = this;

        if (this.source_binding) {
          binding.source_binding = this.source_binding;
        } else {
          binding.source_binding = Mappings.getBinding(
            this.source,
            binding.instance);
        }

        this.insert_from_source_binding(binding,
          binding.source_binding.list, 0);

        binding.source_binding.list.bind('add', function (ev, results, index) {
          self.insert_from_source_binding(binding, results, index);
        });

        binding.source_binding.list.bind('remove',
          function (ev, results, index) {
            _.forEach(results, function (result) {
              self.remove_instance(binding, result.instance, result);
            });
          });
      },
      _refresh_stubs: function (binding) {
        return binding.source_binding.refresh_stubs(binding);
      },
    });
})(window.GGRC, window.can);
