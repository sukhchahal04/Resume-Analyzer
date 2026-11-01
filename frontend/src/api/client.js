// One place for every backend call. With VITE_USE_MOCK=true the saved sample responses are used,
// so the UI can be built without the server running.
import ats4 from '../mocks/ats_resume4.json'
import ats5 from '../mocks/ats_resume5.json'
import match4 from '../mocks/match_score_resume4.json'
import match5 from '../mocks/match_score_resume5.json'
import sugg4 from '../mocks/suggestions_resume4.json'
import sugg5 from '../mocks/suggestions_resume5.json'

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_ATS = { 4: ats4, 5: ats5 }
const MOCK_MATCH = { 4: match4, 5: match5 }
const MOCK_SUGG = { 4: sugg4, 5: sugg5 }
let mockUploads = 0
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function errorText(body, status) {
  const d = body && body.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0] && d[0].msg) return d[0].msg // FastAPI validation errors
  return `The server returned an error (${status}).`
}

async function request(path, options) {
  let res
  try {
    res = await fetch(BASE + path, options)
  } catch {
    throw new Error(`Can't reach the server at ${BASE}. Check that the backend is running.`)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(errorText(body, res.status))
  return body
}

export async function getAtsCheck(resumeId) {
  if (USE_MOCK) {
    await wait(450)
    const data = MOCK_ATS[resumeId]
    if (!data) throw new Error(`Resume with id ${resumeId} not found.`)
    return data
  }
  return request(`/ats-check/${resumeId}`)
}

// Mock uploads alternate between sample resume 4 and 5
export async function uploadResume(file) {
  if (USE_MOCK) {
    await wait(700)
    const id = mockUploads++ % 2 === 0 ? 4 : 5
    return { id, filename: file.name }
  }
  const form = new FormData()
  form.append('file', file)
  return request('/upload-resume', { method: 'POST', body: form })
}

export async function getMatchScore(resumeId, jobDescription) {
  if (USE_MOCK) {
    await wait(1200)
    const data = MOCK_MATCH[resumeId]
    if (!data) throw new Error(`Resume with id ${resumeId} not found.`)
    return data
  }
  return request('/match-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  })
}

// Takes several seconds in live mode: the backend re-runs the analysis, then calls the LLM
export async function getSuggestions(resumeId, jobDescription) {
  if (USE_MOCK) {
    await wait(2500)
    const data = MOCK_SUGG[resumeId]
    if (!data) throw new Error(`Resume with id ${resumeId} not found.`)
    return data
  }
  return request('/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  })
}
