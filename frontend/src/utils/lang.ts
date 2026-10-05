import type { Block, LangProgress, Language } from '../types'

/**
 * "Іспанська" -> "іспанською", "Англійська" -> "англійською".
 * Used in phrases like "Введіть слово англійською".
 */
export function langAdverb(language: Pick<Language, 'name'> | undefined): string {
  const name = (language?.name || '').trim().toLowerCase()
  if (!name) return 'мовою оригіналу'
  if (name.endsWith('ька') || name.endsWith('ська') || name.endsWith('цька')) return name.slice(0, -1) + 'ою'
  return `мовою «${language!.name}»`
}

/** Blocks the user can open: first block and every block whose predecessor (by order) is completed. */
export function blockState(blocks: Block[], progress: LangProgress) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order)
  const completed = new Map(progress.completedBlocks.map(c => [c.blockId, c]))
  const isLocked = (block: Block) => {
    const i = sorted.findIndex(b => b.id === block.id)
    return i > 0 && !completed.has(sorted[i - 1].id) && !completed.has(block.id)
  }
  const next = sorted.find(b => !completed.has(b.id) && !isLocked(b))
  return { sorted, completed, isLocked, next }
}
