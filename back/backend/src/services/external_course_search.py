from __future__ import annotations

import json
from typing import Any

import httpx

from src.core.config import settings

ROLE_CATALOG = [
    "Android-разработчик",
    "React-разработчик",
    "Автоматизатор тестирования на Java",
    "Специалист по информационной безопасности",
    "Продуктовый маркетолог",
    "Дизайнер интерфейсов",
    "Продакт-менеджер",
    "Java-разработчик",
    "DevOps-инженер",
    "Фронтенд-разработчик",
    "Бэкенд-разработчик",
    "Продвинутый Go-разработчик",
    "Архитектор программного обеспечения",
    "Аналитик данных",
    "Менеджер проектов",
    "Руководитель команды",
    "HR / L&D менеджер",
]

FALLBACK = [
    {
        "title": "Frontend-разработчик",
        "provider_name": "Яндекс Практикум",
        "provider_url": "https://practicum.yandex.ru/",
        "summary": "Практика по HTML, CSS, JavaScript, TypeScript и React.",
        "description": "Подойдет сотрудникам frontend/fullstack направления и тем, кто хочет системно закрыть базу и практику.",
        "level": "middle",
        "delivery_mode": "online",
        "duration_hours": 280,
        "price_amount": 98000,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["frontend", "react", "typescript"],
        "difficulty": "medium",
        "average_rating": 4.7,
        "ai_rating": 4.8,
        "ai_review": "Хороший вариант для практической прокачки фронтенда и портфолио-проектов.",
    },
    {
        "title": "Java-разработчик",
        "provider_name": "Яндекс Практикум",
        "provider_url": "https://practicum.yandex.ru/",
        "summary": "Backend-подготовка по Java, Spring и сервисной разработке.",
        "description": "Подходит backend-командам и инженерам, которым нужен системный маршрут по Java.",
        "level": "middle",
        "delivery_mode": "online",
        "duration_hours": 320,
        "price_amount": 112000,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["java", "backend", "spring"],
        "difficulty": "hard",
        "average_rating": 4.6,
        "ai_rating": 4.7,
        "ai_review": "Сильный трек для тех, кому нужен упор именно на backend-практику.",
    },
    {
        "title": "Python для анализа данных",
        "provider_name": "Stepik",
        "provider_url": "https://stepik.org/",
        "summary": "Курс по Python, pandas и основам аналитики данных.",
        "description": "Хороший вход для аналитиков, инженеров и продуктовых ролей, которым нужен прикладной Python.",
        "level": "junior",
        "delivery_mode": "online",
        "duration_hours": 72,
        "price_amount": 0,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["python", "data", "analytics"],
        "difficulty": "easy",
        "average_rating": 4.8,
        "ai_rating": 4.6,
        "ai_review": "Сильный бюджетный вариант, когда важны базовые навыки и быстрый старт.",
    },
    {
        "title": "DevOps практики",
        "provider_name": "OTUS",
        "provider_url": "https://otus.ru/",
        "summary": "CI/CD, контейнеры, Kubernetes, мониторинг и эксплуатация.",
        "description": "Для DevOps, platform и backend-команд, которым нужен практический production-фокус.",
        "level": "middle",
        "delivery_mode": "online",
        "duration_hours": 180,
        "price_amount": 89000,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["devops", "docker", "kubernetes"],
        "difficulty": "hard",
        "average_rating": 4.7,
        "ai_rating": 4.8,
        "ai_review": "Один из самых прикладных вариантов для инфраструктурных и platform-задач.",
    },
    {
        "title": "Продуктовый менеджер",
        "provider_name": "Нетология",
        "provider_url": "https://netology.ru/",
        "summary": "Основы product management, discovery, метрики и roadmap.",
        "description": "Для продактов, project-менеджеров и тимлидов, которым нужен системный взгляд на продукт.",
        "level": "middle",
        "delivery_mode": "online",
        "duration_hours": 140,
        "price_amount": 76000,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["product", "management", "metrics"],
        "difficulty": "medium",
        "average_rating": 4.5,
        "ai_rating": 4.6,
        "ai_review": "Сбалансированный вариант для развития продуктового мышления и управленческих навыков.",
    },
    {
        "title": "Переговоры и коммуникация",
        "provider_name": "Skillbox",
        "provider_url": "https://skillbox.ru/",
        "summary": "Коммуникации, переговоры, сложные диалоги и презентация идей.",
        "description": "Подходит HR, L&D, менеджерам и сотрудникам кросс-функциональных ролей.",
        "level": "all",
        "delivery_mode": "online",
        "duration_hours": 24,
        "price_amount": 32000,
        "price_currency": "RUB",
        "freshness_label": "российский каталог",
        "tags": ["soft skills", "communication", "management"],
        "difficulty": "easy",
        "average_rating": 4.4,
        "ai_rating": 4.5,
        "ai_review": "Полезный короткий трек для сотрудников, которым важны переговоры и взаимодействие с командами.",
    },
]


