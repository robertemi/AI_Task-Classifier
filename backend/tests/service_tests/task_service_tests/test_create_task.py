import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.service.task_service import TaskService
from backend.types.types import IndexEnrichedTaskRequest


@pytest.mark.asyncio
async def test_create_task_success():

    service = TaskService()

    # mock supabase
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_insert_query = MagicMock()

    mock_insert_query.execute = AsyncMock(return_value=MagicMock(
        data=[{"id": "NEW123"}]
    ))


    mock_table.insert.return_value = mock_insert_query
    mock_supabase.table.return_value = mock_table

    # mock redis
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()


    with patch("backend.service.task_service.get_supabase_client", new_callable=AsyncMock) as mock_supabase_factory:
        with patch("backend.service.task_service.get_redis_client", new_callable=AsyncMock) as mock_redis_factory:

            mock_supabase_factory.return_value = mock_supabase
            mock_redis_factory.return_value = mock_redis


            with patch.object(service._rag, "index_task") as mock_rag_index:

                req = IndexEnrichedTaskRequest(
                    taskId=None,
                    projectId="P1",
                    task_title="Test Task",
                    user_description="Test user desc",
                    ai_description="AI desc",
                    status="todo",
                    epic=None,
                    story_points=5,
                )

                result = await service.create_task(req)

                assert result is True

                # supabase insert called
                mock_supabase.table.assert_called_once_with("tasks")
                mock_table.insert.assert_called_once()

                # rag index_task called
                mock_rag_index.assert_called_once()

                # redis cache updated
                mock_redis.set.assert_awaited_once()