export const STORAGE_KEY = 'local-first-studio-1030/v1'

export const demoSessions = [
  { id: 'session-research', title: 'Shape the research narrative', note: 'Pull the signal from interviews 04–07.', category: 'Deep work', minutes: 50, start: '09:30', done: true, color: 'plum' },
  { id: 'session-review', title: 'Review prototype handoff', note: 'Resolve the three sharpest open questions.', category: 'Collaboration', minutes: 45, start: '10:30', done: false, color: 'amber' },
  { id: 'session-write', title: 'Write the decision note', note: 'A short record people can act on.', category: 'Deep work', minutes: 50, start: '13:30', done: false, color: 'moss' },
  { id: 'session-inbox', title: 'Close the small loops', note: 'Inbox, approvals, and handoffs.', category: 'Maintenance', minutes: 25, start: '15:00', done: false, color: 'sky' },
]

export const demoNotes = [
  { id: 'note-1', text: 'Ask Mina whether the customer quote can lead the case study.', tag: 'Follow-up', done: false },
  { id: 'note-2', text: 'Keep the Tuesday review as a 20-minute decision, not a status update.', tag: 'Decision', done: false },
  { id: 'note-3', text: 'Prototype observation: people want a next step before the rationale.', tag: 'Insight', done: true },
]

export const demoState = {
  sessions: demoSessions,
  notes: demoNotes,
  focusMinutes: 112,
  intention: 'Leave the day with a clear story and fewer open loops.',
}

export function minutesToClock(total) {
  const safe = Math.max(0, Math.round(total))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export function plannedMinutes(sessions) {
  return sessions.reduce((sum, session) => sum + Number(session.minutes || 0), 0)
}

export function completeMinutes(sessions) {
  return sessions.filter((session) => session.done).reduce((sum, session) => sum + Number(session.minutes || 0), 0)
}

export function progressPercent(sessions) {
  const planned = plannedMinutes(sessions)
  return planned ? Math.min(100, Math.round((completeMinutes(sessions) / planned) * 100)) : 0
}

export function categoryBreakdown(sessions) {
  return sessions.reduce((acc, session) => {
    acc[session.category] = (acc[session.category] || 0) + Number(session.minutes || 0)
    return acc
  }, {})
}

export function makeSession({ title, note = '', category = 'Deep work', minutes = 50, start = '16:00' }) {
  return {
    id: `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: title.trim() || 'Untitled focus block',
    note: note.trim(),
    category,
    minutes: Math.max(5, Math.min(180, Number(minutes) || 50)),
    start,
    done: false,
    color: category === 'Collaboration' ? 'amber' : category === 'Maintenance' ? 'sky' : 'moss',
  }
}

export function buildWrapUp({ sessions, notes, intention }) {
  const complete = completeMinutes(sessions)
  const planned = plannedMinutes(sessions)
  const completedSessions = sessions.filter((session) => session.done)
  const openNotes = notes.filter((note) => !note.done)
  const lines = [
    '# Studio 1030 — daily wrap-up',
    '',
    `**Intention:** ${intention || 'Not set'}`,
    `**Signal:** ${complete} of ${planned} planned minutes completed (${progressPercent(sessions)}%).`,
    '',
    '## Completed blocks',
    ...(completedSessions.length ? completedSessions.map((s) => `- ${s.title} · ${s.minutes} min`) : ['- Nothing marked complete yet.']),
    '',
    '## Carry forward',
    ...(openNotes.length ? openNotes.map((n) => `- ${n.text}`) : ['- No open notes.']),
  ]
  return lines.join('\n')
}
