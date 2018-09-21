/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Join from './join';
import Person from '../business-models/person';
import Cacheable from '../cacheable';
import Stub from '../stub';

export default Join('CMS.Models.ObjectPerson', {
  root_object: 'object_person',
  root_collection: 'object_people',
  findAll: 'GET /api/object_people',
  create: 'POST /api/object_people',
  update: 'PUT /api/object_people/{id}',
  destroy: 'DELETE /api/object_people/{id}',
  join_keys: {
    personable: Cacheable,
    person: Person,
  },
  attributes: {
    context: Stub,
    modified_by: Stub,
    person: Stub,
    personable: Stub,
  },
}, {});
