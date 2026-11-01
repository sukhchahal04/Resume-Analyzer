from services.rag import find_closest_entry, retrieve_for_missing_skills

# Skills with no entry of their own (should land near a related entry),
# followed by two unrelated ones (should score clearly lower).
queries = [
    "pytorch", "tensorflow", "react native", "spring boot", "jest",
    "terraform", "github actions", "azure", "photoshop", "welding",
]

print(f"{'Query':<16} {'Closest entry':<18} Similarity")
for query in queries:
    entry, similarity = find_closest_entry(query)
    print(f"{query:<16} {entry['skill']:<18} {similarity:.2f}")

print()
picked = retrieve_for_missing_skills(["nosql", "debugging", "pytorch", "welding"])
print("Retrieved entries:", [e["skill"] for e in picked])