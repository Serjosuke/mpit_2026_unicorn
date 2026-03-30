from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Alrosa LearnFlow"
    env: str = "dev"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str
    db_sslmode: str = "require"

    jwt_secret: str
    jwt_alg: str = "HS256"
    access_token_expire_minutes: int = 120

    next_public_api_base_url: str = "http://localhost:8000"

    first_superuser_email: str = "admin@alrosa.local"
    first_superuser_password: str = "Admin12345!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


settings = Settings()
