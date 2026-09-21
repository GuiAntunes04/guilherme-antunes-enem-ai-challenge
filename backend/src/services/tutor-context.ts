import type { SanitizedQuestion } from '../types/enemhub.js'
import { sanitizeQuestion } from './enemhub-api.js'
import { resolveQuestionsByIds } from './question-index.js'

function stripHtml(html: string): string {
  return html
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, ' [imagem] ')
    .replace(/<img[^>]*>/gi, ' [imagem] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatQuestionContext(question: SanitizedQuestion): string {
  const alternatives = question.alternatives
    .map((alt) => `${alt.letter}) ${alt.text}`)
    .join('\n')

  return [
    `Matéria: ${question.subjectName ?? 'Não informada'}`,
    `Tópico: ${question.subjectArea ?? 'Não informado'}`,
    `Ano: ENEM ${question.year}`,
    `Dificuldade: ${question.difficulty}`,
    '',
    'Enunciado:',
    stripHtml(question.statement),
    '',
    'Alternativas:',
    alternatives,
  ].join('\n')
}

export async function buildQuestionContextFromId(questionId: string): Promise<string> {
  const [question] = await resolveQuestionsByIds([questionId])
  if (!question) {
    throw new Error('Questão não encontrada no índice')
  }
  return formatQuestionContext(sanitizeQuestion(question))
}
