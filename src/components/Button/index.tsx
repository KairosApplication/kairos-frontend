import type { ComponentProps, ReactNode } from 'react'
import './styles.css'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
  loading?: boolean
  loadingLabel?: string
}

export default function Button({ variant = 'primary', icon, loading = false, loadingLabel = 'Aguarde…',
  disabled, children, className = '', type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
    className={`ui-button ui-button--${variant} ${className}`}>
    {icon && <span className="ui-button__icon" aria-hidden="true">{icon}</span>}
    {loading ? loadingLabel : children}
  </button>
}
