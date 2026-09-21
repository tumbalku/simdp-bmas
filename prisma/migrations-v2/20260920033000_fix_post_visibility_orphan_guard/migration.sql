-- AFTER DELETE/UPDATE queries already see the resulting row set. Do not
-- subtract the deleted row a second time when counting remaining targets.
CREATE OR REPLACE FUNCTION prevent_orphaning_targeted_post()
RETURNS TRIGGER AS $$
DECLARE
  post_record RECORD;
  remaining_targets integer;
  target_post_id text;
BEGIN
  target_post_id := OLD."postId";

  SELECT status, "visibilityType" INTO post_record
  FROM "Post"
  WHERE id = target_post_id;

  IF post_record.status = 'PUBLISHED' AND post_record."visibilityType" = 'TARGETED' THEN
    SELECT
      (SELECT count(*) FROM "PostVisibilityRole" WHERE "postId" = target_post_id) +
      (SELECT count(*) FROM "PostVisibilityWorkplace" WHERE "postId" = target_post_id) +
      (SELECT count(*) FROM "PostVisibilityEmployeeGroup" WHERE "postId" = target_post_id) +
      (SELECT count(*) FROM "PostVisibilityUser" WHERE "postId" = target_post_id)
    INTO remaining_targets;

    IF remaining_targets = 0 THEN
      RAISE EXCEPTION 'Tidak dapat menghapus target terakhir dari post PUBLISHED TARGETED (postId=%)', target_post_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_orphaning_targeted_post() IS 'Prevents deletion or updates that would leave a PUBLISHED TARGETED post with zero visibility targets. Counts the post-operation target set in deferred AFTER triggers.';
