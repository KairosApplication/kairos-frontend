import { useCallback } from 'react'
import { getOperationalHistory, summarizeOperations } from '../services/operationalAnalyticsService'
import { getStoreCatalog } from '../services/storeCatalogService'
import useApiData from './useApiData'

export default function useOperationalAnalytics() {
  const catalog = useApiData(getStoreCatalog)
  const historyLoader = useCallback((signal?: AbortSignal) => catalog.data ? getOperationalHistory(signal) : Promise.resolve(null), [catalog.data])
  const history = useApiData(historyLoader)
  return {
    data: catalog.data ? { ...summarizeOperations(catalog.data, history.data?.records ?? null), restockingError: history.error ?? history.data?.error ?? null } : null,
    error: catalog.error,
    loadingHistory: !!catalog.data && !history.data && !history.error,
    reload: catalog.reload,
  }
}
