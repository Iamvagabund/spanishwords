import { Fragment, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BlockTip } from '../types'
import type { Tone } from '../theme/palette'

/** Renders plain text with `\n` line breaks and `**bold**` — no HTML injection. */
export function TipText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={pi > 0 ? 'mt-2.5' : ''}>
          {para.split('\n').map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <br />}
              {renderBold(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  )
}

function renderBold(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-extrabold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

export function TipCard({ tip, tone }: { tip: BlockTip; tone: Tone }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`mt-5 rounded-3xl bg-gradient-to-br ${tone.gradient} p-[2px] shadow-soft`}
      aria-label="Порада"
    >
      <div className="rounded-[calc(1.5rem-2px)] bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.gradient} text-2xl shadow-soft`}>💡</span>
          <div className="min-w-0">
            <p className={`text-xs font-extrabold uppercase tracking-wider ${tone.text}`}>Порада</p>
            <h2 className="text-lg font-extrabold leading-tight text-ink">{tip.title}</h2>
          </div>
        </div>
        <div className="mt-3 text-[15px] leading-relaxed text-ink-2">
          <TipText text={tip.body} />
        </div>
      </div>
    </motion.section>
  )
}

export function TipButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-icon shrink-0 text-xl" aria-label="Показати пораду" title="Порада">
      💡
    </button>
  )
}

export function TipSheet({ tip, tone, open, onClose }: { tip: BlockTip; tone: Tone; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={tip.title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-line bg-surface p-6 pb-safe shadow-lift sm:rounded-4xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.gradient} text-2xl shadow-soft`}>💡</span>
              <div className="min-w-0">
                <p className={`text-xs font-extrabold uppercase tracking-wider ${tone.text}`}>Порада</p>
                <h2 className="text-xl font-extrabold leading-tight">{tip.title}</h2>
              </div>
            </div>
            <div className="mt-4 text-[15px] leading-relaxed text-ink-2">
              <TipText text={tip.body} />
            </div>
            <button className="btn btn-lg btn-primary mb-4 mt-6 w-full" onClick={onClose} autoFocus>
              Зрозуміло
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
