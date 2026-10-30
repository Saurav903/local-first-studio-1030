import { useEffect, useMemo, useRef, useState } from 'react'
import {
  STORAGE_KEY,
  buildWrapUp,
  categoryBreakdown,
  demoState,
  makeSession,
  minutesToClock,
  plannedMinutes,
  progressPercent,
} from './lib/studio.js'

const icons = {
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8M8 11h6"/>',
  archive: '<path d="M3 7h18v13H3zM2 3h20v4H2zM10 11h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  command: '<path d="M9 9a3 3 0 1 1-3-3v12a3 3 0 1 0 3-3H6M15 15a3 3 0 1 1 3 3V6a3 3 0 1 0-3 3h3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 4.2 4L19 6"/>',
  play: '<path d="m8 5 11 7-11 7V5Z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M20 11a8 8 0 1 0 1 5"/><path d="M20 4v7h-7"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
  note: '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20.8 15.2A8.8 8.8 0 0 1 8.8 3.2 9 9 0 1 0 20.8 15.2Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  pen: '<path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  trash: '<path d="M4 7h16M10 11v5M14 11v5M6 7l1 14h10l1-14M9 7V4h6v3"/>',
}

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icons[name] }} />
}

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...demoState, ...JSON.parse(saved) } : demoState
  } catch {
    return demoState
  }
}

const dayGreeting = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

