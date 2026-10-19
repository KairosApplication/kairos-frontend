import type { ReactNode } from 'react'
import PageHeader from '../PageHeader'
import './styles.css'

type VisualPageProps = { title: string; description: string; actions?: ReactNode; children: ReactNode; className?: string }

export default function VisualPage({ title, description, actions, children, className = '' }: VisualPageProps) {
  return <main className={`visual-page ${className}`}>
    <PageHeader title={title} description={description} actions={actions} />
    {children}
    <footer className="visual-page__footer"><span>Mercado Aurora · Unidade Centro</span><span>Dados demonstrativos · 25 set 2026, 14:32</span></footer>
  </main>
}
