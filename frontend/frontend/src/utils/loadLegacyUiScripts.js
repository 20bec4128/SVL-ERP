const LEGACY_UI_SCRIPTS = [
  '/core-assets/js/config.js',
]

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-legacy-ui="true"][src="${src}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.legacyUi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

export async function loadLegacyUiScripts(extraScripts = []) {
  const scripts = [...LEGACY_UI_SCRIPTS, ...extraScripts]
  for (const src of scripts) {
    await loadScript(src)
  }
}
