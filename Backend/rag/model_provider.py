from __future__ import annotations
from typing import List
from ..types.types import EnrichResult, ContextChunk

ALLOWED_SP = [1, 2, 3, 5, 8, 13]

def clamp_story_points(value: int) -> int:
    """Pick the closest valid story point number."""
    return min(ALLOWED_SP, key=lambda v: abs(v - value))

# TODO Robert
class ModelProvider:
    """
    A simple fake AI model used for testing.

    In the real system, this would connect to an external AI (like OpenAI)
    to generate task descriptions and story point estimates.
    """
    def call(self, title: str, user_desc: str, contexts: List[ContextChunk]) -> EnrichResult:
        """
        Pretend to be an AI model: generate a short improved description
        and choose story points based on text length.
        """
        words = len((title or "").split()) + len((user_desc or "").split())
        sp = 1 if words < 12 else 2 if words < 30 else 3 if words < 60 else 5
        sp = clamp_story_points(sp)
        bullets = [
            "State is persisted and visible after refresh",
            "Errors show a clear message",
            "Include tests for one success and one failure path",
        ]
        used = [c.doc_id for c in contexts[:3]]
        description = (f"{title.strip()}. Extend: {user_desc.strip()}\n\n"
                       "Acceptance criteria:\n- " + "\n- ".join(bullets))[:1150]
        return EnrichResult(
            ai_description=description,
            story_points=sp,
            confidence=0.6,
            used_context_ids=used,
        )
