// Bottom of the sidebar: a small drawing of what a result looks like.
// The drawing is decorative (aria-hidden) and built from the same marks as the real screens: ring, check strip.
function Art() {
  const C = 2 * Math.PI * 20
  return (
    <svg className="side-art" viewBox="0 0 200 132" aria-hidden="true">
      <rect x="14" y="8" width="112" height="116" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="26" y="22" width="56" height="6" rx="3" fill="var(--rule)" />
      <rect x="26" y="36" width="84" height="5" rx="2.5" fill="var(--raised)" />
      <rect x="26" y="47" width="72" height="5" rx="2.5" fill="var(--raised)" />
      <rect x="26" y="58" width="80" height="5" rx="2.5" fill="var(--raised)" />
      <rect x="26" y="69" width="60" height="5" rx="2.5" fill="var(--raised)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={26 + i * 16} y="96" width="12" height="9" rx="2"
          fill={i < 4 ? 'var(--accent)' : i === 4 ? 'color-mix(in srgb, var(--accent) 40%, var(--surface))' : 'transparent'}
          stroke={i === 5 ? 'var(--control)' : 'none'} strokeWidth="1" />
      ))}
      <circle cx="140" cy="44" r="28" fill="var(--ground)" />
      <circle cx="140" cy="44" r="20" fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle cx="140" cy="44" r="20" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * 0.24} transform="rotate(-90 140 44)" />
      <text x="140" y="49" textAnchor="middle" fontSize="14" fontWeight="500" fill="var(--text)" style={{ fontFamily: 'var(--font)' }}>76</text>
    </svg>
  )
}

export default function SideCard({ mock }) {
  return (
    <div className="side-bottom">
      <Art />
      {mock && <p className="sidebar-note">Showing saved sample data</p>}
    </div>
  )
}
