import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSubjectAreaPrefixOrFilter,
  matchesTopicPathPrefix,
  normalizeSubjectAreaForTopics,
  topicPathDepth,
  topicPathPrefixes,
  TOPIC_PATH_SEPARATOR,
} from './topic-path.js'

test('topicPathPrefixes builds ancestor paths', () => {
  const full = `História Geral${TOPIC_PATH_SEPARATOR}Idade Contemporânea${TOPIC_PATH_SEPARATOR}Período entre guerras`

  assert.deepEqual(topicPathPrefixes(full), [
    'História Geral',
    `História Geral${TOPIC_PATH_SEPARATOR}Idade Contemporânea`,
    full,
  ])
})

test('matchesTopicPathPrefix includes descendants only', () => {
  const parent = `História Geral${TOPIC_PATH_SEPARATOR}Idade Contemporânea`
  const child = `${parent}${TOPIC_PATH_SEPARATOR}Período entre guerras`

  assert.equal(matchesTopicPathPrefix(child, parent), true)
  assert.equal(matchesTopicPathPrefix(parent, parent), true)
  assert.equal(matchesTopicPathPrefix('História Geral', parent), false)
  assert.equal(matchesTopicPathPrefix('História Geral > Outro', 'História Geral'), true)
})

test('topicPathDepth counts segments', () => {
  assert.equal(topicPathDepth('História Geral'), 0)
  assert.equal(topicPathDepth(`A${TOPIC_PATH_SEPARATOR}B${TOPIC_PATH_SEPARATOR}C`), 2)
})

test('buildSubjectAreaPrefixOrFilter quotes values with spaces', () => {
  const filter = buildSubjectAreaPrefixOrFilter('História Geral')
  assert.match(filter, /subject_area\.eq\."História Geral"/)
  assert.match(filter, /subject_area\.like\."História Geral > %"/)
})

test('normalizeSubjectAreaForTopics prefixes foreign language paths', () => {
  assert.equal(normalizeSubjectAreaForTopics('Inglês', null), 'Inglês')
  assert.equal(normalizeSubjectAreaForTopics('Inglês', '  '), 'Inglês')
  assert.equal(
    normalizeSubjectAreaForTopics('Inglês', 'Interpretação de texto'),
    `Inglês${TOPIC_PATH_SEPARATOR}Interpretação de texto`,
  )
  assert.equal(
    normalizeSubjectAreaForTopics('Inglês', `Inglês${TOPIC_PATH_SEPARATOR}Vocabulário`),
    `Inglês${TOPIC_PATH_SEPARATOR}Vocabulário`,
  )
  assert.equal(normalizeSubjectAreaForTopics('Espanhol', 'Gramática'), `Espanhol${TOPIC_PATH_SEPARATOR}Gramática`)
})

test('normalizeSubjectAreaForTopics leaves other subjects unchanged', () => {
  assert.equal(normalizeSubjectAreaForTopics('Português', 'Gramática'), 'Gramática')
  assert.equal(normalizeSubjectAreaForTopics('Matemática', null), null)
})
