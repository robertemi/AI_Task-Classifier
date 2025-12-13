import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.service.task_service import TaskService
from backend.types.types import IndexEnrichedTaskRequest


@pytest.mark.asyncio
async def test_create_task_success():

    service = TaskService()

    # Mock Supabase client
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_insert_query = MagicMock()

    mock_insert_query.execute = AsyncMock(return_value=MagicMock(
        data=[{"id": "NEW123"}]
    ))

    # Table → insert → query
    mock_table.insert.return_value = mock_insert_query
    mock_supabase.table.return_value = mock_table

    # Mock Redis client
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()

    # Patch ensure_clients dependencies
    with patch("backend.service.task_service.get_supabase_client", new_callable=AsyncMock) as mock_supabase_factory:
        with patch("backend.service.task_service.get_redis_client", new_callable=AsyncMock) as mock_redis_factory:

            mock_supabase_factory.return_value = mock_supabase
            mock_redis_factory.return_value = mock_redis

            # Patch RAG indexing
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

                # Supabase insert was called
                mock_supabase.table.assert_called_once_with("tasks")
                mock_table.insert.assert_called_once()

                # RAG index_task was called
                mock_rag_index.assert_called_once()

                # Redis cache was updated
                mock_redis.set.assert_awaited_once()
