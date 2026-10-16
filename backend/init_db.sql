-- Run this ONCE in Supabase: Project -> SQL Editor -> New query -> paste -> Run.
-- Enables the pgvector extension used later for the Legal Summarizer's RAG search (Day 4).
-- The regular tables (users, cases, courts, etc.) are created automatically
-- by the backend the first time it starts up -- you don't need to create those by hand.

CREATE EXTENSION IF NOT EXISTS vector;
