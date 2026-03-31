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
    frontend_base_url: str = "http://localhost:3000"

    first_superuser_email: str = "admin@alrosa.com"
    first_superuser_password: str = "Admin12345!"

    outlook_client_id: str | None = None
    outlook_client_secret: str | None = None
    outlook_tenant_id: str = "common"
    outlook_redirect_uri: str = "http://localhost:8000/api/v1/calendar/outlook/callback"
    outlook_scopes: list[str] = ["offline_access", "openid", "profile", "User.Read", "Calendars.ReadWrite"]
    outlook_token_encryption_key: str | None = None
    outlook_graph_base_url: str = "https://graph.microsoft.com/v1.0"
    outlook_connect_success_path: str = "/calendar?outlook=connected"
    outlook_connect_error_path: str = "/calendar?outlook=error"
    outlook_sync_enabled: bool = True

    openai_api_key: str | None = None
    openai_model: str = "gpt-5.4-mini"
    openai_search_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                import json
                return json.loads(value)
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("outlook_scopes", mode="before")
    @classmethod
    def parse_scopes(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                import json
                return json.loads(value)
            return [item.strip() for item in value.split() if item.strip()]
        return value


settings = Settings()
