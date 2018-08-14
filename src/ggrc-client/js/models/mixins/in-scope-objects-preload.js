/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

export default Mixin('inScopeObjectsPreload', {}, {
  'after:info_pane_preload'() {
    if (this.updateScopeObject) {
      this.updateScopeObject();
    }
  },
  'after:form_preload'() {
    if (this.updateScopeObject) {
      this.updateScopeObject();
    }
  },
});
