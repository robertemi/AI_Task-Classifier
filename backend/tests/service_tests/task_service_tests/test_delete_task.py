import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.service.task_service import TaskService
from backend.types.types import DeleteEnrichedTaskRequest


@pytest.mark.asyncio
async def test_delete_task_success():

    service = TaskService()

    # -------------------------------
    # mock supabase
    # -------------------------------
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_delete_query = MagicMock()

    mock_delete_query.execute = AsyncMock(return_value=MagicMock(
        data=[{"id": "T123"}]
    ))
    
    mock_delete_query.match.return_value = mock_delete_query
    mock_table.delete.return_value = mock_delete_query
    mock_supabase.table.return_value = mock_table

    # -------------------------------
    # mock redis
    # -------------------------------
    cache_before = '[{"taskId": "T123"}, {"taskId": "T999"}]'

    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=cache_before)
    mock_redis.set = AsyncMock()
    mock_redis.delete = AsyncMock()


    with patch("backend.service.task_service.get_supabase_client", new=AsyncMock(return_value=mock_supabase)) as mock_supabase_factory:
        with patch("backend.service.task_service.get_redis_client", new=AsyncMock(return_value=mock_redis)) as mock_redis_factory:

            mock_supabase_factory.return_value = mock_supabase
            mock_redis_factory.return_value = mock_redis

            # -------------------------------
            # mock delete from rag
            # -------------------------------
            with patch.object(service._rag, "delete_task") as mock_rag_delete:

                req = DeleteEnrichedTaskRequest(
                    projectId="P1",
                    taskId="T123"
                )

                result = await service.delete_task(req)

                assert result is True

                # supabase called
                mock_table.delete.assert_called_once()

                # rag delete called
                mock_rag_delete.assert_called_once_with(projectId="P1", taskId="T123")

                # cache updated correctly
                mock_redis.set.assert_awaited_once()
