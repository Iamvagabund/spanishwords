import { Fragment } from 'react'

/** Renders plain text with `\n` line breaks and `**bold**` only. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/)
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
              <strong key={j} className="font-extrabold text-ink">{part.slice(2, -2)}</strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </span>
  )
}
