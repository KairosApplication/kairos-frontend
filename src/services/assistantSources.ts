import type { AnswerSource } from '../types/assistantView'

export function publicSources(value: unknown): AnswerSource[] {
  if (!Array.isArray(value)) return []
  return (['pdf', 'database', 'memory'] as const).filter(source => value.includes(source))
}
