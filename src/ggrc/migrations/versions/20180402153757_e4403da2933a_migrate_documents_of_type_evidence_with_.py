# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate documents of type Evidence with invalid gdrive URLs to document.URL
Rename document.kind.Evidence to document.kind.FILE We need it to not confuse
developers after introducing Evidence object

Create Date: 2018-04-02 15:37:57.922876
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from sqlalchemy.sql import text
from alembic import op


# revision identifiers, used by Alembic.
revision = 'e4403da2933a'
down_revision = '082306b17b07'


def get_audit_docs_ids(connection):
  """Return list of id of Audit scope documents"""
  sql = """
  SELECT distinct d.id
    FROM
      documents as d
    JOIN relationships as r
      ON r.destination_id = d.id
    WHERE
      r.destination_type = 'Document' AND
      d.document_type in ('EVIDENCE', 'REFERENCE_URL') AND
      r.source_type ='Audit'
    UNION ALL
    SELECT
        d.id
    FROM
      documents as d
    JOIN relationships as r
      ON r.source_id = d.id
    WHERE
      r.source_type = 'Document' AND
      d.document_type in ('EVIDENCE', 'REFERENCE_URL') AND
      r.destination_type ='Audit'
  """
  res = connection.execute(text(sql)).fetchall()
  return [i.id for i in res]


def migrate_docs(connection):
  """Migrate domuments.FILE to domuments.URL"""
  audit_doc_ids = get_audit_docs_ids(connection)
  assessment_doc_ids = get_assessment_docs_ids(connection)
  invalid_gdrive_url_doc_ids = get_invalid_gdrive_url_doc_ids(connection)
  doc_ids = audit_doc_ids + assessment_doc_ids + invalid_gdrive_url_doc_ids

  if doc_ids:
    sql = """
      UPDATE documents SET document_type = 'URL'
      WHERE id IN :doc_ids
    """
    connection.execute(text(sql), doc_ids=doc_ids)


def get_assessment_docs_ids(connection):
  """List of document id's mapped to assessment"""
  sql = """
    SELECT  distinct d.id
      FROM
        documents as d
      JOIN relationships as r
        ON r.destination_id = d.id
      WHERE
        r.destination_type = 'Document' AND
        d.document_type  = 'REFERENCE_URL' AND
        r.source_type ='Assessment'
      UNION ALL
      SELECT
          d.id
      FROM
        documents as d
      JOIN relationships as r
        ON r.source_id = d.id
      WHERE
        r.source_type = 'Document' AND
        d.document_type = 'REFERENCE_URL' AND
        r.destination_type ='Assessment'
  """
  res = connection.execute(text(sql)).fetchall()
  return [i.id for i in res]


def get_invalid_gdrive_url_doc_ids(connection):
  """Id's of documents with invalid link"""
  sql = """
  SELECT
    d.id
  FROM
    documents as d
  JOIN relationships as r
    ON r.destination_id = d.id
  JOIN assessments a
    ON a.id=r.source_id
  WHERE
    r.destination_type = 'Document' AND
    d.document_type  = 'EVIDENCE' AND LOCATE('?id=',d.link)=0 AND
      LOCATE('/d/',d.link)=0 AND
      r.source_type ='Assessment'
  UNION ALL
  SELECT
      d.id
  FROM
    documents as d
  JOIN relationships as r
    ON r.source_id = d.id
  JOIN assessments a
    ON a.id=r.destination_id
  WHERE
    r.source_type = 'Document' AND
    d.document_type = 'EVIDENCE' and LOCATE('?id=',d.link)=0 AND
      LOCATE('/d/',d.link)=0 AND
      r.destination_type ='Assessment'
  """
  res = connection.execute(text(sql)).fetchall()
  return [i.id for i in res]


def rename_doc_fields():
  """Rename document_type.EVIDENCE -> kind.FILE"""
  op.execute("""
      ALTER TABLE documents CHANGE
        document_type kind enum('URL','FILE','REFERENCE_URL', 'EVIDENCE')
          NOT NULL DEFAULT 'URL';
  """)
  op.execute('SET SESSION SQL_SAFE_UPDATES = 0')
  op.execute("UPDATE documents SET kind = 'FILE' where kind = 'EVIDENCE'")

  op.execute("""
      ALTER TABLE documents MODIFY
        kind enum('URL','FILE','REFERENCE_URL') NOT NULL DEFAULT 'URL';
  """)


def run_migration(connection):
  """Run migration"""
  migrate_docs(connection)
  rename_doc_fields()


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  run_migration(connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("""
      ALTER TABLE documents CHANGE
        kind document_type enum('URL','FILE','REFERENCE_URL', 'EVIDENCE')
          NOT NULL DEFAULT 'URL';
  """)
  op.execute('SET SESSION SQL_SAFE_UPDATES = 0')
  op.execute("UPDATE documents SET document_type='EVIDENCE'"
             " WHERE document_type='FILE'")
  op.execute("""
      ALTER TABLE documents MODIFY
         document_type enum('URL','EVIDENCE','REFERENCE_URL') NOT NULL
         DEFAULT 'URL';
  """)
