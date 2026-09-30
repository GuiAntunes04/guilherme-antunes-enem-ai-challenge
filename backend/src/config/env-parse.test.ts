import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApiKeyList, buildModelList, parseCsvList } from './env-parse.js'

test('parseCsvList splits and trims comma-separated values', () => {
  assert.deepEqual(parseCsvList(' a , b ,c '), ['a', 'b', 'c'])
  assert.deepEqual(parseCsvList(undefined), [])
  assert.deepEqual(parseCsvList('   '), [])
})

test('buildApiKeyList deduplicates primary and extras', () => {
  assert.deepEqual(buildApiKeyList('key1', 'key2, key1'), ['key1', 'key2'])
  assert.deepEqual(buildApiKeyList(undefined, 'only-extra'), ['only-extra'])
})

test('buildModelList keeps primary first and deduplicates fallbacks', () => {
  assert.deepEqual(buildModelList('model-a', 'model-b, model-a', 'default'), [
    'model-a',
    'model-b',
  ])
  assert.deepEqual(buildModelList(undefined, undefined, 'default-model'), ['default-model'])
})
