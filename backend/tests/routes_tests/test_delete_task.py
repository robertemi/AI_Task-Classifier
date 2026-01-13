import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.mark.asyncio
async def test_route_delete_task_success():

    payload = {
        "projectId": "P1",
        "taskId": "T1",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._task_service.delete_task", new=AsyncMock(return_value=True)) as mock_delete:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/task", json=payload)

    assert resp.status_code == 200
    data = resp.json()

    assert data["ok"] is True
    assert data["data"] == {"taskId": "T1"}
    assert "deleted successfully" in (data["detail"] or "").lower()

    mock_delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_delete_task_not_found_returns_404():
    payload = {
        "projectId": "P1",
        "taskId": "T404",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._task_service.delete_task", new=AsyncMock(return_value=False)) as mock_delete:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/task", json=payload)

    assert resp.status_code == 404
    assert "not found" in resp.text.lower()

    mock_delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_delete_task_exception_returns_500():
    payload = {
        "projectId": "P1",
        "taskId": "T1",
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._task_service.delete_task", new=AsyncMock(side_effect=Exception("boom"))):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/task", json=payload)

    assert resp.status_code == 500
    assert "task deletion failed" in resp.text.lower()

