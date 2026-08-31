const DATA_SCRIPTS = [
  '/atlas-data/integrated-atlas.js',
  '/atlas-data/medical-vi.js',
  '/atlas-data/search-assistant.js',
  '/atlas-data/who-catalog.js',
  '/atlas-data/webpathology-catalog.js',
]

export const useIntegratedAtlasData = () => {
  const loaded = useState('integrated-atlas-loaded', () => false)
  const loading = useState('integrated-atlas-loading', () => false)
  const error = useState<string | null>('integrated-atlas-error', () => null)
  const atlas = useState<any>('integrated-atlas-data', () => null)
  const whoCatalog = useState<any>('integrated-who-catalog', () => null)
  const webPathologyCatalog = useState<any>('integrated-webpathology-catalog', () => null)
  const medicalVi = useState<any>('integrated-medical-vi', () => null)
  const searchAssistant = useState<any>('integrated-search-assistant', () => null)

  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-atlas-src="${src}"]`)
    if (existing?.dataset.loaded === 'true') return resolve()
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Không tải được ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.defer = true
    script.dataset.atlasSrc = src
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error(`Không tải được ${src}`)), { once: true })
    document.head.appendChild(script)
  })

  const load = async () => {
    if (!import.meta.client || loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      await Promise.all(DATA_SCRIPTS.map(loadScript))
      const globalWindow = window as any
      atlas.value = globalWindow.INTEGRATED_ATLAS_DATA
      whoCatalog.value = globalWindow.WHO_ATLAS_CATALOG
      webPathologyCatalog.value = globalWindow.WEBPATHOLOGY_CATALOG
      medicalVi.value = globalWindow.MEDICAL_VI
      searchAssistant.value = globalWindow.ATLAS_SEARCH_ASSISTANT
      if (!atlas.value?.cases?.length) throw new Error('Kho dữ liệu Atlas rỗng hoặc không hợp lệ.')
      loaded.value = true
    } catch (loadError: any) {
      error.value = loadError?.message || 'Không thể tải dữ liệu Atlas.'
      throw loadError
    } finally {
      loading.value = false
    }
  }

  return {
    loaded,
    loading,
    error,
    atlas,
    whoCatalog,
    webPathologyCatalog,
    medicalVi,
    searchAssistant,
    load,
  }
}
