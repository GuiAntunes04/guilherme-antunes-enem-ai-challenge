import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyGeminiError } from './gemini-error.js'

test('classifyGeminiError detects quota and overload', () => {
  assert.equal(classifyGeminiError({ status: 429, message: 'Too Many Requests' }), 'quota')
  assert.equal(classifyGeminiError(new Error('Resource exhausted')), 'quota')
  assert.equal(classifyGeminiError({ status: 503, message: 'Service Unavailable' }), 'overload')
  assert.equal(classifyGeminiError(new Error('The model is overloaded')), 'overload')
  assert.equal(classifyGeminiError(new Error('Invalid API key')), 'fatal')
})
