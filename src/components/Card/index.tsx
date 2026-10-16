import { useId, type ComponentProps, type ReactNode } from 'react'
import './styles.css'

type CardProps = Omit<ComponentProps<'section'>, 'title'> & {
  title?: string
  description?: string
  actions?: ReactNode
  tone?: 'default' | 'brand' | 'warm'
}

export default function Card({ title, description, actions, tone = 'default', children, className = '', ...props }: CardProps) {
  const titleId = useId()
  return <section {...props} aria-labelledby={title ? titleId : props['aria-labelledby']}
    className={`ui-card ui-card--${tone} ${className}`}>
    {(title || description || actions) && <header className="ui-card__header">
      <div>{title && <h2 id={titleId}>{title}</h2>}{description && <p>{description}</p>}</div>
      {actions && <div className="ui-card__actions">{actions}</div>}
    </header>}
    {children}
  </section>
}
