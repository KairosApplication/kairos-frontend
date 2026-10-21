import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { managerPages } from '../../routes/managerPages'

export default function RouteAccessibility() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = managerPages.find((item) => item.path === pathname)
    const title = pathname === '/login' ? 'Login' : page?.title ?? 'Página não encontrada'
    document.title = `${title} | KAIROS`
    // Session restoration can replace the loading screen without changing the URL.
    function focusContent() {
      const main = document.querySelector<HTMLElement>('main:not([aria-busy="true"])')
      const heading = main?.querySelector<HTMLElement>('h1')
      if (!main || !heading || heading.id === 'session-title') return false
      main.id = 'main-content'
      main.tabIndex = -1
      main.setAttribute('aria-labelledby', heading.id || 'page-title')
      if (!heading.id) heading.id = 'page-title'
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
      return true
    }
    if (focusContent()) return
    const observer = new MutationObserver(() => { if (focusContent()) observer.disconnect() })
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  return null
}
