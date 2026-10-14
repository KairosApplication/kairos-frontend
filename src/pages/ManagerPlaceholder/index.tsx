import PageHeader from '../../components/PageHeader'
import './styles.css'

type ManagerPlaceholderProps = {
  title: string
  description: string
}

function ManagerPlaceholder({ title, description }: ManagerPlaceholderProps) {
  return (
    <main className="manager-page">
      <PageHeader title={title} description={description} />
      <p className="manager-page__placeholder">Esta área ainda não está disponível.</p>
    </main>
  )
}

export default ManagerPlaceholder
