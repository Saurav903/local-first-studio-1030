import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWrapUp, completeMinutes, makeSession, plannedMinutes, progressPercent } from './studio.js'

const sessions = [
  { title: 'One', minutes: 25, done: true },
  { title: 'Two', minutes: 50, done: false },
]

test('calculates a daily focus signal', () => {
  assert.equal(plannedMinutes(sessions), 75)
  assert.equal(completeMinutes(sessions), 25)
  assert.equal(progressPercent(sessions), 33)
})

test('makes a bounded, usable focus block', () => {
  const session = makeSession({ title: '  Draft outline  ', minutes: 500, category: 'Collaboration' })
  assert.equal(session.title, 'Draft outline')
  assert.equal(session.minutes, 180)
  assert.equal(session.color, 'amber')
})

test('exports a readable end-of-day note', () => {
  const result = buildWrapUp({ sessions, notes: [{ text: 'Send the draft', done: false }], intention: 'Make the decision easier.' })
  assert.match(result, /25 of 75 planned minutes/)
  assert.match(result, /One/)
  assert.match(result, /Send the draft/)
})
