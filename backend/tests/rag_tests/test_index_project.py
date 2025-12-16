import pytest
from unittest.mock import patch, MagicMock

from backend.rag.retriever import RAGService
from backend.types.types import IndexProjectRequest


def test_index_project():

    rag = RAGService()
    rag.vs = MagicMock()   # prevent real chromaDB call

    # Mock chunk_text to return two chunks
    with patch("backend.rag.retriever.chunk_text") as mock_chunk:
        mock_chunk.return_value = ["chunk1 text", "chunk2 text"]

        # Mock sha256_of for predictability
        with patch("backend.rag.retriever.sha256_of") as mock_hash:
            mock_hash.side_effect = lambda x: f"hash({x})"

            # Prepare request
            req = IndexProjectRequest(
                projectId="P1",
                userId='u21',
                name="My Project",
                description="Project description",
                status="active",
            )

            # Mock upsert_texts return value
            rag.vs.upsert_texts.return_value = len(mock_chunk.return_value)

            result = rag.index_project(req)

            # Validate result
            assert result == {
                "chunks_indexed": len(mock_chunk.return_value),
                "skipped": 0,
            }

            # Validate call to vector store
            rag.vs.upsert_texts.assert_called_once()

            project_id_arg, items_arg = rag.vs.upsert_texts.call_args[0]

            assert project_id_arg == "P1"

            # 🔐 this is the important fix:
            assert len(items_arg) == len(mock_chunk.return_value)

            # sanity-check structure of first item
            item0 = items_arg[0]
            assert item0["id"] == "proj-P1-0"
            assert item0["text"] == "chunk1 text"
            assert item0["metadata"]["projectId"] == "P1"
            assert item0["metadata"]["type"] == "project"
            assert item0["metadata"]["title"] == "My Project"
            assert item0["metadata"]["status"] == "active"
            assert item0["metadata"]["hash"] == "hash(chunk1 text)"