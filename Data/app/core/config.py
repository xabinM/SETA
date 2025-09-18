from functools import lru_cache
from pydantic_settings import BaseSettings 
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    API_TITLE: str = "SETA ML API"
    API_VERSION: str = "1.0.0"

    # FastAPI 서버 설정
    API_HOST: str = Field("0.0.0.0", env="API_HOST")
    API_PORT: int = Field(8000, env="API_PORT")
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")

    # Elasticsearch
    ELASTICSEARCH_URL: str = Field("http://elasticsearch:9200", env="ELASTICSEARCH_URL")
    EMBED_INDEX_NAME: str = Field("user_memory_embedding", env="EMBED_INDEX_NAME")

    # Embedding
    EMBEDDING_MODEL_PATH: str = Field("/opt/models/embedding", env="EMBEDDING_MODEL_PATH")
    EMBED_DIMS: int = Field(768, env="EMBED_DIMS")

    # GPT(GMS)
    GMS_API_URL: str = Field(..., env="GMS_API_URL")
    GMS_API_KEY: str = Field(..., env="GMS_API_KEY")

    # Redis (필요 시)
    REDIS_HOST: str = Field("redis", env="REDIS_HOST")
    REDIS_PORT: int = Field(6379, env="REDIS_PORT")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")

    # Postgres
    POSTGRES_HOST: str = Field("localhost", env="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(5432, env="POSTGRES_PORT")
    POSTGRES_USER: str = Field("postgres", env="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field("password", env="POSTGRES_PASSWORD")
    POSTGRES_DB: str = Field("postgres", env="POSTGRES_DB")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
