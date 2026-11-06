import { useEffect, useState, type RefObject } from 'react'

const defaultPageSize = 25

export default function useProductPageSize(layout: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [pageSize, setPageSize] = useState(defaultPageSize)

  useEffect(() => {
    const root = layout.current
    if (!enabled || !root || typeof ResizeObserver === 'undefined') return
    const categories = root.querySelector<HTMLElement>('.products__categories')!
    const catalog = root.querySelector<HTMLElement>('.products__catalog')!
    let frame = 0
    let rowHeight = 0
    let width = 0

    function measure() {
      const categoryBounds = categories.getBoundingClientRect()
      const bounds = catalog.getBoundingClientRect()
      // On narrow screens the categories sit above the table, so use a regular page.
      if (categoryBounds.right > bounds.left) {
        setPageSize(defaultPageSize)
        return
      }
      const rows = catalog.querySelectorAll('tbody tr')
      if (!rows.length || !bounds.width) return
      if (width !== bounds.width) { width = bounds.width; rowHeight = 0 }
      // Keep the measured height on short final pages as well.
      rowHeight = Math.max(rowHeight, ...Array.from(rows, row => row.getBoundingClientRect().height))
      if (!rowHeight) return
      const header = catalog.querySelector<HTMLElement>('.ui-card__header')!
      const footer = catalog.querySelector<HTMLElement>('.products__table-footer')!
      const tableHead = catalog.querySelector('thead')!
      const tableScroll = catalog.querySelector<HTMLElement>('.ui-table-scroll')!
      const style = getComputedStyle(catalog)
      const headerStyle = getComputedStyle(header)
      const spacing = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
        + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
        + parseFloat(headerStyle.marginTop) + parseFloat(headerStyle.marginBottom)
      const controls = header.getBoundingClientRect().height + tableHead.getBoundingClientRect().height
        + footer.getBoundingClientRect().height + tableScroll.offsetHeight - tableScroll.clientHeight
      const height = Math.max(528, categoryBounds.bottom - bounds.top)
      setPageSize(Math.max(1, Math.ceil((height - spacing - controls) / rowHeight)))
    }
    function scheduleMeasure() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(categories)
    observer.observe(catalog)
    scheduleMeasure()
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [enabled, layout])

  return pageSize
}
