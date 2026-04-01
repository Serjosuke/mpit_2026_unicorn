from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.calendar_event import CalendarEvent
from src.models.user import User
from src.models.user_outlook_token import UserOutlookToken
from src.services.crypto import decrypt_text, encrypt_text

AUTH_BASE = "https://login.microsoftonline.com"


def _require_outlook_config() -> None:
    if not settings.outlook_client_id or not settings.outlook_client_secret:
        raise HTTPException(status_code=500, detail="Outlook integration is not configured")
    if not settings.outlook_token_encryption_key:
        raise HTTPException(status_code=500, detail="Outlook token encryption key is not configured")


def build_authorize_url(state: str) -> str:
    _require_outlook_config()
    query = urlencode(
        {
            "client_id": settings.outlook_client_id,
            "response_type": "code",
            "redirect_uri": settings.outlook_redirect_uri,
            "response_mode": "query",
            "scope": " ".join(settings.outlook_scopes),
            "state": state,
            "prompt": "select_account",
        }
    )
    return f"{AUTH_BASE}/{settings.outlook_tenant_id}/oauth2/v2.0/authorize?{query}"


def _token_endpoint() -> str:
    return f"{AUTH_BASE}/{settings.outlook_tenant_id}/oauth2/v2.0/token"


def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    _require_outlook_config()
    data = {
        "client_id": settings.outlook_client_id,
        "client_secret": settings.outlook_client_secret,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.outlook_redirect_uri,
        "scope": " ".join(settings.outlook_scopes),
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(_token_endpoint(), data=data)
    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"Outlook token exchange failed: {response.text}")
    return response.json()


def refresh_access_token(db: Session, token_row: UserOutlookToken) -> UserOutlookToken:
    _require_outlook_config()
    refresh_token = decrypt_text(token_row.refresh_token_encrypted)
    data = {
        "client_id": settings.outlook_client_id,
        "client_secret": settings.outlook_client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "redirect_uri": settings.outlook_redirect_uri,
        "scope": " ".join(settings.outlook_scopes),
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(_token_endpoint(), data=data)
    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"Outlook token refresh failed: {response.text}")
    payload = response.json()
    token_row.access_token_encrypted = encrypt_text(payload["access_token"])
    token_row.refresh_token_encrypted = encrypt_text(payload.get("refresh_token", refresh_token))
    token_row.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(payload.get("expires_in", 3600)) - 60)
    token_row.scope = payload.get("scope")
    db.add(token_row)
    db.flush()
    return token_row


def upsert_user_token_from_oauth(db: Session, user: User, token_payload: dict[str, Any], profile: dict[str, Any] | None = None) -> UserOutlookToken:
    _require_outlook_config()
    token_row = db.query(UserOutlookToken).filter(UserOutlookToken.user_id == user.id).one_or_none()
    if token_row is None:
        token_row = UserOutlookToken(
            user_id=user.id,
            access_token_encrypted=encrypt_text(token_payload["access_token"]),
            refresh_token_encrypted=encrypt_text(token_payload.get("refresh_token", token_payload["access_token"])),
            token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(token_payload.get("expires_in", 3600)) - 60),
            scope=token_payload.get("scope"),
        )
    else:
        token_row.access_token_encrypted = encrypt_text(token_payload["access_token"])
        token_row.refresh_token_encrypted = encrypt_text(token_payload.get("refresh_token", decrypt_text(token_row.refresh_token_encrypted)))
        token_row.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(token_payload.get("expires_in", 3600)) - 60)
        token_row.scope = token_payload.get("scope")
    db.add(token_row)

    if profile:
        user.outlook_email = profile.get("mail") or profile.get("userPrincipalName") or user.outlook_email
        db.add(user)

    db.flush()
    return token_row


def get_valid_access_token(db: Session, user_id: str) -> str | None:
    token_row = db.query(UserOutlookToken).filter(UserOutlookToken.user_id == user_id).one_or_none()
    if token_row is None:
        return None
    if token_row.token_expires_at <= datetime.now(timezone.utc) + timedelta(minutes=2):
        token_row = refresh_access_token(db, token_row)
    return decrypt_text(token_row.access_token_encrypted)


def fetch_graph_me(access_token: str) -> dict[str, Any]:
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            f"{settings.outlook_graph_base_url}/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"Outlook profile fetch failed: {response.text}")
    return response.json()


def create_graph_event(db: Session, user_id: str, event: CalendarEvent) -> CalendarEvent:
    access_token = get_valid_access_token(db, user_id)
    if not access_token:
        event.sync_provider = "internal"
        event.sync_status = "not_connected"
        return event

    payload = {
        "subject": event.title,
        "body": {"contentType": "text", "content": event.description or event.title},
        "start": {"dateTime": event.starts_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "UTC"} if event.starts_at else None,
        "end": {"dateTime": event.ends_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "UTC"} if event.ends_at else None,
        "location": {"displayName": event.location or "Alrosa LearnFlow"},
        "allowNewTimeProposals": True,
        "transactionId": str(event.id),
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{settings.outlook_graph_base_url}/me/events",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json=payload,
        )
    if response.status_code >= 400:
        event.sync_provider = "outlook"
        event.sync_status = f"sync_failed:{response.status_code}"
        return event

    graph_event = response.json()
    event.sync_provider = "outlook"
    event.sync_status = "synced"
    event.external_event_id = graph_event.get("id")
    event.meeting_url = graph_event.get("webLink")
    event.location = (graph_event.get("location") or {}).get("displayName") or event.location
    return event
