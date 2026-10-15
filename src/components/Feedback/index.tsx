import { CircleAlert, PackageSearch } from 'lucide-react'
import Button from '../Button'
import './styles.css'

type FeedbackProps = { kind: 'loading' | 'empty' | 'error'; title: string; description?: string; onRetry?: () => void }

export default function Feedback({ kind, title, description, onRetry }: FeedbackProps) {
  return <div className={`ui-feedback ui-feedback--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {kind !== 'loading' && <span className="ui-feedback__icon" aria-hidden="true">{kind === 'error' ? <CircleAlert /> : <PackageSearch />}</span>}
    {kind === 'loading' && <div className="ui-feedback__skeleton" aria-hidden="true"><span /><span /><span /></div>}
    <p className="ui-feedback__title">{title}</p>
    {description && <p className="ui-feedback__description">{description}</p>}
    {kind === 'error' && onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}
  </div>
}
