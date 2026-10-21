import type { StatusNotice } from '../../types/statusMessage'
import './styles.css'

export default function StatusMessage({ notice }: { notice: StatusNotice }) {
  return <p role="status" aria-label="Resultado da operação" aria-live="polite" aria-atomic="true"
    className={notice.text ? 'visual-message' : 'status-message--empty'}>
    <span key={notice.revision}>{notice.text}</span>
  </p>
}
