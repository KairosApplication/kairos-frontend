import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="welcome-card__eyebrow">Área de gestão</p>
        <h1 id="welcome-title">KAIROS</h1>
        <p className="welcome-card__subtitle">Gestão no tempo certo.</p>
        <div className="welcome-card__divider" aria-hidden="true" />
        <p className="welcome-card__description">
          Sua loja conectada para decisões mais inteligentes.
        </p>
      </section>
    </main>
  )
}

export default App
