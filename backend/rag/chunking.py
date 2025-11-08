from __future__ import annotations
import re, hashlib
from typing import List

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WS = re.compile(r"\s+")

def normalize_text(text: str) -> str:
    """
    Clean up a text by removing extra spaces and newlines.
    Makes sure words are separated by only one space.
    """
    text = text or ""
    return _WS.sub(" ", text.strip())

def sha256_of(text: str) -> str:
    """
    Create a unique fingerprint for a text using the SHA256 algorithm.
    Used to track duplicate or changed text parts.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def chunk_text(text: str, max_words: int = 220, overlap_words: int = 40) -> List[str]:
    """
    Split long text into smaller chunks so the AI can process them easily.

    Each chunk has a maximum number of words.
    Some overlap is kept between chunks to preserve meaning.
    """
    text = normalize_text(text)
    if not text:
        return []
    sents = [s.strip() for s in _SENT_SPLIT.split(text) if s.strip()]
    chunks: List[str] = []
    cur: List[str] = []
    cur_words = 0
    for sent in sents:
        w = len(sent.split())
        if cur_words + w > max_words and cur:
            chunks.append(" ".join(cur))
            # overlap
            overlap, ow = [], 0
            for t in reversed(cur):
                tw = len(t.split())
                if ow + tw > overlap_words: break
                overlap.insert(0, t); ow += tw
            cur = overlap + [sent]
            cur_words = sum(len(t.split()) for t in cur)
        else:
            cur.append(sent)
            cur_words += w
    if cur:
        chunks.append(" ".join(cur))
    return chunks
