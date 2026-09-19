import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'

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
