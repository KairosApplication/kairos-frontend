import { useId } from 'react'
import type { SalesPoint } from './demo'
import { currency } from './demo'

export default function SalesChart({ points }: { points: readonly SalesPoint[] }) {
  const id = useId()
  const ceiling = Math.max(60000, ...points.map((point) => point.value))
  const coordinates = points.map((point, index) => ({
    ...point, x: 56 + index * 560 / Math.max(1, points.length - 1), y: 16 + (1 - point.value / ceiling) * 144,
  }))
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(' ')
  return <figure className="dashboard-chart">
    <svg className="dashboard-chart__plot" viewBox="0 0 640 192" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Receita demonstrativa dos últimos sete dias</title>
      <desc id={`${id}-description`}>De sábado a sexta-feira. Consulte os valores exatos na tabela abaixo do gráfico.</desc>
      {[0, 1, 2, 3].map((tick) => {
        const y = 160 - tick * 48
        return <g key={tick}><line x1="56" x2="616" y1={y} y2={y} className="dashboard-chart__grid" />
          <text x="46" y={y + 4} textAnchor="end" className="dashboard-chart__axis">{tick === 0 ? 'R$ 0' : `${Math.round(ceiling * tick / 3000)} mil`}</text></g>
      })}
      {coordinates.length > 0 && <>
        <polygon points={`56,160 ${line} ${coordinates[coordinates.length - 1].x},160`} className="dashboard-chart__area" />
        <polyline points={line} className="dashboard-chart__line" />
      </>}
      {coordinates.map((point) => <g key={point.date}>
        <circle cx={point.x} cy={point.y} r="3.5" className="dashboard-chart__point"><title>{point.label}: {currency.format(point.value)}</title></circle>
        <text x={point.x} y="184" textAnchor="middle" className="dashboard-chart__axis">{point.label}</text>
      </g>)}
    </svg>
    <details className="dashboard-chart__details">
      <summary>Ver valores por dia</summary>
      <table><caption>Receita diária demonstrativa</caption><thead><tr><th scope="col">Data</th><th scope="col">Receita</th></tr></thead>
        <tbody>{points.map((point) => <tr key={point.date}><th scope="row"><time dateTime={point.date}>{point.label} · {point.date.split('-').reverse().join('/')}</time></th><td>{currency.format(point.value)}</td></tr>)}</tbody>
      </table>
    </details>
  </figure>
}
