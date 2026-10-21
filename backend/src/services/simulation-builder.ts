import {
  getDaySimulationQuestionTarget,
  isEnemForeignLanguage,
} from '../lib/enem-knowledge-areas.js'
import type { EnemHubQuestion } from '../types/enemhub.js'
import type { EssayTheme } from '../types/essay.js'
import type { SimulationMode, StartSimulationBody } from '../types/simulation.js'
import { resolveEssayTimeLimitSeconds, TIME_ESSAY_SECONDS } from '../types/simulation.js'
import { generateEssayTheme } from './gemini.js'
import { sortLikeEnem } from './enemhub-api.js'
import { resolveQuestionsByIds } from './question-index.js'
import {
  assertKnownPracticeSubjectArea,
  assertKnownPracticeSubjectName,
  pickQuestionIdsBySubjectArea,
  pickQuestionIdsBySubjectName,
  pickQuestionIdsForDaySimulation,
} from './question-index.js'

export type PlannedSimulation = {
  questionIds: string[]
  examYear: number | null
  yearsUsed: number[]
  discipline: string
  subjectId: string | null
  timeLimitSeconds: number | null
  essayTheme?: EssayTheme
}

export type BuildSimulationOptions = {
  userId?: string
}

function resolveTimeLimitSeconds(body: StartSimulationBody): number | null {
  const value = body.timeLimitSeconds
  if (value === null || value === undefined || value <= 0) {
    return null
  }
  return value
}

export async function planSimulation(
  body: StartSimulationBody,
  options: BuildSimulationOptions = {},
): Promise<PlannedSimulation> {
  const mode = body.mode ?? 'subject_practice'

  switch (mode) {
    case 'subject_practice': {
      const subjectArea = String(body.subjectArea ?? '').trim()
      const subjectName = String(body.subjectName ?? '').trim()
      const questionCount =
        body.questionCount === null || body.questionCount === undefined
          ? null
          : Number(body.questionCount)

      if (subjectArea && subjectName) {
        throw new Error('Informe subjectArea ou subjectName, não ambos')
      }

      if (!subjectArea && !subjectName) {
        throw new Error('subjectArea or subjectName is required')
      }

      if (questionCount !== null && (questionCount < 1 || !Number.isFinite(questionCount))) {
        throw new Error('questionCount must be at least 1 or omitted for all questions')
      }

      if (subjectName) {
        await assertKnownPracticeSubjectName(subjectName)
      } else {
        await assertKnownPracticeSubjectArea(subjectArea)
      }

      const { ids, yearsUsed } = subjectName
        ? await pickQuestionIdsBySubjectName(subjectName, questionCount)
        : await pickQuestionIdsBySubjectArea(subjectArea, questionCount)

      if (ids.length === 0) {
        throw new Error(
          subjectName
            ? 'Nenhuma questão encontrada para esta matéria'
            : 'Nenhuma questão encontrada para este tópico',
        )
      }

      return {
        questionIds: ids,
        examYear: null,
        yearsUsed,
        discipline: subjectName || subjectArea,
        subjectId: null,
        timeLimitSeconds: resolveTimeLimitSeconds(body),
      }
    }

    case 'day_one': {
      if (!options.userId) {
        throw new Error('userId is required for day simulations')
      }

      const foreignLanguage = body.foreignLanguage
      if (!foreignLanguage || !isEnemForeignLanguage(foreignLanguage)) {
        throw new Error('Escolha Inglês ou Espanhol para o 1º dia do ENEM')
      }

      const { ids, yearsUsed, missingSubjects } = await pickQuestionIdsForDaySimulation(
        mode,
        options.userId,
        { foreignLanguage },
      )

      const questionTarget = getDaySimulationQuestionTarget(mode)

      if (ids.length === 0) {
        throw new Error('Nenhuma questão encontrada para este dia de prova')
      }

      if (missingSubjects.length > 0 || ids.length < questionTarget) {
        throw new Error(
          `Questões insuficientes para um simulado completo (${ids.length}/${questionTarget}): ${missingSubjects.join(', ')}`,
        )
      }

      return {
        questionIds: ids,
        examYear: null,
        yearsUsed,
        discipline: `1º dia ENEM · ${foreignLanguage}`,
        subjectId: null,
        timeLimitSeconds: resolveTimeLimitSeconds(body),
      }
    }

    case 'day_two': {
      if (!options.userId) {
        throw new Error('userId is required for day simulations')
      }

      const { ids, yearsUsed, missingSubjects } = await pickQuestionIdsForDaySimulation(
        mode,
        options.userId,
      )

      const questionTarget = getDaySimulationQuestionTarget(mode)

      if (ids.length === 0) {
        throw new Error('Nenhuma questão encontrada para este dia de prova')
      }

      if (missingSubjects.length > 0 || ids.length < questionTarget) {
        throw new Error(
          `Questões insuficientes para um simulado completo (${ids.length}/${questionTarget}): ${missingSubjects.join(', ')}`,
        )
      }

      return {
        questionIds: ids,
        examYear: null,
        yearsUsed,
        discipline: '2º dia ENEM',
        subjectId: null,
        timeLimitSeconds: resolveTimeLimitSeconds(body),
      }
    }

    case 'essay': {
      const theme = await generateEssayTheme()
      const timeLimitSeconds = resolveEssayTimeLimitSeconds(body.timeLimitSeconds, {
        defaultWhenMissing: TIME_ESSAY_SECONDS,
      })

      return {
        questionIds: [],
        examYear: null,
        yearsUsed: [],
        discipline: 'Redação ENEM',
        subjectId: null,
        timeLimitSeconds,
        essayTheme: theme,
      }
    }

    default:
      throw new Error('Invalid simulation mode')
  }
}

export async function loadSimulationQuestions(
  questionIds: string[],
  mode: SimulationMode,
): Promise<EnemHubQuestion[]> {
  const hubQuestions = await resolveQuestionsByIds(questionIds)
  const questionMap = new Map(hubQuestions.map((question) => [question.id, question]))
  const ordered = questionIds.flatMap((id) => {
    const question = questionMap.get(id)
    return question ? [question] : []
  })

  if (mode === 'day_two') {
    return sortLikeEnem(ordered)
  }

  return ordered
}

export function isValidMode(mode: string): mode is SimulationMode {
  return ['subject_practice', 'day_one', 'day_two', 'essay'].includes(mode)
}
