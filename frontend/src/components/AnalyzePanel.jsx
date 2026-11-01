import { useRef, useState } from 'react'
import { getMatchScore, uploadResume } from '../api/client.js'
import ScoreRing from './ScoreRing.jsx'
import EvidenceList from './EvidenceList.jsx'
import SuggestionsPanel from './SuggestionsPanel.jsx'
import '../styles/analyze.css'

const MIN_JD = 10 // the backend rejects shorter job descriptions

// One click to try the app: the same job description used to test the backend
const SAMPLE_JD = [
  'We are looking for a Software Engineer to build scalable web applications and backend services.',
  'Responsibilities:',
  '- Design, build and maintain backend services and REST APIs using Python',
  '- Write efficient SQL queries and work with NoSQL databases such as MongoDB or DynamoDB',
  '- Develop responsive user interfaces using React',
  '- Containerise applications with Docker and deploy them on AWS',
  '- Participate in code reviews and collaborate with designers and product managers',
  '- Debug production issues and optimise application performance',
  '- Write unit and integration tests to keep code quality high',
  'Requirements:',
  '- Strong knowledge of Python and SQL',
  '- Experience building and consuming REST APIs',
  '- Familiarity with Git, Docker and cloud platforms such as AWS',
  '- Good problem-solving, debugging and communication skills',
].join('\n')

function Chips({ items, tone }) {
  return (
    <ul className="chips">
      {items.map((s) => <li key={s} className={`chip ${tone}`}>{s}</li>)}
    </ul>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Analyzing">
      <div className="skel skel-score" />
      <div className="skel skel-strip" />
      {[0, 1, 2].map((i) => <div key={i} className="skel skel-row" />)}
    </div>
  )
}

