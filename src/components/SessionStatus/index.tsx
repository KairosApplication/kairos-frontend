import Button from '../Button'
import './styles.css'

type SessionStatusProps = {
  error?: string | null
  onRetry: () => Promise<void>
}

function SessionStatus({ error, onRetry }: SessionStatusProps) {
  return (
    <main className="route-page" aria-busy={!error}>
      <section className="route-card" aria-labelledby="session-title">
        <h1 id="session-title">{error ? 'Não foi possível verificar seu acesso' : 'Verificando seu acesso'}</h1>
        {error ? <>
          <p className="route-card__description" role="alert">{error}</p>
          <Button className="session-status__retry" onClick={() => void onRetry()}>Tentar novamente</Button>
        </> : <p className="route-card__description" role="status">Aguarde enquanto confirmamos sua sessão.</p>}
      </section>
    </main>
  )
}

export default SessionStatus
