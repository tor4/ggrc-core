# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Handlers document entries."""

from logging import getLogger
from ggrc import db
from ggrc.models import all_models
from ggrc.converters import errors
from ggrc.converters.handlers import handlers
from ggrc.login import get_current_user_id


# pylint: disable=invalid-name
logger = getLogger(__name__)


class DocumentReferenceUrlHandler(handlers.ColumnHandler):
  """Base class for document documents handlers."""

  KIND = all_models.Document.REFERENCE_URL

  @staticmethod
  def _parse_line(line):
    """Parse a single line and return link and title.

    Args:
      line: string containing a single line from a cell.

    Returns:
      tuple containing a link and a title.
    """
    return [line.strip()] * 2

  def get_value(self):
    """Generate a new line separated string for all document links.

    Returns:
      string containing all URLs
    """
    return "\n".join(doc.link for doc in
                     self.row_converter.obj.documents_reference_url)

  def build_document(self, link, title, user_id):
    """Build document object"""
    document = all_models.Document(
        link=link,
        title=title,
        modified_by_id=user_id,
        context=self.row_converter.obj.context,
        kind=self.KIND,
    )
    document.add_admin_role(with_commit=False)
    return document

  def parse_item(self):
    """Parse document link lines.

    Returns:
      list of documents for all URLs and evidences.
    """
    new_links = set()
    duplicate_new_links = set()

    documents = []
    user_id = get_current_user_id()

    for line in self.raw_value.splitlines():
      link, title = self._parse_line(line)
      if not (link and title):
        continue

      if link in new_links:
        duplicate_new_links.add(link)
      else:
        new_links.add(link)
        documents.append(self.build_document(link, title, user_id))

    if duplicate_new_links:
      # NOTE: We rely on the fact that links in duplicate_new_links are all
      # instances of unicode (if that assumption breaks, unicode encode/decode
      # errors can occur for non-ascii link values)
      self.add_warning(errors.DUPLICATE_IN_MULTI_VALUE,
                       column_name=self.display_name,
                       duplicates=u", ".join(sorted(duplicate_new_links)))

    return documents

  def set_obj_attr(self):
    self.value = self.parse_item()

  def set_value(self):
    """This should be ignored with second class attributes."""

  def _get_old_map(self):
    return {d.link: d for d in self.row_converter.obj.documents_reference_url}

  def remove_relationship(self, relationships, extract_func):
    """Remove relationship if parent == counterparty, return True if removed"""
    parent = self.row_converter.obj
    for rel in relationships:
      if extract_func(rel) == parent:
        db.session.delete(rel)
        return True
    return False

  def insert_object(self):
    """Update document Reference URL values

    This function adds missing URLs and remove existing ones from Documents.
    """
    if self.row_converter.ignore:
      return

    new_link_map = {d.link: d for d in self.value}
    old_link_map = self._get_old_map()

    parent = self.row_converter.obj
    for new_link, new_doc in new_link_map.iteritems():
      if new_link not in old_link_map:
        all_models.Relationship(source=parent,
                                destination=new_doc)

    for old_link, old_doc in old_link_map.iteritems():
      if old_link in new_link_map:
        continue

      if not (self.remove_relationship(old_doc.related_destinations,
                                       lambda x: x.destination) or
              self.remove_relationship(old_doc.related_sources,
                                       lambda x: x.source)):
        logger.warning("Invalid relationship state for document URLs.")


class DocumentFileHandler(DocumentReferenceUrlHandler):
  """Handler for Document File field on document imports."""

  KIND = all_models.Document.FILE

  def parse_item(self):
    """Is not allowed to import document of type File

    if file already mapped to parent we ignore it and not show warning
    """
    if self.raw_value:
      parent = self.row_converter.obj
      existing_doc_file_links = {doc.link for doc in parent.documents_file}
      for line in self.raw_value.splitlines():
        link, _ = self._parse_line(line)
        if link not in existing_doc_file_links:
          self.add_warning(errors.DISALLOW_DOCUMENT_FILE, parent=parent.type)
    return []

  def insert_object(self):
    """Import not allowed"""
    return []

  @staticmethod
  def _parse_line(line):
    """Parse a single line and return link and title.

    Args:
      line: string containing a single line from a cell.

    Returns:
      tuple containing a link and a title.
    """
    parts = line.strip().split()
    return parts[0], parts[0] if len(parts) == 1 else " ".join(parts[1:])

  def get_value(self):
    """Generate a new line separated string for all document links.

    Returns:
      string containing all evidence URLs and titles.
    """
    return u"\n".join(u"{} {}".format(d.link, d.title) for d in
                      self.row_converter.obj.documents_file)
