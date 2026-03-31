from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import JWTError
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.core.config import settings
from src.core.security import create_signed_state, decode_signed_state
from src.db.deps import DBSession
from src.models.calendar_event import CalendarEvent
from src.models.user import User
from src.models.user_outlook_token import UserOutlookToken
from src.schemas.calendar import CalendarEventOut
from src.services.outlook_graph import build_authorize_url, exchange_code_for_tokens, fetch_graph_me, upsert_user_token_from_oauth
from src.services.audit import write_audit

router = APIRouter()


@router.get("/mine", response_model=list[CalendarEventOut])
def my_calendar_events(db: DBSession, current_user: User = Depends(get_current_user)):
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == current_user.id).order_by(CalendarEvent.starts_at.desc().nullslast(), CalendarEvent.created_at.desc())
    return list(db.scalars(stmt).all())


@router.get("/user/{user_id}", response_model=list[CalendarEventOut])
def user_calendar_events(user_id: str, db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == user_id).order_by(CalendarEvent.starts_at.desc().nullslast(), CalendarEvent.created_at.desc())
    return list(db.scalars(stmt).all())


@router.get("/outlook/status")
def outlook_status(db: DBSession, current_user: User = Depends(get_current_user)):
    token_row = db.scalar(select(UserOutlookToken).where(UserOutlookToken.user_id == current_user.id))
    return {
        "connected": token_row is not None,
        "outlook_email": current_user.outlook_email,
        "expires_at": token_row.token_expires_at if token_row else None,
        "scopes": token_row.scope.split() if token_row and token_row.scope else settings.outlook_scopes,
        "configured": bool(settings.outlook_client_id and settings.outlook_client_secret and settings.outlook_token_encryption_key),
    }


@router.get("/outlook/connect-url")
def outlook_connect_url(current_user: User = Depends(get_current_user)):
    state = create_signed_state({"user_id": str(current_user.id)})
    return {"authorize_url": build_authorize_url(state)}


@router.get("/outlook/callback")
def outlook_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: DBSession = None,
    error_description: str | None = None,
):
    def _redirect(path: str, **params: str):
        query = urlencode(params)
        separator = "&" if "?" in path else "?"
        return RedirectResponse(
            url=f"{settings.frontend_base_url}{path}{separator}{query}"
            if query
            else f"{settings.frontend_base_url}{path}"
        )

    if error:
        return _redirect(
            settings.outlook_connect_error_path,
            reason=error,
            detail=error_description or "OAuth error",
        )
    if not code or not state:
        return _redirect(settings.outlook_connect_error_path, reason="missing_code")
    try:
        payload = decode_signed_state(state)
        if payload.get("purpose") != "outlook_oauth_state":
            raise ValueError("bad purpose")
    except (JWTError, ValueError):
        return _redirect(settings.outlook_connect_error_path, reason="invalid_state")

    user = db.get(User, payload.get("user_id"))
    if not user:
        return _redirect(settings.outlook_connect_error_path, reason="user_not_found")

    token_payload = exchange_code_for_tokens(code)
    profile = fetch_graph_me(token_payload["access_token"])
    upsert_user_token_from_oauth(db, user, token_payload, profile)
    write_audit(
        db,
        user.id,
        "outlook_connect",
        "user",
        user.id,
        None,
        {"outlook_email": user.outlook_email},
    )
    db.commit()
    return _redirect(settings.outlook_connect_success_path)


@router.post("/outlook/disconnect")
def outlook_disconnect(db: DBSession, current_user: User = Depends(get_current_user)):
    token_row = db.scalar(select(UserOutlookToken).where(UserOutlookToken.user_id == current_user.id))
    if token_row:
        db.delete(token_row)
        write_audit(db, current_user.id, "outlook_disconnect", "user", current_user.id, None, None)
        db.commit()
    return {"ok": True}
