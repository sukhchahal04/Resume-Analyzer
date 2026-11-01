# Resume Analyzer frontend

React + Vite single-page app for the Resume Analyzer API. Screens: **Analyze** (upload a resume, paste a job description, see the match, evidence and suggestions) and **ATS check** (readability checks for one resume).

## Run
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

- **Mock mode** (default in `.env`: `VITE_USE_MOCK=true`): uses saved sample responses from `src/mocks/`, so the backend does not need to run. Sample resume IDs: 4 and 5.
- **Live mode**: set `VITE_USE_MOCK=false` (and `VITE_API_URL`, default `http://127.0.0.1:8000`), restart `npm run dev`, and start the backend (`uvicorn main:app --reload`). The backend must allow the origin `http://localhost:5173` (CORS).

## Structure
```
src/
  App.jsx                    shell, sidebar, hash routes, shared session
  api/client.js              every backend call, with the mock switch
  hooks.js                   GSAP: score count-up, suggestion reveal
  components/
    AnalyzePanel.jsx         upload, job description, result summary
    EvidenceList.jsx         per-requirement evidence, strip and filter
    SuggestionsPanel.jsx     AI suggestions and learning references
    AtsPanel.jsx             ATS readability checks
  styles/                    tokens.css (design tokens) and per-screen CSS
  mocks/                     sample API responses for mock mode
DESIGN.md                    design decisions
```

## API used
`POST /upload-resume`, `POST /match-score`, `POST /suggestions`, `GET /ats-check/{resume_id}`.

## Known limits
- Suggestions take several seconds because the backend re-runs the analysis and then calls an LLM.
- The ATS score is a set of simple rule-based checks, not how any real ATS scores a resume.
- Scanned (image-only) PDFs are not supported by the backend.

## Screenshots
_Add screenshots here: Analyze result, evidence list, suggestions, ATS check, phone layout._
