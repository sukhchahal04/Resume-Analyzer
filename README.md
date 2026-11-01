# AI Resume Analyzer & Job Matching System

Upload a resume (PDF or DOCX), paste a job description, and get a match score with the evidence behind it, the skills you are missing, ATS readability checks, and AI-written suggestions grounded in a small knowledge base.

Built as a final-year project by Sukhsirjan. It is an end-to-end system: document parsing, NLP and embeddings, retrieval-augmented suggestions, a FastAPI backend, a MySQL database and a React dashboard.

> All resumes shown in the screenshots are public templates. No real personal data is used.

**Quick look with no backend:** the frontend can run on bundled sample data. See [Frontend](#frontend) and set `VITE_USE_MOCK=true`.

## Screenshots

**Start screen.** Paste a job description, then add a resume by uploading a PDF or DOCX, or reuse one already uploaded.

![Empty analyze screen](docs/screenshots/01-analyze-empty.png)

**Match result.** One overall score, built from skill match and semantic evidence, with matching and missing skills.

![Analysis result](docs/screenshots/02-analyze-result.png)

**A weak match, for contrast.** The same job description against a food-service resume that lists a few technologies in a single skills line. The score drops, and the evidence strip shows why: most requirements have no supporting line on the resume.

![Weak match](docs/screenshots/07-analyze-weak.png)

| Same job description | Strong resume | Weak resume |
|---|---|---|
| Overall score | 76 | 36 |
| Skill match | 77% | 38% |
| Strong evidence | 58% | 17% |
| Requirements strong / partial / weak | 7 / 4 / 1 | 2 / 4 / 6 |
| Missing skills | 3 | 8 |

**Evidence.** Every job requirement is matched to the closest line on the resume and graded strong, partial or weak, so the score can be checked, not just trusted.

![Evidence list](docs/screenshots/03-evidence.png)

**Suggestions.** The LLM writes advice from the analysis, and a "Learn and build" list comes from the knowledge base.

![AI suggestions](docs/screenshots/04-suggestions.png)

**ATS readability.** Rule-based checks for contact details, standard headings, length, dates and measurable results.

![ATS readability](docs/screenshots/05-ats.png)

**Backend API.** FastAPI generates interactive documentation for every endpoint.

![API documentation](docs/screenshots/06-api-docs.png)

## How it works

```mermaid
flowchart LR
  U[Upload PDF or DOCX] --> E[Extract text and sections]
  E --> S[Skill extraction]
  E --> DB[(MySQL)]
  S --> DB
  JD[Job description] --> M[Matching engine]
  DB --> M
  M --> SK[Skill match]
  M --> EV[Semantic evidence<br/>sentence-transformers]
  SK --> O[Overall score]
  EV --> O
  M --> R[Retrieve knowledge-base entries]
  R --> L[LLM suggestions<br/>with rule-based fallback]
  DB --> A[ATS checks]
```

1. **Parsing.** Text is extracted with `pdfplumber` (PDF) and `python-docx` (DOCX, tables included, in document order). Sections are split by heading, and skills are found with a curated dictionary of names and aliases (for example `k8s` and `Kubernetes` count as one skill).
2. **Matching.** Two signals are combined into the overall score:
   - **Skill match:** the share of the job's recognised skills that appear on the resume.
   - **Semantic evidence:** the resume and job description are split into lines, embedded with `all-MiniLM-L6-v2`, and each job requirement is matched to its closest resume line by cosine similarity. Strong is 0.50 or higher, partial is 0.35 to 0.50, weak is below 0.35.
   - **Overall score** = 50% skill match + 50% semantic fit, where strong evidence counts fully and partial counts half. A full-text TF-IDF similarity is still returned by the API, but it is left out of the headline score because it underrates good matches when a resume has a lot of unrelated text.
3. **Suggestions (retrieval-augmented).** For each missing skill the system looks up a knowledge-base entry by name, then falls back to semantic search above a minimum similarity. The retrieved entries and the evidence go into a constrained prompt (use only the facts given, never advise adding a skill the candidate has not used). The reply is parsed and validated item by item. If the LLM call fails, rule-based suggestions are returned instead, so the feature degrades gracefully.
4. **ATS checks.** Ten simple rules: email, phone, profile link, experience, education and skills headings, length, dates, measurable results and recognised skills. These are heuristics, not how any specific ATS scores a resume.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, GSAP, IBM Plex Sans |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy |
| Database | MySQL 8 |
| NLP and ML | sentence-transformers (`all-MiniLM-L6-v2`), scikit-learn (TF-IDF), regex-based parsing |
| LLM | Groq API (`openai/gpt-oss-120b`), configurable with `GROQ_MODEL` |
| Documents | pdfplumber, python-docx |

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/upload-resume` | Upload a PDF or DOCX; returns sections and skills |
| POST | `/match-score` | Overall score, skill match, evidence and coverage for a resume and job description |
| POST | `/suggestions` | AI suggestions with knowledge-base references |
| GET | `/ats-check/{resume_id}` | ATS readability checks |
| GET | `/`, `/ping` | Health checks |

Errors use proper status codes: 400 for a wrong file type or empty file, 404 for an unknown resume, 422 for unreadable files and invalid input.

## Run it locally

**Prerequisites:** Python 3.12, Node.js 18 or newer, MySQL 8, and a free [Groq](https://console.groq.com) API key.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create the database in MySQL, then create a `.env` file in `backend/` with:

```sql
CREATE DATABASE resume_analyzer;
```

```
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/resume_analyzer
```

```bash
uvicorn main:app --reload
```

The first start is slow: PyTorch loads and the embedding model (about 90 MB) downloads. Tables are created automatically. API docs are at http://127.0.0.1:8000/docs.

If Groq returns "model not found", the model catalogue has changed. List what your key can use and update `GROQ_MODEL`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false
```

```bash
npm run dev
```

Open http://localhost:5173. In `frontend/.env`, `VITE_USE_MOCK=false` talks to the backend, and `VITE_USE_MOCK=true` runs the interface on bundled sample data with no backend at all.

## Project structure

```
backend/
  main.py                FastAPI app, CORS, routers
  routers/resume.py      the endpoints
  services/              extraction, parsing, matching, embeddings, rag, llm, ats, knowledge base
  db/                    SQLAlchemy engine and models
frontend/
  src/                   React app: screens, API client with mock mode
  DESIGN.md              design decisions
docs/screenshots/        images used in this README
```

## Design decisions

- **Evidence over a bare score.** A single number is hard to trust, so every requirement shows the resume line it was matched to.
- **Two retrieval modes.** Exact lookup for known skills, semantic search for the rest, with a similarity floor so an irrelevant match is dropped instead of shown.
- **Thresholds were calibrated, not guessed.** Test queries with known answers (including deliberately unrelated ones) were used to set the similarity cut-offs.
- **LLM output is untrusted input.** Replies are parsed and every suggestion is validated; a fallback path means the app never shows a raw failure.
- **Secrets stay out of the repo.** Keys and the database URL come from `.env`.

## Known limitations

- **Multi-column PDFs** can be read out of order, because PDFs store positioned text with no real structure.
- **Image-only or scanned resumes** have no text layer and are rejected with a clear message. OCR would be the fix.
- **Section detection** relies on standard headings, so creative headings may be missed.
- **The skills dictionary** is finite. Some ambiguous names (such as `go` and `r`) are deliberately left out, and a few ordinary words can false-match.
- **Embeddings can match generic phrasing across fields**, such as "collaborate". The strong/partial/weak bands soften this but do not remove it.
- **The similarity thresholds** come from a small number of examples and would need a labelled evaluation set to tune properly.
- **Listed skills look like evidence.** A resume with one line of keywords earns partial or strong matches for several requirements, because the system cannot tell skills that are listed from skills that were used. The weak-match screenshot shows it: its only strong matches come from a single skills line.
- **Few skill relationships are modelled.** Any NoSQL store on a resume satisfies `nosql`, but nothing else is handled: `github` does not satisfy `git`, and a requirement such as "MongoDB or DynamoDB" still lists the missing alternative.
- **Not hosted.** The backend loads PyTorch and a sentence-transformers model, which I estimate (I have not measured it) is too heavy for the 512 MB free web service tiers I looked at, so the project runs locally. A lighter ONNX embedding library (FastEmbed) is the planned route to free hosting.

## Ideas for next steps

OCR for scanned resumes, column-aware PDF extraction, a labelled evaluation set for the thresholds, a fuller skill taxonomy (only NoSQL is handled today), and free hosting by replacing PyTorch with an ONNX embedding library so the backend fits a small instance.
