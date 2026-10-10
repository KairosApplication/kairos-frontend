type RoutePlaceholderProps = {
  title: string
}

function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return (
    <main className="route-page">
      <section className="route-card" aria-labelledby="route-title">
        <p className="route-card__eyebrow">KAIROS · Área de gestão</p>
        <h1 id="route-title">{title}</h1>
        <p className="route-card__description">
          Esta área ainda não está disponível.
        </p>
      </section>
    </main>
  )
}

export default RoutePlaceholder
