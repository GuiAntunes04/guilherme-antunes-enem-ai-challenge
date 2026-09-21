import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'
import type { EssayFeedback, EssayTheme } from '../types/essay.js'
import {
  getEssayEvaluationSystemPrompt,
  getEssayOcrSystemPrompt,
  getEssayThemeSystemPrompt,
} from './essay-prompt.js'

export type TutorChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const MAX_HISTORY_MESSAGES = 20

function getClient(): GoogleGenerativeAI {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada no backend')
  }

  return new GoogleGenerativeAI(env.geminiApiKey)
}

function truncateHistory(messages: TutorChatMessage[]): TutorChatMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES)
}

export async function generateTutorReply(
  systemPrompt: string,
  history: TutorChatMessage[],
  userMessage: string,
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
  })

  const chat = model.startChat({
    history: truncateHistory(history).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  })

  const result = await chat.sendMessage(userMessage)
  const text = result.response.text().trim()

  if (!text) {
    throw new Error('Gemini retornou resposta vazia')
  }

  return text
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] ?? trimmed).trim()
}

function parseJsonResponse<T>(text: string): T {
  const cleaned = stripJsonFence(text)
  return JSON.parse(cleaned) as T
}

export async function generateEssayTheme(): Promise<EssayTheme> {
  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: getEssayThemeSystemPrompt(),
  })

  const result = await model.generateContent(
    'Gere um novo tema de redação dissertativo-argumentativa para prática do ENEM.',
  )
  const text = result.response.text().trim()

  if (!text) {
    throw new Error('Gemini retornou tema vazio')
  }

  const theme = parseJsonResponse<EssayTheme>(text)

  if (!theme.title?.trim() || !Array.isArray(theme.motivators) || theme.motivators.length < 2) {
    throw new Error('Formato de tema inválido retornado pelo Gemini')
  }

  return {
    title: theme.title.trim(),
    motivators: theme.motivators.map((item) => String(item).trim()).filter(Boolean).slice(0, 3),
  }
}

export async function evaluateEssay(theme: string, content: string): Promise<EssayFeedback> {
  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: getEssayEvaluationSystemPrompt(theme, content),
  })

  const result = await model.generateContent('Avalie a redação conforme instruções.')
  const text = result.response.text().trim()

  if (!text) {
    throw new Error('Gemini retornou correção vazia')
  }

  const feedback = parseJsonResponse<EssayFeedback>(text)
  const competencies = feedback.competencias

  if (!competencies?.c1 || !competencies.c2 || !competencies.c3 || !competencies.c4 || !competencies.c5) {
    throw new Error('Correção incompleta retornada pelo Gemini')
  }

  const notaTotal = Object.values(competencies).reduce((sum, item) => sum + (item.nota ?? 0), 0)

  return {
    competencias: competencies,
    nota_total: feedback.nota_total ?? notaTotal,
    comentario_geral: feedback.comentario_geral?.trim() || 'Correção concluída.',
  }
}

export async function extractEssayTextFromImage(
  base64Data: string,
  mimeType: string,
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: getEssayOcrSystemPrompt(),
  })

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: 'Extraia o texto desta redação.' },
  ])

  const text = result.response.text().trim()
  if (!text) {
    throw new Error('Não foi possível extrair texto da imagem')
  }

  return text
}
