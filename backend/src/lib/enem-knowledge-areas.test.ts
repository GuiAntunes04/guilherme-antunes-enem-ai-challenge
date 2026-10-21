import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ENEM_FOREIGN_LANGUAGE_QUOTA,
  getLinguagensQuotasForDayOne,
  isEnemForeignLanguage,
} from './enem-knowledge-areas.js'

test('getLinguagensQuotasForDayOne uses one LE block and 45 linguagens total', () => {
  for (const language of ['Inglês', 'Espanhol'] as const) {
    const quotas = getLinguagensQuotasForDayOne(language)
    const other = language === 'Inglês' ? 'Espanhol' : 'Inglês'

    assert.equal(quotas[language], ENEM_FOREIGN_LANGUAGE_QUOTA)
    assert.equal(quotas[other], 0)
    assert.equal(Object.values(quotas).reduce((sum, n) => sum + n, 0), 45)
  }
})

test('isEnemForeignLanguage validates LE names', () => {
  assert.equal(isEnemForeignLanguage('Inglês'), true)
  assert.equal(isEnemForeignLanguage('Espanhol'), true)
  assert.equal(isEnemForeignLanguage('Português'), false)
})
