-- Add POST value to the NotificationRelatedEntityType enum so announcement
-- notifications can link back to the Post they refer to.
--
-- PostgreSQL 12+ supports adding enum values inside a transaction block, so
-- this migration is safe to run through `prisma migrate deploy`.
-- IF NOT EXISTS keeps the migration idempotent for environments that already
-- applied it (e.g. re-played disposable databases).

ALTER TYPE "NotificationRelatedEntityType" ADD VALUE IF NOT EXISTS 'POST';
