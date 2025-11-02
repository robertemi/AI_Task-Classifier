from fastapi import FastAPI
from Backend.api.rag import router as rag_router

app = FastAPI(title="AI Task Classifier – RAG Backend")

# Register the RAG endpoints
app.include_router(rag_router)

# health
@app.get("/health")
def health():
    return {"status": "ok"}

# Run with: uvicorn main:app --reload