export default function App() {
  const [studio, setStudio] = useState(getInitialState)
  const [ready, setReady] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(50 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  const [dark, setDark] = useState(false)
  const [storageWarning, setStorageWarning] = useState('')
  const [newNote, setNewNote] = useState('')
  const [form, setForm] = useState({ title: '', note: '', category: 'Deep work', minutes: '50', start: '16:00' })
  const captureRef = useRef(null)

  const planned = plannedMinutes(studio.sessions)
  const progress = progressPercent(studio.sessions)
  const completed = studio.sessions.filter((session) => session.done).length
  const categories = categoryBreakdown(studio.sessions)
  const openNotes = studio.notes.filter((note) => !note.done).length
  const timerLabel = minutesToClock(timerSeconds)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 260)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studio))
      setStorageWarning('')
    } catch {
      setStorageWarning('Changes are safe for this session, but browser storage is unavailable.')
    }
  }, [studio, ready])

  useEffect(() => {
    if (!timerActive) return
    const interval = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval)
          setTimerActive(false)
          setToast('Focus block complete. Take a breath before the next one.')
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerActive])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setDialog('command')
      }
      if (typing) return
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setDialog('session')
      }
      if (event.key === ' ' && !dialog) {
        event.preventDefault()
        setTimerActive((active) => !active)
      }
      if (event.key === 'Escape') setDialog(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialog])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 3800)
    return () => window.clearTimeout(id)
  }, [toast])

  const updateStudio = (key, value) => setStudio((current) => ({ ...current, [key]: value }))
  const toggleSession = (id) => {
    updateStudio('sessions', studio.sessions.map((session) => session.id === id ? { ...session, done: !session.done } : session))
  }
  const toggleNote = (id) => updateStudio('notes', studio.notes.map((note) => note.id === id ? { ...note, done: !note.done } : note))
  const addNote = (event) => {
    event?.preventDefault()
    if (!newNote.trim()) return
    updateStudio('notes', [...studio.notes, { id: `note-${Date.now()}`, text: newNote.trim(), tag: 'Captured', done: false }])
    setNewNote('')
    setToast('Captured in the parking lot.')
  }
  const addSession = (event) => {
    event.preventDefault()
    const session = makeSession(form)
    updateStudio('sessions', [...studio.sessions, session].sort((a, b) => a.start.localeCompare(b.start)))
    setForm({ title: '', note: '', category: 'Deep work', minutes: '50', start: '16:00' })
    setDialog(null)
    setToast('Focus block added to your day.')
  }
  const resetDemo = () => {
    setStudio(demoState)
    setTimerSeconds(50 * 60)
    setDialog(null)
    setToast('The sample studio is back in place.')
  }
  const exportWrapUp = () => {
    const blob = new Blob([buildWrapUp(studio)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'studio-1030-wrap-up.md'
    link.click()
    URL.revokeObjectURL(url)
    setToast('Wrap-up downloaded as Markdown.')
  }
  const runCommand = (action) => {
    setDialog(null)
    if (action === 'new') setDialog('session')
    if (action === 'capture') window.setTimeout(() => captureRef.current?.focus(), 0)
    if (action === 'export') exportWrapUp()
    if (action === 'reset') resetDemo()
  }

  if (!ready) return <LoadingScreen />

  return (
    <div className={`app-shell ${dark ? 'theme-dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><i /> <i /> <i /></span><span>Studio <b>1030</b></span></div>
        <nav aria-label="Main navigation" className="primary-nav">
          <button className="nav-item selected"><Icon name="grid" />Today <span className="nav-dot" /></button>
          <button className="nav-item"><Icon name="spark" />Focus patterns</button>
          <button className="nav-item"><Icon name="book" />Field notes</button>
          <button className="nav-item"><Icon name="archive" />Archive</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="new-block" onClick={() => setDialog('session')}><Icon name="plus" /> New focus block <kbd>N</kbd></button>
          <button className="command-button" onClick={() => setDialog('command')}><Icon name="command" /> Command menu <span><kbd>⌘</kbd><kbd>K</kbd></span></button>
          <div className="person-card"><div className="avatar">SK</div><div><strong>Studio owner</strong><small>Local workspace</small></div><button aria-label="More account options"><Icon name="more" /></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">YOUR DAY, EDITED</p><h1>Good morning.</h1></div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}><Icon name={dark ? 'sun' : 'moon'} /></button>
            <button className="export-button" onClick={exportWrapUp}><Icon name="download" />Export wrap-up</button>
          </div>
        </header>

        {storageWarning && <div className="storage-warning" role="status">{storageWarning}</div>}

        <section className="daily-panel" aria-labelledby="day-heading">
          <div className="daily-title"><p className="section-label"><span className="status-pip" /> {dayGreeting}</p><h2 id="day-heading">Design a day with edges.</h2><p>Make room for the work only you can do, then let the small loops find their place.</p></div>
          <div className="daily-actions"><button className="text-button" onClick={() => setDialog('intention')}><Icon name="pen" />Edit intention</button><button className="circle-arrow" onClick={() => setDialog('session')} aria-label="Add a focus block"><Icon name="arrow" /></button></div>
          <div className="intention"><span>Today’s intention</span><strong>{studio.intention}</strong></div>
        </section>

        <section className="signal-grid" aria-label="Daily signal">
          <article className="signal-card focus-signal">
            <div className="card-heading"><span className="card-kicker"><Icon name="bolt" size={15} />DAILY SIGNAL</span><button aria-label="More daily signal details"><Icon name="more" /></button></div>
            <div className="signal-body"><div className="ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><strong>{progress}<sup>%</sup></strong><span>claimed</span></div></div><div><h3>{completed} of {studio.sessions.length} blocks</h3><p>{planned} min planned · {openNotes} open loop{openNotes === 1 ? '' : 's'}</p><div className="mini-progress"><i style={{ width: `${progress}%` }} /></div></div></div>
            <div className="signal-footer"><span><i className="legend done" />Focused work</span><span>{Math.max(0, planned - studio.sessions.filter(s => s.done).reduce((sum, s) => sum + s.minutes, 0))} min to shape</span></div>
          </article>
          <article className="signal-card capacity-card">
            <div className="card-heading"><span className="card-kicker">CAPACITY CHECK</span><span className="soft-badge">Calm pace</span></div>
            <div className="capacity-number"><strong>{Math.round(planned / 60 * 10) / 10}</strong><span>hours<br />spoken for</span></div>
            <div className="capacity-track"><span style={{ width: `${Math.min(100, planned / 300 * 100)}%` }} /></div>
            <p>{Math.max(0, 300 - planned)} min still unclaimed. Enough room to notice what matters.</p>
          </article>
          <article className="signal-card prompt-card">
            <span className="prompt-orbit">✦</span><span className="card-kicker">STUDIO PROMPT</span><h3>What would make this day feel complete before it feels busy?</h3><button onClick={() => captureRef.current?.focus()}>Capture a thought <Icon name="arrow" /></button>
          </article>
        </section>

        <section className="workspace-grid">
          <section className="focus-map" aria-labelledby="focus-map-heading">
            <div className="section-heading"><div><p className="section-label">THE SHAPE OF TODAY</p><h2 id="focus-map-heading">Focus map</h2></div><button className="text-button" onClick={() => setDialog('session')}><Icon name="plus" />Add block</button></div>
            {studio.sessions.length ? <div className="session-list">{studio.sessions.map((session) => <SessionCard key={session.id} session={session} onToggle={toggleSession} />)}</div> : <EmptyFocus onAdd={() => setDialog('session')} />}
            <div className="category-row">{Object.entries(categories).map(([category, minutes]) => <div key={category}><span className={`category-dot ${category === 'Deep work' ? 'moss' : category === 'Collaboration' ? 'amber' : 'sky'}`} />{category}<strong>{minutes}m</strong></div>)}</div>
          </section>

          <aside className="right-stack">
            <section className="timer-card" aria-label="Focus timer">
              <div className="timer-top"><span className="timer-live"><i />IN A FOCUS SESSION</span><button onClick={() => setTimerSeconds(50 * 60)} aria-label="Reset timer"><Icon name="reset" /></button></div>
              <div className="timer-time">{timerLabel}</div><p>Writing the decision note</p>
              <div className="timer-controls"><button className="timer-play" onClick={() => setTimerActive((active) => !active)} aria-label={timerActive ? 'Pause focus timer' : 'Start focus timer'}><Icon name={timerActive ? 'pause' : 'play'} size={16} />{timerActive ? 'Pause' : 'Begin'}</button><button onClick={() => setTimerSeconds((time) => time + 5 * 60)}>+5 min</button></div>
              <small>Press <kbd>Space</kbd> to {timerActive ? 'pause' : 'begin'} anywhere.</small>
            </section>
            <section className="ledger-card" aria-labelledby="ledger-heading"><div className="ledger-title"><div><p className="section-label">TINY ACCOUNTABILITY</p><h2 id="ledger-heading">The ledger</h2></div><span className="ledger-face">◔</span></div><div className="ledger-stat"><strong>{studio.sessions.filter(s => s.done).reduce((sum, s) => sum + s.minutes, 0)}<small>min</small></strong><span>made visible<br />today</span></div><div className="week-bars" aria-label="Focus activity by day"><span><i style={{height:'38%'}} /><b>M</b></span><span><i style={{height:'65%'}} /><b>T</b></span><span><i style={{height:'47%'}} /><b>W</b></span><span className="today"><i style={{height:'82%'}} /><b>T</b></span><span><i style={{height:'30%'}} /><b>F</b></span></div><p>A gentle record, not a scorecard.</p></section>
          </aside>
        </section>

        <section className="parking-section" aria-labelledby="parking-heading"><div className="section-heading"><div><p className="section-label">DON’T LOSE THE THREAD</p><h2 id="parking-heading">Parking lot <span>{openNotes}</span></h2></div><button className="text-button" onClick={() => setDialog('command')}>View commands <Icon name="chevron" /></button></div><div className="parking-content"><form className="capture-form" onSubmit={addNote}><label htmlFor="quick-capture">Quick capture</label><div><input ref={captureRef} id="quick-capture" value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="A loose end, an idea, a question…" /><button type="submit" aria-label="Add captured note"><Icon name="arrow" /></button></div><small>Press <kbd>⌘</kbd><kbd>K</kbd> for everything else.</small></form><div className="notes-list">{studio.notes.slice(0, 3).map((note) => <button className={`note-item ${note.done ? 'note-done' : ''}`} key={note.id} onClick={() => toggleNote(note.id)} aria-pressed={note.done}><span className="note-check">{note.done && <Icon name="check" size={13} />}</span><span className="note-copy">{note.text}<em>{note.tag}</em></span></button>)}</div></div></section>
      </main>

      <div className="mobile-nav"><button onClick={() => setDialog('session')}><Icon name="plus" />New block</button><button onClick={() => setDialog('command')}><Icon name="command" />Menu</button></div>
      {toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}
      {dialog === 'session' && <Modal title="Add a focus block" onClose={() => setDialog(null)}><form className="studio-form" onSubmit={addSession}><label>What needs a clean edge?<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Draft the one-page brief" required /></label><label>Helpful constraint <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="What makes this session useful?" /></label><div className="form-row"><label>Kind<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Deep work</option><option>Collaboration</option><option>Maintenance</option></select></label><label>Minutes<input type="number" min="5" max="180" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: event.target.value })} /></label></div><label>Start time<input type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></label><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button" type="submit">Place on focus map <Icon name="arrow" /></button></div></form></Modal>}
      {dialog === 'intention' && <Modal title="Set the day’s intention" onClose={() => setDialog(null)}><form className="studio-form" onSubmit={(event) => { event.preventDefault(); setDialog(null); setToast('Intention updated.') }}><label>A good end to this day looks like<textarea autoFocus value={studio.intention} onChange={(event) => updateStudio('intention', event.target.value)} /></label><p className="form-hint">Aim for a meaningful outcome, not a longer list.</p><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button" type="submit">Save intention</button></div></form></Modal>}
      {dialog === 'command' && <CommandPalette onClose={() => setDialog(null)} onRun={runCommand} />}
    </div>
  )
}

function LoadingScreen() { return <div className="loading-screen"><div className="loading-mark"><i /><i /><i /></div><p>Opening your local studio…</p><span /></div> }
function SessionCard({ session, onToggle }) { return <article className={`session-card ${session.done ? 'session-done' : ''}`}><button className="session-check" onClick={() => onToggle(session.id)} aria-label={`Mark ${session.title} as ${session.done ? 'incomplete' : 'complete'}`} aria-pressed={session.done}>{session.done && <Icon name="check" size={15} />}</button><div className="session-time"><strong>{session.start}</strong><span>{session.minutes} min</span></div><div className={`session-swatch ${session.color}`} /><div className="session-copy"><div><span>{session.category}</span><button aria-label={`More options for ${session.title}`}><Icon name="more" /></button></div><h3>{session.title}</h3>{session.note && <p>{session.note}</p>}</div></article> }
function EmptyFocus({ onAdd }) { return <div className="empty-focus"><span className="empty-icon"><Icon name="spark" /></span><h3>A little room to think.</h3><p>Add one meaningful block. You can always make it smaller later.</p><button className="primary-button" onClick={onAdd}><Icon name="plus" />Add first block</button></div> }
function Modal({ title, children, onClose }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></header>{children}</section></div> }
function CommandPalette({ onClose, onRun }) { const [query, setQuery] = useState(''); const options = [{ id:'new', icon:'plus', title:'Add a focus block', hint:'N' }, { id:'capture', icon:'note', title:'Capture a loose thought', hint:'C' }, { id:'export', icon:'download', title:'Export today’s wrap-up', hint:'↵' }, { id:'reset', icon:'reset', title:'Restore sample studio', hint:'' }].filter(item => item.title.toLowerCase().includes(query.toLowerCase())); return <div className="modal-backdrop command-backdrop" onMouseDown={onClose}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Command menu" onMouseDown={(event) => event.stopPropagation()}><div className="command-search"><Icon name="command" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an action…" /><kbd>ESC</kbd></div><div className="command-list">{options.length ? options.map((option) => <button key={option.id} onClick={() => onRun(option.id)}><span><i><Icon name={option.icon} size={17} /></i>{option.title}</span>{option.hint && <kbd>{option.hint}</kbd>}</button>) : <div className="no-commands">No commands match that.</div>}</div><footer><span>Everything stays in this browser.</span><span><kbd>↑</kbd><kbd>↓</kbd> to browse</span></footer></section></div> }
