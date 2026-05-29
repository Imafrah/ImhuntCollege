CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "College_name_trgm_idx" ON "College" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "College_city_trgm_idx" ON "College" USING GIN ("city" gin_trgm_ops);
