import { settingsDemo } from '../mocks/settingsView'
import type { SettingsView } from '../types/settingsView'
export function getSettingsView(): Promise<SettingsView> { return Promise.resolve(structuredClone(settingsDemo)) }
