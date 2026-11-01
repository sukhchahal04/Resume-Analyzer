import { useEffect, useState } from 'react'
import AnalyzePanel from './components/AnalyzePanel.jsx'
import AtsPanel from './components/AtsPanel.jsx'
import SideCard from './components/SideCard.jsx'
import { USE_MOCK } from './api/client.js'

// Each view is its own screen, reached by hash route. Later milestones add the others here.
const VIEWS = [
  { id: 'analyze', label: 'Analyze', Component: AnalyzePanel },
  { id: 'ats', label: 'ATS check', Component: AtsPanel },
]

function currentView() {
  const id = window.location.hash.replace('#/', '')
  return VIEWS.find((v) => v.id === id) || VIEWS[0]
}

function Mark() {
  // A page with a tick: the product's mark, drawn in the accent
  return (
    <svg className="mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="3.5" y="2.5" width="15" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h8M7 11.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 15.2l1.8 1.8 3.4-3.6" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [view, setView] = useState(currentView)
  // Kept here so the resume, job description and result survive switching screens
  const [session, setSession] = useState({ resume: null, jd: '', result: null, resultJd: '', suggestions: null })
  const update = (patch) => setSession((s) => ({ ...s, ...patch }))

  useEffect(() => {
    const onHash = () => setView(currentView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { document.title = `${view.label} · Resume Analyzer` }, [view])
  const { Component } = view

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Mark />
          <span className="brand-name">Resume Analyzer</span>
        </div>
        <nav aria-label="Main">
          {VIEWS.map((v) => (
            <a key={v.id} href={`#/${v.id}`} className="nav-item" aria-current={v.id === view.id ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
        <SideCard mock={USE_MOCK} />
      </aside>
      <main className="canvas">
        <Component session={session} update={update} />
      </main>
    </div>
  )
}
