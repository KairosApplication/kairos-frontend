import type { ComponentProps } from 'react'
import './styles.css'

type BadgeProps = ComponentProps<'span'> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' }

export default function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span {...props} className={`ui-badge ui-badge--${tone} ${className}`} />
}
