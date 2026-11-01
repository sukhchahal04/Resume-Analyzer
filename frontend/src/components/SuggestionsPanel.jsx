import { useRef, useState } from 'react'
import { getSuggestions } from '../api/client.js'
import { useRevealRows } from '../hooks.js'
import '../styles/suggestions.css'

const SOURCE_LABEL = {
  llm: 'Written by AI',
  rules: 'Rule-based tips (the AI was unavailable)',
}

function Placeholder() {
  return (
    <div aria-busy="true" aria-label="Writing suggestions">
      <div className="skel sg-skel-summary" />
      {[0, 1, 2, 3].map((i) => <div key={i} className="skel sg-skel-row" />)}
    </div>
  )
}

export default function SuggestionsPanel({ session, update }) {
  const { resume, resultJd, suggestions } = session
  const [state, setState] = useState({ status: 'idle', error: '' })
  const [fresh, setFresh] = useState(false) // true only right after the person asked, so the reveal does not replay on return
  const listRef = useRef(null)
  useRevealRows(listRef, fresh, suggestions)

  async function load() {
    setFresh(false)
    setState({ status: 'loading', error: '' })
    try {
      // Uses the job description the result was analyzed with, not text edited since
      const data = await getSuggestions(resume.id, resultJd)
      update({ suggestions: data })
      setFresh(true)
      setState({ status: 'idle', error: '' })
    } catch (err) {
      setState({ status: 'error', error: err.message })
    }
  }

  const loading = state.status === 'loading'
  const refs = suggestions && Array.isArray(suggestions.references) ? suggestions.references : []
  const items = suggestions && Array.isArray(suggestions.suggestions) ? suggestions.suggestions : []

  return (
    <section className="group">
      <h2 className="group-title">Suggestions</h2>

      {!suggestions && !loading && state.status !== 'error' && (
        <div className="sg-intro">
          <p className="hint">Tips for closing the gaps, with things to learn and build. Takes a few seconds.</p>
          <button type="button" className="btn-secondary" onClick={load}>Get suggestions</button>
        </div>
      )}

      {loading && (
        <>
          <button type="button" className="btn-secondary" disabled>Writing suggestions…</button>
          <Placeholder />
        </>
      )}

      {state.status === 'error' && (
        <div className="error-block" role="alert">
          <p>Couldn't get suggestions. {state.error}</p>
          <button type="button" className="text-btn" onClick={load}>Retry</button>
        </div>
      )}

      {suggestions && !loading && (
        <div className="sg-body">
          <p className="sg-summary">{suggestions.summary}</p>
          <p className="sg-source">
            {SOURCE_LABEL[suggestions.source] || 'Source unknown'}
            <button type="button" className="text-btn sg-again" onClick={load}>Regenerate</button>
          </p>

          <ol className="sg-list" ref={listRef}>
            {items.map((s, i) => (
              <li key={`${s.title}-${i}`} className="sg-item" data-reveal>
                <span className="sg-num num">{i + 1}</span>
                <div>
                  <p className="sg-title">{s.title}</p>
                  <p className="sg-detail">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          {refs.length > 0 && (
            <>
              <h3 className="sg-sub">Learn and build <span className="count">{refs.length}</span></h3>
              <ul className="sg-refs">
                {refs.map((r) => (
                  <li key={r.skill} className="sg-ref">
                    <span className="chip match">{r.skill}</span>
                    <div>
                      <p><span className="sg-label">Learn</span> {r.learn}</p>
                      <p><span className="sg-label">Build</span> {r.project}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}
