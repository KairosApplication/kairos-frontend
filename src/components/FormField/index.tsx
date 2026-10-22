import type { ReactNode } from 'react'
import './styles.css'

export type FieldDetails = { label: string; hint?: string; error?: string }

export default function FormField({ id, label, hint, error, required, children }: FieldDetails & { id: string; required?: boolean; children: ReactNode }) {
  return <div className={`ui-field${error ? ' ui-field--error' : ''}`}>
    <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}
    {hint && <p id={`${id}-hint`} className="ui-field__hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="ui-field__error" role="alert">{error}</p>}
  </div>
}
