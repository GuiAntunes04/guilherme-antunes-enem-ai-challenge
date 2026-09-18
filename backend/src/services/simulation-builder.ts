import type { EnemHubQuestion } from '../types/enemhub.js'
import type { SimulationMode, StartSimulationBody } from '../types/simulation.js'
import { getKnowledgeAreasForDay } from '../lib/enem-knowledge-areas.js'
import { QUESTIONS_PER_AREA, TIME_DAY_SECONDS } from '../types/simulation.js'
import { fetchQuestionsByIds, sortLikeEnem } from './enemhub-api.js'
import { pickQuestionIdsBySubjectArea, pickQuestionIdsForDay } from './question-index.js'

export type BuiltSimulation = {
  questions: EnemHubQuestion[]
  examYear: number | null
  yearsUsed: number[]
  discipline: string
  subjectId: string | null
  timeLimitSeconds: number | null
}

async function resolveQuestionsInOrder(ids: string[]): Promise<EnemHubQuestion[]> {
  const hubQuestions = await fetchQuestionsByIds(ids)
  const questionMap = new Map(hubQuestions.map((q) => [q.id, q]))
  return ids.flatMap((id) => {
    const question = questionMap.get(id)
    return question ? [question] : []
  })
}

function resolveTimeLimitSeconds(
  body: StartSimulationBody,
): number | null {
  const value = body.timeLimitSeconds
  if (value === null || value === undefined || value <= 0) {
    return null
  }
  return value
}

export async function buildSimulation(
  body: StartSimulationBody,
): Promise<BuiltSimulation> {
  const mode = body.mode ?? 'subject_practice'

  switch (mode) {
    case 'subject_practice': {
      const subjectArea = String(body.subjectArea ?? '').trim()
      const questionCount =
        body.questionCount === null || body.questionCount === undefined
          ? null
          : Number(body.questionCount)

      if (!subjectArea) {
        throw new Error('subjectArea is required')
      }

      if (questionCount !== null && (questionCount < 1 || !Number.isFinite(questionCount))) {
        throw new Error('questionCount must be at least 1 or omitted for all questions')
      }

      const { ids, yearsUsed } = await pickQuestionIdsBySubjectArea(
        subjectArea,
        questionCount,
      )

      if (ids.length === 0) {
        throw new Error('No questions found for this subject area')
      }

      const questions = await resolveQuestionsInOrder(ids)

      return {
        questions,
        examYear: null,
        yearsUsed,
        discipline: subjectArea,
        subjectId: null,
        timeLimitSeconds: resolveTimeLimitSeconds(body),
      }
    }

    case 'day_one':
    case 'day_two': {
      const examYear = Number(body.examYear)
      if (!examYear) {
        throw new Error('examYear is required')
      }

      const areas = getKnowledgeAreasForDay(mode)
      const { ids, missingAreas } = await pickQuestionIdsForDay(
        examYear,
        areas,
        QUESTIONS_PER_AREA,
      )

      if (ids.length === 0) {
        throw new Error('No questions found for this exam day and year')
      }

      if (missingAreas.length > 0) {
        throw new Error(
          `Not enough questions for ENEM ${examYear}: missing ${missingAreas.join(', ')}`,
        )
      }

      const questions = sortLikeEnem(await resolveQuestionsInOrder(ids))

      return {
        questions,
        examYear,
        yearsUsed: [examYear],
        discipline: mode === 'day_one' ? '1º dia ENEM' : '2º dia ENEM',
        subjectId: null,
        timeLimitSeconds: TIME_DAY_SECONDS,
      }
    }

    default:
      throw new Error('Invalid simulation mode')
  }
}

export function isValidMode(mode: string): mode is SimulationMode {
  return ['subject_practice', 'day_one', 'day_two'].includes(mode)
}
