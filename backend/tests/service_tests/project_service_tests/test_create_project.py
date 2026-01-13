import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from backend.service.project_service import ProjectService
from backend.types.types import IndexProjectRequest


@pytest.mark.asyncio
async def test_create_project_success():

    service = ProjectService()

    # -------------------------------
    # mock supabase
    # -------------------------------
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_insert_query = MagicMock()

    mock_insert_query.execute = AsyncMock(return_value=MagicMock(
        data=[{"id": "P999"}]
    ))

    mock_table.insert.return_value = mock_insert_query
    mock_supabase.table.return_value = mock_table

    # -------------------------------
    # mock redis
    # -------------------------------
    mock_redis = MagicMock()
    mock_redis.setex = AsyncMock()

    # -------------------------------
    # mock rag
    # -------------------------------
    with patch.object(service._rag, "index_project") as mock_rag_index:
        with patch.object(service._rag, "get_project_by_id") as mock_rag_get:
            mock_rag_get.return_value = "PROJECT TEXT"

            
            with patch("backend.service.project_service.get_supabase_client", new=AsyncMock(return_value=mock_supabase)):
                with patch("backend.service.project_service.get_redis_client", new=AsyncMock(return_value=mock_redis)):

                    req = IndexProjectRequest(
                        projectId=None,
                        userId="U1",
                        name="Test Project",
                        description="Test Desc",
                        status="active"
                    )

                    result = await service.create_project(req)

                    assert result is True

                    # insert to supabase
                    mock_table.insert.assert_called_once()

                    # insert in rag
                    mock_rag_index.assert_called_once()

                    # insert in cache
                    mock_redis.setex.assert_awaited_once()