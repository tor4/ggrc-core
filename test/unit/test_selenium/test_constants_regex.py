# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Module for testing constant regex expressions."""

import re

from lib.constants import regex


def test_url_to_widget_info_regex():
  """Test regex for parsing the source object name, source object id,
  widget name, mapped object name, mapped object id from URL."""
  urls = [
      ("https://grc-test.appspot.com/dashboard/",
          "dashboard", "", "", "", ""),
      ("https://grc-test.appspot.com/dashboard#data_asset/",
          "dashboard", "", "data_asset", "", ""),
      ("https://grc-test.appspot.com/data_assets/90#/requirement/90/",
          "data_assets", 90, "info", "requirement", 90),
      ("https://grc-test.appspot.com/data_assets/90#/",
          "data_assets", 90, "info", "", ""),
      ("https://grc-test.appspot.com/data_assets/90/",
          "data_assets", 90, "info", "", ""),
      ("https://grc-test.appspot.com/data_assets/90#data_asset/",
          "data_assets", 90, "data_asset", "", ""),
      ("https://grc-test.appspot.com/data_assets/90#info/",
          "data_assets", 90, "info", "", ""),
      ("https://grc-test.appspot.com/data_assets/107/",
          "data_assets", 107, "info", "", ""),
      ("https://grc-test.appspot.com/data_assets/107#task_group/",
          "data_assets", 107, "task_group", "", ""),
      (("https://grc-test.appspot.com/"
        "data_assets/107#info/workflow/107/"),
          "data_assets", 107, "info", "workflow", 107),
      ("https://grc-test.appspot.com/data_assets/107#/data_asset/107/",
          "data_assets", 107, "info", "data_asset", 107),
  ]

  for (url, expected_source_object_name, expected_source_object_id,
       expected_widget_name, expected_mapped_object_name,
       expected_mapped_object_id) in urls:
    (source_object_name, source_object_id, widget_name, mapped_object_name,
     mapped_object_id) = re.search(regex.URL_WIDGET_INFO, url).groups()

    if source_object_id:
      source_object_id = int(source_object_id)
    if mapped_object_id:
      mapped_object_id = int(mapped_object_id)
    if widget_name == "" and source_object_name != "dashboard":
      widget_name = "info"  # if '#' in URL without name

    assert (
        expected_source_object_name, expected_source_object_id,
        expected_widget_name, expected_mapped_object_name,
        expected_mapped_object_id) == (
        source_object_name, source_object_id, widget_name,
        mapped_object_name, mapped_object_id)
