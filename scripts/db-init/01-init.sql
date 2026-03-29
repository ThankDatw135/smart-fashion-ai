-- ========================================
-- Smart Fashion AI — Database Initialization
-- ========================================
-- Tập tin này tự động chạy khi PostgreSQL container khởi tạo lần đầu.
-- Nó kích hoạt pgvector extension để hỗ trợ vector search cho AI features.
-- ========================================

-- Kích hoạt pgvector extension cho vector similarity search
-- Dùng cho: AI Search, Product Embeddings, Recommendation Engine
CREATE EXTENSION IF NOT EXISTS vector;

-- Kích hoạt uuid-ossp cho UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kích hoạt pg_trgm cho fuzzy text search (trigram matching)
-- Dùng cho: Search autocomplete, typo tolerance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Kích hoạt unaccent cho Vietnamese diacritics handling
-- Dùng cho: Tìm kiếm tiếng Việt không dấu
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Xác nhận extensions đã được cài đặt
DO $$
BEGIN
    RAISE NOTICE '✅ pgvector extension installed: %', (SELECT extversion FROM pg_extension WHERE extname = 'vector');
    RAISE NOTICE '✅ uuid-ossp extension installed: %', (SELECT extversion FROM pg_extension WHERE extname = 'uuid-ossp');
    RAISE NOTICE '✅ pg_trgm extension installed: %', (SELECT extversion FROM pg_extension WHERE extname = 'pg_trgm');
    RAISE NOTICE '✅ unaccent extension installed: %', (SELECT extversion FROM pg_extension WHERE extname = 'unaccent');
    RAISE NOTICE '🎉 Smart Fashion AI database initialized successfully!';
END $$;
