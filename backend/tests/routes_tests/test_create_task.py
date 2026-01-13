import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.mark.asyncio
async def test_route_create_task_enrich_and_index_success():
    payload = {
        "taskId": None,
        "userId": "U1",
        "projectId": "P1",
        "task_title": "Task title",
        "user_description": "User desc",
        "selected_model": 2,
        "status": "todo",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes.enrich_task_details", new=AsyncMock(return_value=True)) as mock_enrich:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/task/enrich_and_index", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["succes"] is True
    mock_enrich.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_create_task_enrich_and_index_fail_returns_success_false():
    payload = {
        "taskId": None,
        "userId": "U1",
        "projectId": "P1",
        "task_title": "Task title",
        "user_description": "User desc",
        "selected_model": 2,
        "status": "todo",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes.enrich_task_details", new=AsyncMock(return_value=False)) as mock_enrich:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/task/enrich_and_index", json=payload)

    assert resp.status_code == 200
    data = resp.json()

    assert data["success"] is False
    mock_enrich.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_create_task_enrich_and_index_exception_returns_500():
    payload = {
        "taskId": None,
        "userId": "U1",
        "projectId": "P1",
        "task_title": "Task title",
        "user_description": "User desc",
        "selected_model": 2,
        "status": "todo",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes.enrich_task_details", new=AsyncMock(side_effect=Exception("boom"))):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/task/enrich_and_index", json=payload)

    assert resp.status_code == 500
    assert "Enrich+Index failed" in resp.text
