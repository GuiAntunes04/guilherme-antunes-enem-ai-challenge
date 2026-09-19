import type { TutorMessage } from '../../types/tutor'
import { TutorMessageContent } from './TutorMessageContent'

type TutorMessageListProps = {
  messages: TutorMessage[]
  sending?: boolean
}

export function TutorMessageList({ messages, sending = false }: TutorMessageListProps) {
  if (messages.length === 0 && !sending) {
    return (
      <p className="text-sm text-slate-500">
        Faça uma pergunta sobre a questão ou o conteúdo. O tutor não revelará a resposta correta
        durante o simulado.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isUser = message.role === 'user'

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-3 py-2 ${
                isUser
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-200'
              }`}
            >
              <TutorMessageContent
                content={message.content}
                variant={isUser ? 'user' : 'assistant'}
              />
            </div>
          </div>
        )
      })}

      {sending && (
        <div className="flex justify-start">
          <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400">
            Pensando...
          </div>
        </div>
      )}
    </div>
  )
}
