import pytest
from unittest.mock import patch, MagicMock

from backend.rag.retriever import RAGService
from backend.types.types import IndexEnrichedTaskRequest


def test_index_task():
    # Create RAG instance but replace real vector store with mock
    rag = RAGService()
    rag.vs = MagicMock()

    # Patch chunk_text EXACTLY where retriever imports it
    with patch("backend.rag.retriever.chunk_text") as mock_chunk:
        mock_chunk.return_value = ["chunk_A", "chunk_B"]

        # Patch sha256_of in the SAME module retriever imports it from
        with patch("backend.rag.retriever.sha256_of") as mock_hash:
            mock_hash.side_effect = lambda x: f"hash({x})"

            # Prepare input request
            req = IndexEnrichedTaskRequest(
                taskId="T123",
                projectId="P456",
                task_title="Build login feature",
                user_description="User wants a login form",
                ai_description="AI generated description",
                status="todo",
                epic=None,
                story_points=8,
            )

            # What VectorStore should return
            rag.vs.upsert_texts.return_value = len(mock_chunk.return_value)

            # Run the method
            result = rag.index_task(req)

            # Validate returned structure
            assert result == {"chunks_indexed": 2, "skipped": 0}

            # Ensure vector store called correctly
            rag.vs.upsert_texts.assert_called_once()

            project_id_arg, items_arg = rag.vs.upsert_texts.call_args[0]

            assert project_id_arg == "P456"
            assert len(items_arg) == 2  # mock returned 2 chunks

            # Validate first chunk metadata
            item0 = items_arg[0]
            assert item0["id"] == "task-T123-0"
            assert item0["text"] == "chunk_A"

            md = item0["metadata"]
            assert md["projectId"] == "P456"
            assert md["type"] == "task"
            assert md["taskId"] == "T123"
            assert md["title"] == "Build login feature"
            assert md["status"] == "todo"
            assert md["epic"] is None
            assert md["user_description"] == "User wants a login form"
            assert md["ai_description"] == "AI generated description"
            assert md["story_points"] == 8
            assert md["hash"] == "hash(chunk_A)"

            # Validate second chunk exists too
            assert items_arg[1]["text"] == "chunk_B"
            assert items_arg[1]["metadata"]["hash"] == "hash(chunk_B)"
