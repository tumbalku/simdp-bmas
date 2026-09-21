CREATE OR REPLACE FUNCTION prevent_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'VerificationHistory'
     AND TG_OP = 'DELETE'
     AND current_setting('app.allow_verification_history_purge', true) = 'on' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_mutation() IS 'Protects audit tables from mutation while permitting the scoped verification-history purge required by an authorized permanent document deletion transaction.';
