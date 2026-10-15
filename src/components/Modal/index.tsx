import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { X } from 'lucide-react'
import Button from '../Button'
import './styles.css'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  initialFocusRef?: RefObject<HTMLElement | null>
}

export default function Modal({ open, onClose, title, description, children, actions, initialFocusRef }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    const focusTarget = initialFocusRef?.current ?? heading.current
    focusTarget?.focus()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open, initialFocusRef])

  return <dialog ref={dialog} className="ui-modal" aria-labelledby={`${id}-title`}
    aria-describedby={description ? `${id}-description` : undefined}
    onKeyDown={(event) => {
      if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((control) => control.tabIndex >= 0 && control.getClientRects().length > 0
        && getComputedStyle(control).visibility !== 'hidden' && !control.closest('[inert]'))
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first) { event.preventDefault(); heading.current?.focus(); return }
      const active = document.activeElement
      if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (active === last || !controls.includes(active as HTMLElement))) {
        event.preventDefault(); first.focus()
      }
    }}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <div className="ui-modal__header">
      <div><h2 ref={heading} tabIndex={-1} id={`${id}-title`}>{title}</h2>
        {description && <p id={`${id}-description`}>{description}</p>}</div>
      <Button variant="ghost" aria-label="Fechar janela" onClick={onClose}><X size={20} aria-hidden="true" /></Button>
    </div>
    <div className="ui-modal__body">{children}</div>
    {actions && <footer className="ui-modal__actions">{actions}</footer>}
  </dialog>
}
