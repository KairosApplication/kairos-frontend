import { useId, useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import type { DailyOperation } from '../../services/operationalAnalyticsService'
export default function SalesChart({ points }: { points: readonly DailyOperation[] }) {
  const id = useId(); const [open, setOpen] = useState(false)
  const maximum = Math.max(1, ...points.map(p => p.value))
  const coordinates = points.map((p, i) => ({ ...p, x: 50 + i * 570 / Math.max(1, points.length - 1), y: 148 - p.value / maximum * 130 }))
  return <figure className="dashboard-chart"><svg className="dashboard-chart__plot" viewBox="0 0 640 176" role="img" aria-labelledby={id}><title id={id}>Unidades registradas sem avarias nos últimos sete dias</title>
    {[0, 1, 2].map(i => <g key={i}><line x1="50" x2="620" y1={148 - i * 65} y2={148 - i * 65} className="dashboard-chart__grid" /><text x="40" y={152 - i * 65} textAnchor="end" className="dashboard-chart__axis">{Math.round(maximum * i / 2)}</text></g>)}
    <polyline points={coordinates.map(p => `${p.x},${p.y}`).join(' ')} className="dashboard-chart__line" />{coordinates.map(p => <g key={p.date}><circle cx={p.x} cy={p.y} r="3.5" className="dashboard-chart__point"><title>{p.label}: {p.value} unidades</title></circle><text x={p.x} y="170" textAnchor="middle" className="dashboard-chart__axis">{p.label}</text></g>)}</svg>
    <figcaption><button type="button" className="dashboard-chart__values" onClick={() => setOpen(true)}>Ver valores por dia</button></figcaption>
    <Modal open={open} onClose={() => setOpen(false)} title="Registros por dia" actions={<Button onClick={() => setOpen(false)}>Fechar</Button>}><table className="dashboard-chart__table"><caption>Unidades registradas sem avarias</caption><thead><tr><th scope="col">Data</th><th scope="col">Unidades</th></tr></thead><tbody>{points.map(p => <tr key={p.date}><th scope="row">{p.date}</th><td>{p.value}</td></tr>)}</tbody></table></Modal>
  </figure>
}
