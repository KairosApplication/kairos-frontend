import type { Key, ReactNode } from 'react'
import Feedback from '../Feedback'
import './styles.css'

export type TableColumn<Row> = { key: string; header: string; render: (row: Row) => ReactNode }
type DataTableProps<Row> = {
  caption: string
  columns: readonly TableColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => Key
  loading?: boolean
  error?: string
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
}

export default function DataTable<Row>({ caption, columns, rows, rowKey, loading, error, onRetry,
  emptyTitle = 'Nenhum resultado encontrado', emptyDescription = 'Experimente ajustar a busca ou os filtros.' }: DataTableProps<Row>) {
  if (loading) return <Feedback kind="loading" title="Carregando dados" description={caption} />
  if (error) return <Feedback kind="error" title="Não foi possível carregar os dados" description={error} onRetry={onRetry} />
  if (!rows.length) return <Feedback kind="empty" title={emptyTitle} description={emptyDescription} />
  return <div className="ui-table-scroll" role="region" aria-label={caption} tabIndex={0}>
    <table className="ui-table">
      <caption>{caption}</caption>
      <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={rowKey(row)}>{columns.map((column, index) => index === 0
        ? <th key={column.key} scope="row">{column.render(row)}</th>
        : <td key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody>
    </table>
  </div>
}
