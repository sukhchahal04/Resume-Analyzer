from sklearn.metrics.pairwise import cosine_similarity

from services.embeddings import model  # reuse the embedding model that is already loaded
from services.knowledge_base import KNOWLEDGE_BASE

# Calibrated with rag_test.py: correct matches scored 0.28-0.55, unrelated queries 0.22-0.24.
# The margin is thin, so treat this as a tuned guess; it is low risk because the queries
# come from the recognised skills list, not from arbitrary text.
MIN_SIMILARITY = 0.27
MAX_ENTRIES = 6

# Exact lookup table: skill name -> knowledge-base entry
SKILL_INDEX = {entry["skill"]: entry for entry in KNOWLEDGE_BASE}

# Embed every entry once, when the server starts (not on every request)
_entry_texts = [f"{e['skill']}: {e['what']} {e['learn']}" for e in KNOWLEDGE_BASE]
ENTRY_VECTORS = model.encode(_entry_texts)


def find_closest_entry(query: str):
    """Semantic search: return (entry, similarity) for the entry closest in meaning to the query."""
    query_vector = model.encode([query])
    similarities = cosine_similarity(query_vector, ENTRY_VECTORS)[0]
    best = int(similarities.argmax())
    return KNOWLEDGE_BASE[best], float(similarities[best])


def retrieve_for_missing_skills(missing_skills: list) -> list:
    """Hybrid retrieval: exact lookup by skill name first, semantic search as a fallback."""
    results = []
    seen = set()

    for skill in missing_skills:
        entry = SKILL_INDEX.get(skill)  # 1) exact lookup
        if entry is None:  # 2) no entry with that name, so search by meaning
            candidate, similarity = find_closest_entry(skill)
            if similarity >= MIN_SIMILARITY:  # ignore matches that are not close enough
                entry = candidate

        if entry is not None and entry["skill"] not in seen:
            seen.add(entry["skill"])
            results.append(entry)

        if len(results) >= MAX_ENTRIES:
            break

    return results