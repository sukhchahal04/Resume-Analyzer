import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

STRONG_THRESHOLD = 0.50
PARTIAL_THRESHOLD = 0.35

def match_level(sim: float) -> str:
    if sim >= STRONG_THRESHOLD:
        return "strong"
    if sim >= PARTIAL_THRESHOLD:
        return "partial"
    return "weak"
# Loaded ONCE, when this module is first imported (server startup)
model = SentenceTransformer("all-MiniLM-L6-v2")

def split_into_chunks(text: str, min_len: int = 15) -> list:
    """Split text into line- or sentence-sized chunks worth embedding.

    Drops headings ("Responsibilities:", "Technical Skills") so they are
    neither counted as requirements nor used as evidence.
    """
    pieces = re.split(r"[\n•●▪]+|(?<=[.!?])\s+", text)
    cleaned = []
    for p in pieces:
        p = re.sub(r"\s+", " ", p).strip()
        p = re.sub(r"^[-*–]\s*", "", p)          # strip leading list dashes from the JD
        if len(p) < min_len:
            continue
        if p.endswith(":"):                      # "Responsibilities:", "Requirements:"
            continue
        if len(p.split()) < 4 and "," not in p and ":" not in p:
            continue                             # "Technical Skills", "Education History"
        cleaned.append(p)
    return cleaned

def semantic_match(resume_text: str, jd_text: str) -> dict:
    resume_chunks = split_into_chunks(resume_text)
    jd_chunks = split_into_chunks(jd_text)

    if not resume_chunks or not jd_chunks:
        return {"semantic_score": 0.0, "coverage_percent": 0.0, "strong_percent": 0.0, "evidence": []}
    resume_vecs = model.encode(resume_chunks)
    jd_vecs = model.encode(jd_chunks)
    sims = cosine_similarity(jd_vecs, resume_vecs)   # rows = JD chunks, columns = resume chunks

    evidence = []
    for requirement, row in zip(jd_chunks, sims):
        best = int(row.argmax())
        sim = round(float(row[best]), 2)
        evidence.append({
            "requirement": requirement,
            "best_resume_line": resume_chunks[best],
            "similarity": sim,
            "level": match_level(sim),
        })

    levels = [e["level"] for e in evidence]
    strong_percent = round(100 * levels.count("strong") / len(levels), 2)
    coverage_percent = round(100 * (len(levels) - levels.count("weak")) / len(levels), 2)
    mean_sim = float(sims.max(axis=1).mean())

    return {
        "semantic_score": round(mean_sim, 2),
        "coverage_percent": coverage_percent,   # strong + partial
        "strong_percent": strong_percent,       # strong only
        "evidence": evidence,
    }