// Three steps that tick off as the person completes them
function Steps({ resume, jdReady }) {
  const steps = [
    { title: 'Add a resume', text: 'Upload a PDF or DOCX, or use one already uploaded.', done: Boolean(resume) },
    { title: 'Paste the job description', text: 'At least 10 characters; a full posting works best.', done: jdReady },
    { title: 'Analyze', text: 'See the match score, the evidence for each requirement and tips for closing the gaps.', done: false },
  ]
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s.title} className={`step${s.done ? ' done' : ''}`}>
          <span className="step-mark num">
            {s.done ? (
              <svg width="14" height="14" viewBox="0 0 16 16" aria-label="Done" role="img">
                <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : i + 1}
          </span>
          <div>
            <p className="step-title">{s.title}</p>
            <p className="step-text">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Before any result: a preview of the result panel, the steps, and how the score works
function EmptyState({ resume, jdReady }) {
  const method = [
    { title: 'Skill match', text: "The share of the job's skills that appear on the resume." },
    { title: 'Evidence', text: 'Each requirement is matched to the closest resume line and rated strong, partial or weak.' },
    { title: 'Overall score', text: 'The average of the skill match and the evidence score. Strong matches count fully, partial ones half.' },
  ]
  return (
    <>
      <div className="summary-panel ghost">
        <ScoreRing value={null} label="Overall match score" />
        <div className="summary-body">
          <p className="score-label">Overall match</p>
          <p className="finding-lg">No analysis yet. Your score appears here, with the evidence behind it.</p>
          <dl className="stats">
            <div><dt>Skill match</dt><dd className="num ring-none">–</dd></div>
            <div><dt>Strong evidence</dt><dd className="num ring-none">–</dd></div>
            <div><dt>Coverage</dt><dd className="num ring-none">–</dd></div>
          </dl>
        </div>
      </div>
      <div className="empty-gap"><Steps resume={resume} jdReady={jdReady} /></div>
      <section className="group">
        <h2 className="group-title">How the score works</h2>
        <div className="method">
          {method.map((m) => (
            <div key={m.title} className="method-item">
              <p className="step-title">{m.title}</p>
              <p className="step-text">{m.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function Summary({ data }) {
  const matching = data.matching_skills || []
  const missing = data.missing_skills || []
  const finding =
    `${Math.round(data.strong_percent)}% of the job's requirements are strongly supported by lines on the resume. ` +
    (missing.length === 0
      ? 'No required skills are missing.'
      : `${missing.length} required ${missing.length === 1 ? 'skill is' : 'skills are'} missing.`)

  return (
    <>
      <div className="summary-panel">
        <ScoreRing value={Math.round(data.overall_score)} label="Overall match score" />
        <div className="summary-body">
          <p className="score-label">Overall match</p>
          <p className="finding-lg">{finding}</p>
          <dl className="stats">
            <div><dt>Skill match</dt><dd className="num">{Math.round(data.skill_match_percent)}%</dd></div>
            <div><dt>Strong evidence</dt><dd className="num">{Math.round(data.strong_percent)}%</dd></div>
            <div><dt>Coverage</dt><dd className="num">{Math.round(data.coverage_percent)}%</dd></div>
          </dl>
          <p className="hint">Coverage counts strong and partial matches.</p>
        </div>
      </div>

      <div className="skills-cols">
      <section className="group">
        <h2 className="group-title">Skills missing <span className="count">{missing.length}</span></h2>
        {missing.length === 0 ? <p className="empty">The resume has every skill the job names.</p> : <Chips items={missing} tone="missing" />}
      </section>
      <section className="group">
        <h2 className="group-title">Skills that match <span className="count">{matching.length}</span></h2>
        {matching.length === 0 ? <p className="empty">No skills from the job were found on the resume.</p> : <Chips items={matching} tone="match" />}
      </section>
      </div>

      <EvidenceList evidence={data.evidence} />
    </>
  )
}

export default function AnalyzePanel({ session, update }) {
  const fileRef = useRef(null)
  const resultRef = useRef(null)
  const [upload, setUpload] = useState({ status: 'idle', error: '' })
  const [run, setRun] = useState({ status: 'idle', error: '' })
  const [existingId, setExistingId] = useState('')
  const [dragging, setDragging] = useState(false)

  const { resume, jd, result } = session
  const jdReady = jd.trim().length >= MIN_JD
  const canAnalyze = Boolean(resume) && jdReady && run.status !== 'loading'

  function onFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // lets the same file be chosen again
    handleFile(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (upload.status === 'uploading') return
    handleFile(e.dataTransfer.files && e.dataTransfer.files[0])
  }

  async function handleFile(file) {
    if (!file) return
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setUpload({ status: 'error', error: 'Choose a PDF or DOCX file.' })
      return
    }
    setUpload({ status: 'uploading', error: '' })
    try {
      const r = await uploadResume(file)
      update({ resume: { id: r.id, filename: r.filename }, result: null, suggestions: null })
      setUpload({ status: 'idle', error: '' })
    } catch (err) {
      setUpload({ status: 'error', error: err.message })
    }
  }

  function useExisting(e) {
    e.preventDefault()
    const n = Number(existingId)
    if (!Number.isInteger(n) || n < 1) {
      setUpload({ status: 'error', error: 'Enter a resume ID of 1 or more.' })
      return
    }
    update({ resume: { id: n, filename: `Resume ${n}` }, result: null, suggestions: null })
    setUpload({ status: 'idle', error: '' })
    setExistingId('')
  }

  // On small screens the result starts below the fold: bring it into view when Analyze is clicked
  function revealResult() {
    const el = resultRef.current
    if (!el) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.6) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  async function analyze(e) {
    e.preventDefault()
    if (!canAnalyze) return
    setRun({ status: 'loading', error: '' })
    revealResult()
    try {
      const data = await getMatchScore(resume.id, jd.trim())
      update({ result: data, resultJd: jd.trim(), suggestions: null })
      setRun({ status: 'idle', error: '' })
    } catch (err) {
      setRun({ status: 'error', error: err.message })
    }
  }

  return (
    <>
      <header className="title-row">
        <h1>Match analysis</h1>
        <p className="subline">How well a resume fits a job description.</p>
      </header>

      <div className="layout">
        <div className="main-col">
          <form className="panel" onSubmit={analyze}>
            <label htmlFor="jd" className="field-label">Job description</label>
            <textarea id="jd" className="input textarea" rows={10} value={jd}
              placeholder="Paste the job description here"
              onChange={(e) => update({ jd: e.target.value })} />
            <div className="form-foot">
              <div className="foot-left">
              <p className="hint">
                {!resume ? 'Add a resume first.' : !jdReady ? `Enter at least ${MIN_JD} characters.` : `Using ${resume.filename}`}
              </p>
              {!jd.trim() && (
                <button type="button" className="text-btn" onClick={() => update({ jd: SAMPLE_JD })}>Insert a sample job description</button>
              )}
              </div>
              <button type="submit" className="btn-primary inline" disabled={!canAnalyze}>
                {run.status === 'loading' ? 'Analyzing…' : 'Analyze match'}
              </button>
            </div>
          </form>

          <div className="result" ref={resultRef} aria-live="polite">
            {run.status === 'idle' && !result && (
              <EmptyState resume={resume} jdReady={jdReady} />
            )}
            {run.status === 'loading' && <Skeleton />}
            {run.status === 'error' && (
              <div className="error-block" role="alert">
                <p>Couldn't analyze the resume. {run.error}</p>
                <button type="button" className="text-btn" onClick={analyze}>Retry</button>
              </div>
            )}
            {run.status !== 'loading' && run.status !== 'error' && result && (
              <>
                <Summary data={result} />
                <SuggestionsPanel session={session} update={update} />
              </>
            )}
          </div>
        </div>

        <aside className="rail">
          <div className="panel">
            <p className="field-label">Resume</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={onFile} />
            <div className={`dropzone${dragging ? ' dragging' : ''}`} role="button" tabIndex={0}
              aria-label="Choose a PDF or DOCX resume"
              onClick={() => fileRef.current && fileRef.current.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current && fileRef.current.click() } }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}>
              <svg className="dz-icon" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V5m0 0l-4 4m4-4l4 4M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="dz-title">{upload.status === 'uploading' ? 'Uploading…' : resume ? 'Drop another file to replace' : 'Drop a PDF or DOCX here'}</p>
              <p className="dz-sub">{upload.status === 'uploading' ? 'Reading the file' : 'or click to choose a file'}</p>
            </div>
            {resume && (
              <div className="current">
                <svg className="current-icon" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 2.5h7l3 3v12H5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7.5 11.5l1.8 1.8 3.2-3.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="current-text">
                  <span className="current-name">{resume.filename}</span>
                  <span className="num current-id">ID {resume.id}</span>
                </span>
              </div>
            )}
            {upload.status === 'error' && <p className="error-text" role="alert">{upload.error}</p>}

            <form className="id-row" onSubmit={useExisting}>
              <label htmlFor="existing-id" className="hint">Or use a resume already uploaded</label>
              <div className="id-controls">
                <input id="existing-id" className="input num" type="number" min="1" inputMode="numeric"
                  placeholder="ID" value={existingId} onChange={(e) => setExistingId(e.target.value)} />
                <button type="submit" className="btn-secondary">Use</button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  )
}
