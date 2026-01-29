-- Ensure pgvector exists for embeddings / similarity search.
-- Scratch-safe / idempotent.
create extension if not exists "vector" with schema "extensions";
