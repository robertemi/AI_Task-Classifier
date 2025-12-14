from unittest.mock import MagicMock
from backend.rag.retriever import RAGService


def test_delete_task():

    rag = RAGService()
    rag.vs = MagicMock()

    # Mock vector store delete method
    rag.vs.delete_by_task.return_value = 3

    # Run method
    deleted = rag.delete_task("P123", "T99")

    # Verify returned value
    assert deleted == 3

    # Verify correct call into vector store
    rag.vs.delete_by_task.assert_called_once_with(
        project_id="P123",
        task_id="T99"
    )

def test_delete_task_none_deleted():

    rag = RAGService()
    rag.vs = MagicMock()
    rag.vs.delete_by_task.return_value = 0

    deleted = rag.delete_task("P1", "T1")

    assert deleted == 0
