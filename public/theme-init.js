// Run before the application and its styles to avoid a light flash on reload.
;(function () {
  var theme = 'light'
  try { if (localStorage.getItem('kairos.theme') === 'dark') theme = 'dark' } catch { /* Storage may be blocked. */ }
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#102019' : '#1b4d3e')
})()
