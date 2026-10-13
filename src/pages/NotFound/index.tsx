import { Link } from 'react-router'

function NotFound() {
  return (
    <main className="route-page">
      <section className="route-card" aria-labelledby="not-found-title">
        <p className="route-card__eyebrow">Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p className="route-card__description">
          O endereço acessado não corresponde a uma página do KAIROS.
        </p>
        <Link className="route-card__link" to="/login">
          Voltar ao início
        </Link>
      </section>
    </main>
  )
}

export default NotFound
