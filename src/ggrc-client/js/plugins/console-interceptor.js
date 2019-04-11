/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const originalWarn = console.warn;
const hiddenWarings = [];

const hideTemplates = [
  'can-component: Assigning a DefineMap or constructor type',
];

console.warn = function (text) {
  let matched = _.filter(hideTemplates, (template) => text.includes(template));
  if (matched.length) {
    hiddenWarings.push(arguments);

    return;
  }

  originalWarn.apply(this, arguments);
};

/* eslint-disable */
console.showHiddenWarnings = function () {
  hiddenWarings.forEach((args) => {
    originalWarn.apply(null, args);
  });
};
