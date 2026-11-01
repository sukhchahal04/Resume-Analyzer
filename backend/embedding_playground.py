from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")
print("Max tokens:", model.max_seq_length)

resume_lines = [
    "Served food and beverages to restaurant patrons",
    "Trained new waitstaff and coordinated shifts",
    "Wrote Python and JavaScript libraries to display real-time flight pricing",
    "Collaborated with QA testers to launch a new web application",
    "Implemented a CRM system, saving the company $45,000",
]

jd_requirements = [
    "Experience building web applications",
    "Strong Python programming skills",
    "Experience with team leadership",
]

resume_vecs = model.encode(resume_lines)
jd_vecs = model.encode(jd_requirements)
sims = cosine_similarity(jd_vecs, resume_vecs)   # rows = JD requirements, columns = resume lines

for req, row in zip(jd_requirements, sims):
    best = row.argmax()
    print(f"{req}\n  best match ({row[best]:.2f}): {resume_lines[best]}\n")

# For contrast: one vector for the whole text on each side
whole_resume = model.encode([" ".join(resume_lines)])
whole_jd = model.encode([" ".join(jd_requirements)])
print("Whole-document similarity:", cosine_similarity(whole_resume, whole_jd)[0][0].round(2))