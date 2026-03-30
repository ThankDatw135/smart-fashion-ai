from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Fashion AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Database (PostgreSQL + pgvector)
    DATABASE_URL: str  # postgresql+asyncpg://...
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    
    # Redis
    REDIS_URL: str  # redis://:password@localhost:6379/1
    
    # RabbitMQ
    RABBITMQ_URL: str  # amqp://user:pass@localhost:5672/sf_vhost
    
    # Google Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Embedding
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    EMBEDDING_DIM: int = 384
    
    # Backend API
    BACKEND_API_URL: str = "http://localhost:3001/api/v1"
    
    # Chat
    CHAT_HISTORY_REDIS_TTL: int = 3600  # 1 hour
    CHAT_MAX_MESSAGES: int = 50
    CHAT_CONTEXT_MAX_TOKENS: int = 8000
    CHAT_RATE_LIMIT: int = 20  # msgs/min/user

    # Search
    SEARCH_CACHE_TTL: int = 300  # 5 phút
    SEARCH_MAX_RESULTS: int = 20
    SEARCH_SUGGEST_LIMIT: int = 5

    # Recommendation
    RECOMMENDATION_CACHE_TTL: int = 86400  # 24 giờ
    RECOMMENDATION_RETRAIN_HOUR: int = 2  # 2AM

    # Celery
    CELERY_BROKER_URL: str = "redis://:smartfashion_redis@localhost:6379/2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()
