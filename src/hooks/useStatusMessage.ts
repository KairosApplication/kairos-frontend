import { useCallback, useState } from 'react'
import type { StatusNotice } from '../types/statusMessage'

export default function useStatusMessage() {
  const [notice, setNotice] = useState<StatusNotice>({ text: '', revision: 0 })
  const announce = useCallback((text: string) => setNotice(previous => ({ text, revision: previous.revision + 1 })), [])
  return [notice, announce] as const
}
