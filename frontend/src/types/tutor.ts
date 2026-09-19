export type TutorSession = {
  id: string
  title: string | null
  simulationAttemptId: string | null
  questionId: string | null
  createdAt: string
  updatedAt: string
  isSimulation: boolean
}

export type TutorMessage = {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type TutorMessagesResponse = {
  session: TutorSession
  messages: TutorMessage[]
}

export type SendTutorMessageResponse = {
  reply: string
  messages: TutorMessage[]
}
