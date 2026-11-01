import os
import json
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from services.extraction import extract_text_from_pdf, extract_text_from_docx
from services.parsing import split_into_sections, extract_skills
from services.matching import compute_match_score, compute_skill_match, compute_overall_score
from services.embeddings import semantic_match
from services.llm import generate_suggestions
from services.rag import retrieve_for_missing_skills
from services.ats import run_ats_checks

from db.database import SessionLocal
from db.models import Resume


router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------- Dependencies and request models ----------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MatchRequest(BaseModel):
    resume_id: int = Field(..., gt=0)
    job_description: str = Field(..., min_length=10)


# ---------- Shared helpers ----------

def get_resume_or_404(db: Session, resume_id: int) -> Resume:
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with id {resume_id} not found.")
    return resume

def order_by_jd(skills: list, jd_text: str) -> list:
    """Order skills by where they first appear in the JD, so results are stable between runs."""
    jd = jd_text.lower()

    def key(skill: str):
        pos = jd.find(skill.lower())
        return (pos if pos >= 0 else len(jd), skill)   # unmatched aliases go last, alphabetically

    return sorted(skills, key=key)


def run_analysis(resume: Resume, job_description: str) -> dict:
    text_similarity_score = compute_match_score(resume.raw_text, job_description)

    resume_skills = json.loads(resume.skills_json) if resume.skills_json else []
    jd_skills = extract_skills(job_description)
    skill_result = compute_skill_match(resume_skills, jd_skills)
    skill_result = compute_skill_match(resume_skills, jd_skills)
    skill_result["missing_skills"] = order_by_jd(skill_result["missing_skills"], job_description)
    skill_result["matching_skills"] = order_by_jd(skill_result["matching_skills"], job_description)
    NOSQL_STORES = {"mongodb", "dynamodb", "redis", "cassandra", "elasticsearch", "couchdb"}
    if "nosql" in skill_result["missing_skills"] and NOSQL_STORES & set(resume_skills):
        skill_result["missing_skills"].remove("nosql")
        skill_result["matching_skills"].append("nosql")
        total = len(skill_result["matching_skills"]) + len(skill_result["missing_skills"])
        skill_result["skill_match_percent"] = round(100 * len(skill_result["matching_skills"]) / total, 2)

    semantic = semantic_match(resume.raw_text, job_description)

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "overall_score": compute_overall_score(
            skill_result["skill_match_percent"],
            semantic["strong_percent"],
            semantic["coverage_percent"],
        ),
        "text_similarity_score": text_similarity_score,
        "semantic_score": semantic["semantic_score"],
        "coverage_percent": semantic["coverage_percent"],
        "strong_percent": semantic["strong_percent"],
        "evidence": semantic["evidence"],
        "resume_skills": resume_skills,
        **skill_result,
    }


# ---------- Endpoints ----------

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type before doing any work (fail fast)
    allowed_extensions = (".pdf", ".docx")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or DOCX file.",
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(file_path, "wb") as f:
            f.write(contents)
    except HTTPException:
        raise  # our own deliberate errors pass through untouched
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    try:
        if file.filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_docx(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract text from file. It may be corrupted or password-protected. Error: {str(e)}",
        )

    # Catches image-only / scanned files that contain no real text
    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in this file. It may be an image-based or scanned document, which isn't supported yet.",
        )

    sections = split_into_sections(extracted_text)
    skills_found = extract_skills(extracted_text)

    new_resume = Resume(
        filename=file.filename,
        raw_text=extracted_text,
        sections_json=json.dumps(sections),
        skills_json=json.dumps(skills_found),
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return {
        "id": new_resume.id,
        "filename": new_resume.filename,
        "sections": sections,
        "skills_found": skills_found,
        "uploaded_at": new_resume.uploaded_at,
    }


@router.post("/match-score")
def get_match_score(request: MatchRequest, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, request.resume_id)
    return run_analysis(resume, request.job_description)


@router.post("/suggestions")
def get_suggestions(request: MatchRequest, db: Session = Depends(get_db)):
    resume = get_resume_or_404(db, request.resume_id)
    analysis = run_analysis(resume, request.job_description)

    # Retrieval step: find knowledge-base entries for the skills the resume is missing
    kb_entries = retrieve_for_missing_skills(analysis["missing_skills"])

    suggestions = generate_suggestions(analysis, kb_entries)
    return {
        "resume_id": resume.id,
        "overall_score": analysis["overall_score"],
        **suggestions,
        "references": [
            {"skill": e["skill"], "learn": e["learn"], "project": e["project"]}
            for e in kb_entries
        ],
    }

@router.get("/ats-check/{resume_id}")
def ats_check(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    sections = json.loads(resume.sections_json) if resume.sections_json else {}
    skills = json.loads(resume.skills_json) if resume.skills_json else []

    return run_ats_checks(resume.raw_text, sections, skills)