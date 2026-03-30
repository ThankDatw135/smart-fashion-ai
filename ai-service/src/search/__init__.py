"""
Search Module — AI Search (Hybrid SQL + pgvector).

Components:
- embedding_service: Quản lý sentence-transformers model + pgvector
- search_service: Hybrid search logic (NLP parse + SQL + vector + rank)
- search_router: API endpoints (/api/search, /api/search/suggest)
- product_consumer: RabbitMQ consumer cho product embedding pipeline
"""
