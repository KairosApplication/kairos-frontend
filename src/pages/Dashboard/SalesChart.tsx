import { useId, useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import type { SalesPoint } from './demo'
import { currency } from './demo'

export default function SalesChart({ points }: { points: readonly SalesPoint[] }) {
  const id = useId()
  const [valuesOpen, setValuesOpen] = useState(false)
  const ceiling = Math.max(60000, ...points.map((point) => point.value))
  const coordinates = points.map((point, index) => ({
    ...point, x: 48 + index * 584 / Math.max(1, points.length - 1), y: 12 + (1 - point.value / ceiling) * 136,
  }))
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(' ')
  return <figure className="dashboard-chart">
    <svg className="dashboard-chart__plot" viewBox="0 0 640 176" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Receita demonstrativa dos últimos sete dias</title>
      <desc id={`${id}-description`}>De sábado a sexta-feira. Ative o gráfico para consultar os valores exatos em uma tabela.</desc>
      {[0, 1, 2, 3].map((tick) => {
        const y = 148 - tick * 136 / 3
        return <g key={tick}><line x1="48" x2="632" y1={y} y2={y} className="dashboard-chart__grid" />
          <text x="40" y={y + 4} textAnchor="end" className="dashboard-chart__axis">{tick === 0 ? 'R$ 0' : <><tspan className="dashboard-chart__currency">R$ </tspan>{Math.round(ceiling * tick / 3000)} mil</>}</text></g>
      })}
      {coordinates.length > 0 && <>
        <polygon points={`48,148 ${line} ${coordinates[coordinates.length - 1].x},148`} className="dashboard-chart__area" />
        <polyline points={line} className="dashboard-chart__line" />
      </>}
      {coordinates.map((point) => <g key={point.date}>
        <circle cx={point.x} cy={point.y} r="3.5" className="dashboard-chart__point"><title>{point.label}: {currency.format(point.value)}</title></circle>
        <text x={point.x} y="170" textAnchor="middle" className="dashboard-chart__axis">{point.label}</text>
      </g>)}
    </svg>
    <figcaption><button className="dashboard-chart__values" type="button" aria-haspopup="dialog"
      onClick={() => setValuesOpen(true)}>Ver valores por dia</button></figcaption>
    <Modal open={valuesOpen} onClose={() => setValuesOpen(false)} title="Receita por dia"
      description="Valores demonstrativos do gráfico, de sábado a sexta-feira."
      actions={<Button variant="secondary" onClick={() => setValuesOpen(false)}>Fechar</Button>}>
      <table className="dashboard-chart__table"><caption>Receita diária demonstrativa</caption><thead><tr><th scope="col">Data</th><th scope="col">Receita</th></tr></thead>
        <tbody>{points.map((point) => <tr key={point.date}><th scope="row"><time dateTime={point.date}>{point.label} · {point.date.split('-').reverse().join('/')}</time></th><td>{currency.format(point.value)}</td></tr>)}</tbody>
      </table>
    </Modal>
  </figure>
}