def role_suggestions(query: str | None = None) -> list[str]:
    if not query:
        return ROLE_CATALOG
    q = query.lower().strip()
    return [item for item in ROLE_CATALOG if q in item.lower()] or ROLE_CATALOG


def _fallback_results(query: str) -> list[dict[str, Any]]:
    q = query.lower().strip()
    out = []
    for item in FALLBACK:
        hay = " ".join([item["title"], item["summary"], item["description"], " ".join(item["tags"])]).lower()
        if not q or any(token in hay for token in q.split()):
            out.append(item | {"source_type": "external_live", "score": 0.66, "why_recommended": "Резервная подборка по российским платформам обучения."})
    return out[:12] if out else [item | {"source_type": "external_live", "score": 0.5, "why_recommended": "Резервная внешняя подборка."} for item in FALLBACK[:8]]


def search_external_courses(query: str, audience_role: str | None = None, limit: int = 12) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    meta = {"provider": "fallback", "model": None}
    if not settings.openai_search_enabled or not settings.openai_api_key:
        return _fallback_results(query)[:limit], meta
    instructions = (
        "Ты помогаешь искать реальные существующие онлайн-курсы для корпоративного LMS. "
        "Приоритет — российские образовательные платформы и страницы курсов: Яндекс Практикум, Stepik, Нетология, OTUS, Skillbox, Skillfactory и похожие. "
        "Нужно вернуть JSON-массив courses по свежим страницам курсов в интернете. "
        "Для каждого курса верни: title, provider_name, provider_url, summary, description, level, delivery_mode, duration_hours, price_amount, price_currency, freshness_label, tags, difficulty, average_rating, ai_rating, ai_review. "
        "Если точных данных о цене или рейтинге нет, ставь null. difficulty только easy/medium/hard. ai_rating от 1 до 5. Все summaries и ai_review на русском."
    )
    payload = {
        "model": settings.openai_model,
        "instructions": instructions,
        "input": f"Запрос: {query}\nРоль пользователя: {audience_role or 'all'}\nЛимит: {limit}",
        "tools": [{"type": "web_search_preview"}],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "course_search_results",
                "schema": {
                    "type": "object",
                    "properties": {
                        "courses": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "provider_name": {"type": "string"},
                                    "provider_url": {"type": ["string", "null"]},
                                    "summary": {"type": ["string", "null"]},
                                    "description": {"type": ["string", "null"]},
                                    "level": {"type": ["string", "null"]},
                                    "delivery_mode": {"type": ["string", "null"]},
                                    "duration_hours": {"type": ["number", "null"]},
                                    "price_amount": {"type": ["number", "null"]},
                                    "price_currency": {"type": ["string", "null"]},
                                    "freshness_label": {"type": ["string", "null"]},
                                    "tags": {"type": "array", "items": {"type": "string"}},
                                    "difficulty": {"type": ["string", "null"]},
                                    "average_rating": {"type": ["number", "null"]},
                                    "ai_rating": {"type": ["number", "null"]},
                                    "ai_review": {"type": ["string", "null"]},
                                },
                                "required": ["title", "provider_name", "provider_url", "summary", "description", "level", "delivery_mode", "duration_hours", "price_amount", "price_currency", "freshness_label", "tags", "difficulty", "average_rating", "ai_rating", "ai_review"],
                                "additionalProperties": False,
                            },
                        }
                    },
                    "required": ["courses"],
                    "additionalProperties": False,
                },
            }
        },
    }
    try:
        with httpx.Client(timeout=35) as client:
            resp = client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            print("OPENAI STATUS:", resp.status_code)
            print("OPENAI RAW:", resp.text[:3000])
            resp.raise_for_status()
            data = resp.json()

        content = data.get("output", [])
        text_chunks = []
        for item in content:
            for chunk in item.get("content", []):
                if chunk.get("type") in {"output_text", "text"} and chunk.get("text"):
                    text_chunks.append(chunk["text"])

        if not text_chunks and data.get("output_text"):
            text_chunks.append(data["output_text"])

        raw_text = "".join(text_chunks).strip()
        print("OPENAI PARSED TEXT:", raw_text[:3000])

        parsed = json.loads(raw_text)
        results = []
        for item in parsed.get("courses", [])[:limit]:
            results.append(
                item
                | {
                    "source_type": "external_live",
                    "score": 0.82,
                    "why_recommended": "Найдено через OpenAI web search по актуальным страницам курсов.",
                }
            )

        if results:
            return results, {"provider": "openai", "model": settings.openai_model}

        print("OPENAI: empty results, fallback used")

    except Exception as e:
        print("OPENAI SEARCH ERROR:", repr(e))

    return _fallback_results(query)[:limit], meta
