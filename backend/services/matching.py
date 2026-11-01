from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_match_score(resume_text: str, job_description: str) -> float:
    documents = [resume_text, job_description]

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])

    score = similarity[0][0]
    return round(float(score) * 100, 2)   # convert to a 0-100 percentage

def compute_skill_match(resume_skills: list, jd_skills: list) -> dict:
    resume_set = set(resume_skills)
    jd_set = set(jd_skills)

    matching_skills = list(resume_set & jd_set)
    missing_skills = list(jd_set - resume_set)

    if len(jd_set) == 0:
        skill_match_percent = None   # JD contained no skills we recognise, so nothing was measured
    else:
        skill_match_percent = round((len(matching_skills) / len(jd_set)) * 100, 2)

    return {
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "skill_match_percent": skill_match_percent
    }

def compute_overall_score(skill_match_percent, strong_percent, coverage_percent) -> float:
    partial_percent = coverage_percent - strong_percent
    semantic_fit = strong_percent + 0.5 * partial_percent

    if skill_match_percent is None:
        return round(semantic_fit, 2)

    return round(0.5 * skill_match_percent + 0.5 * semantic_fit, 2)