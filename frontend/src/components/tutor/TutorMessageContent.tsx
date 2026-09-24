import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

type TutorMessageContentProps = {
  content: string
  variant?: 'user' | 'assistant'
}

export function TutorMessageContent({
  content,
  variant = 'assistant',
}: TutorMessageContentProps) {
  const isUser = variant === 'user'

  return (
    <div
      className={`text-sm leading-relaxed [&_.katex]:text-[1em] ${
        isUser ? 'text-white' : 'text-muted-foreground'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code
              className={`rounded px-1 py-0.5 text-[0.85em] ${
                isUser ? 'bg-accent-strong/70' : 'bg-surface-overlay text-accent-soft'
              }`}
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
