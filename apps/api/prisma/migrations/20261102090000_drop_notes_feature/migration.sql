-- Drops the demo notes feature: the table, its indexes, and the pg_trgm
-- extension that only existed to make its substring search indexable.
DROP TABLE "notes";

DROP EXTENSION IF EXISTS "pg_trgm";
