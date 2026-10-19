import { afterEach, beforeEach } from 'vitest'

export function mockDialogs() {
  const show = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
  const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
  })
  afterEach(() => {
    if (show) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', show)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
    if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  })
}
