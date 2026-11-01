import { useMemo, useState } from 'react'
import '../styles/evidence.css'

const LEVELS = ['strong', 'partial', 'weak']
const LABEL = { strong: 'Strong', partial: 'Partial', weak: 'Weak' }

function Swatch({ level }) {
  return <i className={`ev-swatch lv-${level}`} aria-hidden="true" />
}

// Evidence for each job requirement: the closest resume line and how strongly it matches.
export default function EvidenceList({ evidence }) {
  const [filter, setFilter] = useState('all')
  const items = Array.isArray(evidence) ? evidence : []
  const counts = useMemo(() => {
    const c = { strong: 0, partial: 0, weak: 0 }
    items.forEach((i) => { if (c[i.level] !== undefined) c[i.level] += 1 })
    return c
  }, [items])

  if (items.length === 0) return null
  const shown = filter === 'all' ? items : items.filter((i) => i.level === filter)

  return (
    <section className="group">
      <h2 className="group-title">Evidence <span className="count">{items.length}</span></h2>
      <p className="hint ev-intro">
        Each job requirement is matched to the closest line on the resume. Strong is a similarity of 0.50 or higher,
        partial is 0.35 to 0.50, and weak is below 0.35.
      </p>

      <div className="ev-strip" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        role="img" aria-label={`${counts.strong} strong, ${counts.partial} partial and ${counts.weak} weak matches across ${items.length} requirements`}>
        {items.map((item, i) => (
          <span key={i} className={`ev-seg lv-${item.level}`} title={item.requirement} />
        ))}
      </div>
      <div className="legend">
        {LEVELS.map((l) => (
          <span key={l}><Swatch level={l} /> {LABEL[l]} <span className="num">{counts[l]}</span></span>
        ))}
      </div>

      <div className="ev-filter" role="group" aria-label="Filter requirements by match level">
        <button type="button" className="ev-tab" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All <span className="num">{items.length}</span>
        </button>
        {LEVELS.map((l) => (
          <button key={l} type="button" className="ev-tab" aria-pressed={filter === l} onClick={() => setFilter(l)}>
            {LABEL[l]} <span className="num">{counts[l]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">No requirements are at this level.</p>
      ) : (
        <ul className="ev-list">
          {shown.map((item, i) => (
            <li key={`${item.requirement}-${i}`} className="ev-row">
              <div className="ev-text">
                <p className="ev-req">{item.requirement}</p>
                <p className="ev-line" title={item.best_resume_line}>“{item.best_resume_line}”</p>
              </div>
              <div className="ev-meta">
                <span className="ev-level"><Swatch level={item.level} /> {LABEL[item.level] || item.level}</span>
                <span className="num ev-sim">{Number(item.similarity).toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
