import { Link } from 'react-router'
import Feedback from '../Feedback'
import useApiData from '../../hooks/useApiData'
import { getAlerts } from '../../services/alertsApiService'
export default function Alerts({ onNavigate }: { onNavigate: () => void }) {
  const { data, error, reload } = useApiData(getAlerts)
  return <>{error ? <Feedback kind="error" title="Não foi possível carregar os alertas." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando alertas…" /> : data.length ? <><p role="status">{data.length} alertas abertos. Exibindo até 20.</p><ul>{data.slice(0, 20).map(a => <li key={a.id}><Link to={`/mapa?gondola=${a.shelfId}`} onClick={onNavigate}>{a.description}<small>Gôndola {a.shelfId}{a.stockoutDate ? ` · ${a.stockoutDate}` : ''}</small></Link></li>)}</ul></> : <p>Nenhum alerta aberto para os vínculos do catálogo.</p>}</>
}
