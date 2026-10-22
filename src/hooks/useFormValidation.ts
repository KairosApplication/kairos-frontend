import { useLayoutEffect, useRef, useState } from 'react'

type Errors = Record<string, string>

export default function useFormValidation() {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submission, setSubmission] = useState(0)

  useLayoutEffect(() => {
    if (submission) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [submission])

  function reject(next: Errors) { setErrors(next); setSubmission(value => value + 1) }
  function clear(name: string) { setErrors(previous => { const next = { ...previous }; delete next[name]; return next }) }
  function validate(form: HTMLFormElement) {
    const next: Errors = {}
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || !element.name || element.disabled) continue
      if (element.required && !element.value.trim()) next[element.name] = 'Preencha este campo.'
      else if (element instanceof HTMLInputElement && element.type === 'email' && element.validity.typeMismatch) next[element.name] = 'Informe um e-mail válido.'
      else if (element.validity.rangeUnderflow && element instanceof HTMLInputElement) next[element.name] = `Informe um valor de pelo menos ${element.min}.`
      else if (element.validity.rangeOverflow && element instanceof HTMLInputElement) next[element.name] = `Informe um valor de no máximo ${element.max}.`
      else if (!element.validity.valid) next[element.name] = 'Confira o valor informado.'
    }
    if (Object.keys(next).length) { reject(next); return false }
    setErrors({}); return true
  }
  return { formRef, errors, validate, reject, clear, reset: () => setErrors({}) }
}
