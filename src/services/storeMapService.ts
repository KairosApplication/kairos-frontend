import { storeMapDemo } from '../mocks/storeMap'
import type { StoreMapData } from '../types/storeMap'

/** Fonte demonstrativa temporária, sem requisições ou alterações no banco. */
export function getStoreMap(): Promise<StoreMapData> {
  return Promise.resolve(structuredClone(storeMapDemo))
}
