import { useCallback, useState } from 'react'
import { getAtsCheck } from '../api/client.js'
import ScoreRing from './ScoreRing.jsx'

// The ten checks fall into three groups; any label the backend adds later lands in "Other"
const GROUPS = [
  { title: 'Contact', labels: ['Email address', 'Phone number', 'Profile link'] },
  { title: 'Structure', labels: ['Experience section', 'Education section', 'Skills section', 'Length'] },
  { title: 'Content', labels: ['Dates', 'Measurable results', 'Recognised skills'] },
]

function groupChecks(checks) {
  const known = new Set(GROUPS.flatMap((g) => g.labels))
  const groups = GROUPS.map((g) => ({ title: g.title, items: checks.filter((c) => g.labels.includes(c.label)) }))
  const other = checks.filter((c) => !known.has(c.label))
  if (other.length) groups.push({ title: 'Other', items: other })
  // failing checks first inside each group
  return groups
    .filter((g) => g.items.length > 0)
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => Number(a.passed) - Number(b.passed)) }))
}

function StatusIcon({ passed }) {
  return passed ? (
    <svg className="status-icon ok" width="16" height="16" viewBox="0 0 16 16" aria-label="Passed" role="img">
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="status-icon bad" width="16" height="16" viewBox="0 0 16 16" aria-label="Needs fixing" role="img">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.8v3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.9" fill="currentColor" />
    </svg>
  )
}

function CheckRow({ check }) {
  return (
    <li className="check-row">
      <StatusIcon passed={check.passed} />
      <div>
        <p className="check-label">{check.label}</p>
        <p className="check-message">{check.message}</p>
      </div>
    </li>
  )
}

// One segment per check, in the order the backend returns them: filled = passes, hatched = needs fixing
function CheckStrip({ checks }) {
  return (
    <div>
      <div className="strip" role="img" aria-label={`${checks.filter((c) => c.passed).length} of ${checks.length} checks pass`}>
        {checks.map((c) => (
          <span key={c.label} className={c.passed ? 'seg pass' : 'seg fail'} title={c.label} />
        ))}
      </div>
      <div className="legend">
        <span><i className="swatch pass" /> Passing</span>
        <span><i className="swatch fail" /> Needs fixing</span>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Running the check">
      <div className="skel skel-panel" />
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel skel-row" />)}
    </div>
  )
}

function Result({ data }) {
  const failed = data.checks.filter((c) => !c.passed)
  const passed = data.checks.filter((c) => c.passed)
  const finding =
    failed.length === 0
      ? `All ${data.checks.length} checks pass. Nothing to fix.`
      : `${passed.length} of ${data.checks.length} checks pass. Fix ${failed.map((c) => c.label.toLowerCase()).join(', ')}.`

  return (
    <>
      <div className="summary-panel">
        <ScoreRing value={Math.round(data.ats_score)} label="Readability score" />
        <div className="summary-body">
          <p className="score-label">Readability score</p>
          <p className="finding-lg">{finding}</p>
          <CheckStrip checks={data.checks} />
        </div>
      </div>

      {groupChecks(data.checks).map((g) => (
        <section key={g.title} className="group check-group">
          <h2 className="group-title">
            {g.title}
            <span className="group-meta">{g.items.filter((c) => c.passed).length} of {g.items.length} pass</span>
          </h2>
          <ul className="checks">{g.items.map((c) => <CheckRow key={c.label} check={c} />)}</ul>
        </section>
      ))}
      <p className="hint result-foot">Fixed something? Add the new version on the Analyze screen and check it again.</p>
    </>
  )
}

export default function AtsPanel({ session }) {
  // Always opens empty. If a resume was added on the Analyze screen its ID is filled in, but nothing runs until Check resume is clicked.
  const [resumeId, setResumeId] = useState(session?.resume ? String(session.resume.id) : '')
  const [state, setState] = useState({ status: 'idle', data: null, error: '' })

  const run = useCallback(async (id) => {
    const n = Number(id)
    if (!Number.isInteger(n) || n < 1) {
      setState({ status: 'error', data: null, error: 'Enter a resume ID of 1 or more.' })
      return
    }
    setState({ status: 'loading', data: null, error: '' })
    try {
      setState({ status: 'done', data: await getAtsCheck(n), error: '' })
    } catch (e) {
      setState({ status: 'error', data: null, error: e.message })
    }
  }, [])


  return (
    <>
      <header className="title-row">
        <h1>ATS readability</h1>
        <p className="subline">How easily an applicant tracking system can read this resume.</p>
      </header>

      <div className="layout">
        <div className="main-col">
          {state.status === 'idle' && (
            <>
              <div className="summary-panel ghost">
                <ScoreRing value={null} label="Readability score" />
                <div className="summary-body">
                  <p className="score-label">Readability score</p>
                  <p className="finding-lg">Not checked yet. Enter a resume ID on the right and click Check resume. A resume added on the Analyze screen is filled in for you.</p>
                  <div className="strip" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => <span key={i} className="seg ghost" />)}
                  </div>
                </div>
              </div>
              <div className="preview-cols">
                {GROUPS.map((g) => (
                  <section key={g.title}>
                    <h2 className="group-title">{g.title}</h2>
                    <ul className="preview-list">
                      {g.labels.map((l) => <li key={l} className="preview-item"><i className="preview-dot" />{l}</li>)}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
          {state.status === 'loading' && <Skeleton />}
          {state.status === 'error' && (
            <div className="error-block" role="alert">
              <p>Couldn't run the check. {state.error}</p>
              <button type="button" className="text-btn" onClick={() => run(resumeId)}>Retry</button>
            </div>
          )}
          {state.status === 'done' && <Result data={state.data} />}
        </div>

        <aside className="rail">
          <form className="panel" onSubmit={(e) => { e.preventDefault(); run(resumeId) }}>
            <label htmlFor="resume-id" className="field-label">Resume ID</label>
            <input id="resume-id" className="input num" type="number" min="1" inputMode="numeric"
              placeholder="ID" value={resumeId} onChange={(e) => setResumeId(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={state.status === 'loading' || resumeId.trim() === ''}>Check resume</button>
          </form>
          <p className="note">
            These are simple rule-based checks for contact details, standard section headings, length,
            dates and measurable results. They are not how any specific ATS scores a resume.
          </p>
        </aside>
      </div>
    </>
  )
}
