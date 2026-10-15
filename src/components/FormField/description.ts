export function fieldDescription(id: string, hint?: string, error?: string, describedBy?: string) {
  return [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
}
