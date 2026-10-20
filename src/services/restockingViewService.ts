import { restockingDemo } from '../mocks/restockingView'
import type { RestockingTask } from '../types/restockingView'
export function getRestockingView(): Promise<RestockingTask[]> { return Promise.resolve(structuredClone(restockingDemo)) }
