import os
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = os.getenv("APP_NAME", "Tree Visualization AI")
    DEBUG: bool = os.getenv("DEBUG", "True") == "True"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres.evxziobvxydsugazcmjn:Mukesh%405344@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres")
    ASYNC_DATABASE_URL: str = os.getenv("ASYNC_DATABASE_URL", "postgresql+asyncpg://postgres.evxziobvxydsugazcmjn:Mukesh%405344@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    DEPLOY_ENV: str = os.getenv("DEPLOY_ENV", "cloud")
    GEMINI_API_KEY : str = os.getenv("GEMINI_API_KEY", "AIzaSyBYjrkoMVkASo43MrD7rklKem_PLP29sQo")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://localhost:8080,https://localhost:8080,http://ec2-13-54-127-161.ap-southeast-2.compute.amazonaws.com:8080"
    ).split(",")
    ALLOWED_ORIGIN_REGEX: str | None = os.getenv("ALLOWED_ORIGIN_REGEX") or None
    class Config:
        env_file = ".env"
        case_sensitive = True

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        # Accept JSON array or comma separated string
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # If JSON-like list
            if v.strip().startswith("["):
                try:
                    import json
                    return json.loads(v)
                except Exception:
                    pass
            return [s.strip() for s in v.split(",") if s.strip()]
        return []

settings = Settings()
