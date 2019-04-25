/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './mega-relation-selection-item.stache';
import pubSub from '../../pub-sub';

export default can.Component.extend({
  tag: 'mega-relation-selection-item',
  template: can.stache(template),
  leakScope: false,
  viewModel: can.Map.extend({
    mapAsChild: null,
    isDisabled: false,
    id: null,
    element: null,
    switchRelation(event, mapAsChild) {
      pubSub.dispatch({
        type: 'mapAsChild',
        id: this.attr('id'),
        val: mapAsChild ? 'child' : 'parent',
      });

      event.stopPropagation();
    },
    define: {
      childRelation: {
        get() {
          return this.attr('mapAsChild') === true;
        },
      },
      parentRelation: {
        get() {
          return this.attr('mapAsChild') === false;
        },
      },
    },
  }),
});
