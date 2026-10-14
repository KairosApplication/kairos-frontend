import { managerPages } from './managerPages'

export function loginDestination(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state) || typeof state.from !== 'string') return '/dashboard'
  const path = state.from.split(/[?#]/, 1)[0]
  return managerPages.some((page) => page.path === path) ? state.from : '/dashboard'
}
