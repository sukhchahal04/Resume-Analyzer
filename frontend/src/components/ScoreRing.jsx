import { useCountUp } from '../hooks.js'

const R = 52
const C = 2 * Math.PI * R

// Score as a ring: the arc fills as the number counts up (GSAP count-up in hooks.js)
export default function ScoreRing({ value, label, size = 132 }) {
  const shown = useCountUp(value ?? 0)
  const empty = value === null || value === undefined
  const offset = C * (1 - Math.min(Math.max(shown, 0), 100) / 100)
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={empty ? `${label}: not available yet` : `${label}: ${value} out of 100`}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <circle cx="60" cy="60" r={R} className="ring-track" />
        {!empty && <circle cx="60" cy="60" r={R} className="ring-arc" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 60 60)" />}
      </svg>
      <div className="ring-text">
        <span className={`ring-num num${empty ? ' ring-none' : ''}`}>{empty ? '–' : shown}</span>
        <span className="ring-of">{empty ? 'not yet' : '/ 100'}</span>
      </div>
    </div>
  )
}
