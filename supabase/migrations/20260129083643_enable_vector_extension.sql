-- Ensure pgvector exists for embeddings / similarity search.
-- Idempotent, and places extension in the "extensions" schema (Supabase convention).

do $$
begin
  create extension "vector" with schema "extensions";
exception
  when duplicate_object then null;
end
$$;
