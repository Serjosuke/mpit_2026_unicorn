from __future__ import annotations

import json
from dataclasses import dataclass
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
    {"title":"Java-разработчик","provider_name":"Яндекс Практикум","provider_url":"https://practicum.yandex.ru/","summary":"Онлайн-программа по Java и backend-практике.","description":"Подходит для junior-middle backend инженеров и сотрудников с треком Java.","level":"middle","delivery_mode":"online","duration_hours":320,"price_amount":None,"price_currency":None,"freshness_label":"fallback","tags":["java","backend","spring"]},
    {"title":"React-разработчик","provider_name":"Яндекс Практикум","provider_url":"https://practicum.yandex.ru/","summary":"Практика по React, TypeScript и современному фронтенду.","description":"Для frontend и fullstack ролей.","level":"middle","delivery_mode":"online","duration_hours":280,"price_amount":None,"price_currency":None,"freshness_label":"fallback","tags":["react","frontend","typescript"]},
    {"title":"Android-разработчик","provider_name":"Skillbox","provider_url":"https://skillbox.ru/","summary":"Онлайн-обучение Android-разработке.","description":"Для мобильных инженеров и сотрудников мобильных команд.","level":"middle","delivery_mode":"online","duration_hours":250,"price_amount":None,"price_currency":None,"freshness_label":"fallback","tags":["android","kotlin","mobile"]},
    {"title":"DevOps-инженер","provider_name":"OTUS","provider_url":"https://otus.ru/","summary":"DevOps-практика по CI/CD, контейнерам и эксплуатации.","description":"Подходит для ops/platform/devops ролей.","level":"middle","delivery_mode":"online","duration_hours":180,"price_amount":None,"price_currency":None,"freshness_label":"fallback","tags":["devops","docker","kubernetes"]},
    {"title":"Переговоры и коммуникация","provider_name":"Яндекс Практикум","provider_url":"https://practicum.yandex.ru/","summary":"Soft skills для переговоров и командной работы.","description":"Для менеджеров, HR и сотрудников командных ролей.","level":"all","delivery_mode":"online","duration_hours":24,"price_amount":None,"price_currency":None,"freshness_label":"fallback","tags":["soft skills","communication","management"]},
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
        hay = " ".join([item["title"], item["summary"], item["description"], " ".join(item["tags"]) ]).lower()
        if not q or any(token in hay for token in q.split()):
            out.append(item | {"source_type":"external_live","score":0.66,"why_recommended":"Резервная подборка по роли и запросу."})
    return out[:12] if out else [item | {"source_type":"external_live","score":0.5,"why_recommended":"Резервная внешняя подборка."} for item in FALLBACK[:8]]


def search_external_courses(query: str, audience_role: str | None = None, limit: int = 12) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    meta = {"provider":"fallback","model":None}
    if not settings.openai_search_enabled or not settings.openai_api_key:
        return _fallback_results(query)[:limit], meta
    instructions = (
        "Ты помогаешь искать реальные существующие онлайн-курсы для корпоративного LMS. "
        "Нужно вернуть JSON-массив courses. Учитывай запрос, роль пользователя и ищи по свежим страницам курсов в интернете. "
        "Для каждого курса верни: title, provider_name, provider_url, summary, description, level, delivery_mode, duration_hours, price_amount, price_currency, freshness_label, tags. "
        "Не выдумывай. Если цена неизвестна, ставь null. delivery_mode обычно online. Все summaries на русском."
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
                                    "tags": {"type": "array", "items": {"type": "string"}}
                                },
                                "required": ["title", "provider_name", "provider_url", "summary", "description", "level", "delivery_mode", "duration_hours", "price_amount", "price_currency", "freshness_label", "tags"],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["courses"],
                    "additionalProperties": False
                }
            }
        }
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