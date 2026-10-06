-- Multer puede interpretar como Latin-1 los nombres UTF-8 enviados en
-- multipart/form-data. Repara únicamente los registros con señales de mojibake.
CREATE OR REPLACE FUNCTION repair_mojibake_filename(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~ '[ÃÂâ]' THEN
    RETURN value;
  END IF;

  RETURN convert_from(convert_to(value, 'LATIN1'), 'UTF8');
EXCEPTION WHEN character_not_in_repertoire THEN
  RETURN value;
END;
$$;

UPDATE submissions
   SET document_name = repair_mojibake_filename(document_name)
 WHERE document_name ~ '[ÃÂâ]';

UPDATE submission_documents
   SET document_name = repair_mojibake_filename(document_name)
 WHERE document_name ~ '[ÃÂâ]';

UPDATE research_annexes
   SET document_name = repair_mojibake_filename(document_name)
 WHERE document_name ~ '[ÃÂâ]';

UPDATE qualification_cycles
   SET correction_document_name = repair_mojibake_filename(correction_document_name)
 WHERE correction_document_name ~ '[ÃÂâ]';

DROP FUNCTION repair_mojibake_filename(TEXT);
