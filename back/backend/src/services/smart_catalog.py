from __future__ import annotations

from difflib import SequenceMatcher
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.course import Course
from src.services.external_course_search import search_external_courses


def normalize_query(query: str) -> dict:
    q = query.lower().strip()
    level = None
    for token in ["junior", "middle", "mid", "senior", "jun", "мидл", "джун", "сеньор"]:
        if token in q:
            level = {"mid": "middle", "мидл": "middle", "jun": "junior", "джун": "junior", "сеньор": "senior"}.get(token, token)
            break
    tags: list[str] = []
    for token in ["java", "python", "sql", "коммуникация", "переговор", "soft", "skills", "backend", "frontend", "android", "react", "devops", "go", "аналитик", "manager", "менеджер"]:
        if token in q:
            tags.append(token)
    category = "soft_skills" if any(t in q for t in ["soft", "коммуника", "переговор", "конфликт", "менедж"]) else "programming"
    return {"raw": query, "level": level, "tags": tags, "category": category}


def _score_text(query: str, texts: Iterable[str]) -> float:
    query = query.lower().strip()
    text = " ".join(t.lower() for t in texts if t)
    if not query or not text:
        return 0.0
    ratio = SequenceMatcher(None, query, text).ratio()
    contains_bonus = 0.25 if query in text else 0
    token_bonus = sum(0.08 for token in query.split() if token in text)
    return ratio + contains_bonus + token_bonus


def _course_row(course: Course, query: str, normalized: dict) -> dict:
    score = _score_text(query, [course.title, course.description or "", course.summary or "", course.skill_tags or "", course.level or "", course.provider_name or "", course.position_title if hasattr(course, "position_title") else ""])
    if course.course_type == "internal":
        score += 0.45
    if course.is_featured_internal:
        score += 0.35
    if normalized.get("level") and course.level and course.level.lower() == normalized["level"]:
        score += 0.15
    why = "Внутренний курс Алроса с приоритетом в расписании." if course.course_type == "internal" else "Рекомендовано HR и поднято выше в выдаче." if course.is_featured_internal else "Сохраненный внешний курс в каталоге компании."
    return {
        "source_type": course.course_type,
        "title": course.title,
        "provider_name": course.provider_name or "ALROSA LearnFlow",
        "provider_url": course.provider_url,
        "summary": course.summary or course.description,
        "description": course.description,
        "level": course.level,
        "delivery_mode": course.delivery_mode,
        "duration_hours": float(course.duration_hours) if course.duration_hours is not None else None,
        "price_amount": float(course.price_amount) if course.price_amount is not None else None,
        "price_currency": course.price_currency,
        "freshness_label": "рекомендовано HR" if course.is_featured_internal and course.course_type != "internal" else "внутренний приоритет" if course.course_type == "internal" else "каталог компании",
        "score": round(score, 4),
        "why_recommended": why,
        "course_id": course.id,
        "is_internal_priority": course.course_type == "internal",
        "is_recommended": bool(course.is_featured_internal),
        "tags": [t.strip() for t in (course.skill_tags or "").split(",") if t.strip()],
    }


def search_catalog(db: Session, query: str, audience_role: str | None = None, limit: int = 14) -> tuple[dict, list[dict]]:
    nq = normalize_query(query)
    db_courses = list(db.scalars(select(Course).where(Course.status == "published").order_by(Course.source_priority.asc(), Course.created_at.desc())).all())
    rows = [_course_row(course, query, nq) for course in db_courses]
    live_rows, meta = search_external_courses(query, audience_role=audience_role, limit=limit)
    for item in live_rows:
        score = _score_text(query, [item.get("title") or "", item.get("summary") or "", item.get("description") or "", " ".join(item.get("tags") or []), item.get("level") or "", item.get("provider_name") or ""])
        if nq.get("level") and item.get("level") and str(item.get("level")).lower() == nq["level"]:
            score += 0.15
        rows.append({
            "source_type": item.get("source_type", "external_live"),
            "title": item.get("title"),
            "provider_name": item.get("provider_name"),
            "provider_url": item.get("provider_url"),
            "summary": item.get("summary"),
            "description": item.get("description"),
            "level": item.get("level"),
            "delivery_mode": item.get("delivery_mode") or "online",
            "duration_hours": item.get("duration_hours"),
            "price_amount": item.get("price_amount"),
            "price_currency": item.get("price_currency"),
            "freshness_label": item.get("freshness_label") or "внешний поиск",
            "score": round(score + 0.1, 4),
            "why_recommended": item.get("why_recommended") or "Найдено по внешнему поиску курсов.",
            "course_id": None,
            "is_internal_priority": False,
            "is_recommended": False,
            "tags": item.get("tags") or [],
        })
    rows.sort(key=lambda x: (x.get("is_internal_priority", False), x.get("is_recommended", False), x["score"]), reverse=True)
    nq["provider"] = meta.get("provider")
    return nq, rows[:limit]
