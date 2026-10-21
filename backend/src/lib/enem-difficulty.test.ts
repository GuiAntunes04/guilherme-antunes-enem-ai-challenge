import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildDifficultyOrFilter,
  normalizeIndexDifficulty,
  parseDifficultyFilter,
} from './enem-difficulty.js'

test('normalizeIndexDifficulty maps null to Média', () => {
  assert.equal(normalizeIndexDifficulty(null), 'Média')
  assert.equal(normalizeIndexDifficulty('Fácil'), 'Fácil')
})

test('parseDifficultyFilter requires at least one difficulty', () => {
  assert.throws(() => parseDifficultyFilter([]), /Selecione ao menos uma/)
})

test('parseDifficultyFilter treats all three as no filter', () => {
  assert.equal(parseDifficultyFilter(['Fácil', 'Média', 'Difícil']), undefined)
})

test('buildDifficultyOrFilter includes null for Média', () => {
  const filter = buildDifficultyOrFilter(['Média'])
  assert.match(filter, /difficulty\.is\.null/)
})
