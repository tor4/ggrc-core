/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
 * Util methods for integration with GGRCQ.
 */

/**
 * Determine whether model type could have mapped questions.
 * @param {Object} instance - The model instance
 * @return {Boolean} True or False
 */
function hasQuestions(instance) {
  return instance &&
    instance.constructor &&
    instance.constructor.isQuestionnaireable;
}

/**
 * Determine whether model type is changeable externally.
 * @param {Object} instance - The model instance
 * @return {Boolean} True or False
 */
function isChangeableExternally(instance) {
  return instance &&
    instance.constructor &&
    instance.constructor.isChangeableExternally;
}

/**
 * Get url to questionnaire
 * @param {Object} options - The url options
 * @param {String} options.model - The model name
 * @param {String} options.path - The questionnaire path
 * @param {String} options.slug - The model slug
 * @param {String} options.view - The view path
 * @return {String} Url to questions
 */
function getUrl({model, path, slug, view, params}) {
  let url = GGRC.GGRC_Q_INTEGRATION_URL;
  if (!url) {
    return '';
  }
  if (!url.endsWith('/')) {
    url += '/';
  }

  model = model.toLowerCase();
  path = path.toLowerCase();
  slug = slug.toLowerCase();
  view = view ? `/${view}` : '';
  params = params ? `?${params}` : '';

  return `${url}${path}/${model}=${slug}${view}${params}`;
}

/**
 * Get url to page with questions
 * @param {Object} instance - The model instance
 * @return {String} Url to questions
 */
function getQuestionsUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: 'questionnaires',
    slug: instance.slug,
  });
}

/**
 * Get url to info view
 * @param {Object} instance - The model instance
 * @return {String} Url to info view
 */
function getInfoUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'info',
  });
}

/**
 * Get url to comment form
 * @param {Object} instance - The model instance
 * @return {String} Url to comment form
 */
function getCommentFormUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'info',
    params: 'comments=open',
  });
}

/**
 * Get url to review view
 * @param {Object} instance - The model instance
 * @return {String} Url to review view
 */
function getReviewUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'review',
  });
}

export {
  hasQuestions,
  isChangeableExternally,
  getCommentFormUrl,
  getQuestionsUrl,
  getInfoUrl,
  getReviewUrl,
  getUrl,
};
