import assert from 'node:assert/strict'
import test from 'node:test'
import type { QuestionIndexEntry } from '../types/question-index.js'
import { orderDayOneEntries } from './question-index.js'

function entry(id: string, subjectName: string, year = 2020): QuestionIndexEntry {
  return {
    id,
    year,
    subject_id: null,
    subject_name: subjectName,
    subject_area: null,
    difficulty: null,
    correct_alternative: null,
    content: null,
  }
}

test('orderDayOneEntries puts five LE questions first', () => {
  const entries = [
    entry('h1', 'História'),
    entry('p1', 'Português'),
    entry('e1', 'Espanhol'),
    entry('i1', 'Inglês', 2019),
    entry('i2', 'Inglês', 2020),
    entry('i3', 'Inglês', 2021),
    entry('i4', 'Inglês', 2022),
    entry('i5', 'Inglês', 2023),
    entry('l1', 'Literatura'),
  ]

  const ordered = orderDayOneEntries(entries, 'Inglês')
  const firstFive = ordered.slice(0, 5)

  assert.equal(firstFive.every((item) => item.subject_name === 'Inglês'), true)
  assert.equal(ordered.some((item) => item.subject_name === 'Espanhol'), false)
  assert.equal(ordered[5]?.subject_name, 'Português')
  assert.equal(ordered.at(-1)?.subject_name, 'História')
})
