import type { ReactNode } from 'react'
import './styles.css'

type PageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export default PageHeader
