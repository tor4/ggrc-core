/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

export const GDRIVE_PICKER_ERR_CANCEL = 'GDRIVE_PICKER_ERR_CANCEL';

/**
 * Calls GDrive Picker and returns promise which is resolved to uploaded files
 * @param  {Object}  [opts={}]     options
 * @param  {String}  opts.parentId id of the destination folder
 * @param  {boolean} opts.pickFolder wether to use the single folder picker mode ( overrides multiSelect to false )
 * @param  {boolean} opts.multiSelect wether to allow multiple file selection available only in file picker mode i.e. pickFolder=false
 * @return {Promise.<Array.<GDriveFile>>} A Promise which resolves to an array of GDriveFile instances and a picker action as a second parameter
 */
export function uploadFiles(opts = {}) {
  var {parentId=null, pickFolder=false, multiSelect=true} = opts;
  var dfd = new $.Deferred();
  var pickerBuilder;
  var picker;

  GGRC.Controllers.GAPI
    .reAuthorize(gapi.auth.getToken())
    .done(()=>{
      gapi.load('picker', {callback: createPicker});
    })
    .fail(dfd.reject);

    // Create and render a Picker object for searching images.
  function createPicker() {
    GGRC.Controllers.GAPI.oauth_dfd.done(function (token, oauthUser) {
      var dialog;
      var view;

      pickerBuilder = new google.picker.PickerBuilder();

      if (pickFolder) {
        view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
          // .setMimeTypes(['application/vnd.google-apps.folder'])
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true);
        pickerBuilder.addView(view);
        pickerBuilder.setTitle('Select folder');
      } else {
        pickerBuilder
          .addView(new google.picker.DocsUploadView().setParent(parentId))
          .addView(google.picker.ViewId.DOCS);
          // .addView(new google.picker.DocsView().setParent(parentId));
        if (multiSelect) {
          pickerBuilder
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
        }
      }

      picker = pickerBuilder.setOAuthToken(gapi.auth.getToken().access_token)
            .setDeveloperKey(GGRC.config.GAPI_KEY)
            .setMaxItems(10)
            .setCallback(pickerCallback)
            .build();

      console.warn('Next two errors are expected.');
      picker.setVisible(true);

      dialog = GGRC.Utils.getPickerElement(picker);
      if (dialog) {
        dialog.style.zIndex = 4001; // our modals start with 2050
      }
    });
  }

    // A simple callback implementation.
  function pickerCallback(data) {
    var ACTION = google.picker.Response.ACTION;
    var CANCEL = google.picker.Action.CANCEL;
    var PICKED = google.picker.Action.PICKED;
    var DOCUMENTS = google.picker.Response.DOCUMENTS;
    var files;
    var err;
    var model = pickFolder ? CMS.Models.GDriveFolder : CMS.Models.GDriveFile;

    // sometimes pickerCallback is called with data == { action: 'loaded' }
    // which is not described in the Picker API Docs
    if ( data[ACTION] === PICKED || data[ACTION] === CANCEL ) {
     picker.dispose();
    }

    if (data[ACTION] === PICKED) {
      // adding a newUpload flag so we can later distinguish newly
      // uploaded files from the picked ones.
      // we cannot rely on the uploadState prop later on because a call to
      // the RefreshQueue will overwrite it.
      data[DOCUMENTS].forEach((file) => {
        file.newUpload = file.uploadState === 'success';
      });

      files = model.models(data[DOCUMENTS]);

      // NB: picker file object have different format then GDrive file objects
      // "name" <=> "title", "url" <=> "alternateLink"
      // RefreshQueue converts picker file objects into GDrive file objects

      return new RefreshQueue()
        .enqueue(files)
        .trigger()
        .then((files)=>{
          dfd.resolve(files);
        }, dfd.reject);
    } else if (data[ACTION] === CANCEL) {
      err = new Error('Canceled by user');
      err.type = GDRIVE_PICKER_ERR_CANCEL;
      dfd.reject(err);
    }
    // sometimes pickerCallback is called with data == { action: 'loaded' }
    // which is not described in the Picker API Docs
    if ( data[ACTION] === PICKED || data[ACTION] === CANCEL ) {
     picker.dispose();
    }
  }
  return dfd.promise();
}
