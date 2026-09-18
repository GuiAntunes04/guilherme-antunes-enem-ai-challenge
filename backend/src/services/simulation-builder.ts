import type { EnemHubQuestion } from '../types/enemhub.js'
import type { SimulationMode, StartSimulationBody } from '../types/simulation.js'
import {
  DAY_ONE_AREAS,
  DAY_TWO_AREAS,
  QUESTIONS_PER_AREA,
  TIME_AREA_SECONDS,
  TIME_DAY_SECONDS,
} from '../types/simulation.js'
import { fetchQuestionsByIds, sortLikeEnem } from './enemhub-api.js'
import { pickQuestionIdsBySubject, pickQuestionIdsForDay } from './question-index.js'

export type BuiltSimulation = {
  questions: EnemHubQuestion[]
  examYear: number | null
  yearsUsed: number[]
  discipline: string
  subjectId: string | null
  timeLimitSeconds: number
}

async function resolveQuestionsInOrder(ids: string[]): Promise<EnemHubQuestion[]> {
  const hubQuestions = await fetchQuestionsByIds(ids)
  const questionMap = new Map(hubQuestions.map((q) => [q.id, q]))
  return ids.flatMap((id) => {
    const question = questionMap.get(id)
    return question ? [question] : []
  })
}

export async function buildSimulation(
  body: StartSimulationBody,
): Promise<BuiltSimulation> {
  const mode = body.mode ?? 'subject_practice'

  switch (mode) {
    case 'subject_practice': {
      const examYear = Number(body.examYear)
      const subjectId = String(body.subjectId ?? '')
      const questionCount = Number(body.questionCount ?? QUESTIONS_PER_AREA)

      if (!examYear || !subjectId) {
        throw new Error('examYear and subjectId are required')
      }
      if (questionCount < 1 || questionCount > QUESTIONS_PER_AREA) {
        throw new Error('questionCount must be between 1 and 45')
      }

      const { ids, subjectName } = await pickQuestionIdsBySubject(
        examYear,
        subjectId,
        questionCount,
      )

      if (ids.length === 0) {
        throw new Error('No questions found for this subject and year')
      }

      const questions = await resolveQuestionsInOrder(ids)

      return {
        questions,
        examYear,
        yearsUsed: [examYear],
        discipline: subjectName,
        subjectId,
        timeLimitSeconds:
          questionCount >= QUESTIONS_PER_AREA
            ? TIME_AREA_SECONDS
            : questionCount * 3 * 60,
      }
    }

    case 'day_one':
    case 'day_two': {
      const examYear = Number(body.examYear)
      if (!examYear) {
        throw new Error('examYear is required')
      }

      const areas = mode === 'day_one' ? DAY_ONE_AREAS : DAY_TWO_AREAS
      const ids = await pickQuestionIdsForDay(examYear, areas, QUESTIONS_PER_AREA)

      if (ids.length === 0) {
        throw new Error('No questions found for this exam day and year')
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
