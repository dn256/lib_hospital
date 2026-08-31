import { ref } from 'vue'

export interface AtlasImageOverride {
  id?: string
  user_id: string
  case_id: string
  image_url: string
  source_url?: string | null
  source_label?: string | null
  is_shared?: boolean
}

export interface AtlasCustomCaseRow {
  id?: string
  user_id: string
  chapter: string
  diagnosis_vi: string
  diagnosis_en?: string | null
  image_url?: string | null
  source_url?: string | null
  source_label?: string | null
  microscopic_features_vi?: string[]
  microscopic_features_en?: string[]
  memory_point_vi?: string | null
  memory_point_en?: string | null
  pitfall_vi?: string | null
  pitfall_en?: string | null
  markers?: string[]
  icdo_code?: string | null
  who_url?: string | null
  pathology_outlines_url?: string | null
  is_shared?: boolean
}

const LOCAL_OVERRIDES_KEY = 'pathologylib-atlas-image-overrides'
const LOCAL_CASES_KEY = 'pathologylib-atlas-custom-cases'

export const useAtlasStorage = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()
  const backendAvailable = useState('atlas-backend-available', () => true)
  const imageOverrides = useState<Record<string, AtlasImageOverride>>('atlas-image-overrides', () => ({}))
  const customCases = useState<AtlasCustomCaseRow[]>('atlas-custom-cases', () => [])
  const loading = ref(false)

  const readLocal = <T>(key: string, fallback: T): T => {
    if (!import.meta.client) return fallback
    try {
      return JSON.parse(localStorage.getItem(key) || '') as T
    } catch {
      return fallback
    }
  }

  const writeLocal = (key: string, value: unknown) => {
    if (import.meta.client) localStorage.setItem(key, JSON.stringify(value))
  }

  const load = async () => {
    if (!user.value) return
    loading.value = true
    try {
      const [overrideResult, caseResult] = await Promise.all([
        supabase.from('atlas_image_overrides').select('*').order('updated_at', { ascending: false }),
        supabase.from('atlas_custom_cases').select('*').order('updated_at', { ascending: false }),
      ])

      if (overrideResult.error || caseResult.error) {
        throw overrideResult.error || caseResult.error
      }

      imageOverrides.value = Object.fromEntries(
        (overrideResult.data || []).map((item: AtlasImageOverride) => [item.case_id, item]),
      )
      customCases.value = (caseResult.data || []) as AtlasCustomCaseRow[]
      backendAvailable.value = true
    } catch (error) {
      console.warn('Atlas Supabase tables are unavailable; using local storage.', error)
      backendAvailable.value = false
      imageOverrides.value = readLocal<Record<string, AtlasImageOverride>>(LOCAL_OVERRIDES_KEY, {})
      customCases.value = readLocal<AtlasCustomCaseRow[]>(LOCAL_CASES_KEY, [])
    } finally {
      loading.value = false
    }
  }

  const uploadImage = async (caseId: string, file: File) => {
    if (!user.value) throw new Error('Bạn cần đăng nhập để tải ảnh.')
    if (!file.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải hình ảnh.')
    if (file.size > 8 * 1024 * 1024) throw new Error('Ảnh phải nhỏ hơn 8 MB.')
    if (!backendAvailable.value) throw new Error('Supabase Storage chưa sẵn sàng. Hãy dùng URL ảnh tạm thời.')

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '')
    const objectPath = `${user.value.id}/${caseId}/${crypto.randomUUID()}-${safeName || 'atlas-image'}`
    const { error } = await supabase.storage.from('atlas-images').upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error

    const { data } = supabase.storage.from('atlas-images').getPublicUrl(objectPath)
    return data.publicUrl
  }

  const saveImageOverride = async (input: Omit<AtlasImageOverride, 'user_id'>) => {
    if (!user.value) throw new Error('Bạn cần đăng nhập để thay ảnh.')
    const row: AtlasImageOverride = { ...input, user_id: user.value.id }

    if (backendAvailable.value) {
      const { data, error } = await supabase
        .from('atlas_image_overrides')
        .upsert(row, { onConflict: 'user_id,case_id' })
        .select()
        .single()
      if (error) throw error
      imageOverrides.value = { ...imageOverrides.value, [row.case_id]: data as AtlasImageOverride }
      return data
    }

    imageOverrides.value = { ...imageOverrides.value, [row.case_id]: row }
    writeLocal(LOCAL_OVERRIDES_KEY, imageOverrides.value)
    return row
  }

  const removeImageOverride = async (caseId: string) => {
    if (!user.value) return
    if (backendAvailable.value) {
      const { error } = await supabase
        .from('atlas_image_overrides')
        .delete()
        .eq('case_id', caseId)
        .eq('user_id', user.value.id)
      if (error) throw error
    }

    const next = { ...imageOverrides.value }
    delete next[caseId]
    imageOverrides.value = next
    writeLocal(LOCAL_OVERRIDES_KEY, next)
  }

  const saveCustomCase = async (input: Omit<AtlasCustomCaseRow, 'user_id'>) => {
    if (!user.value) throw new Error('Bạn cần đăng nhập để thêm hồ sơ Atlas.')
    const row: AtlasCustomCaseRow = { ...input, user_id: user.value.id }

    if (backendAvailable.value) {
      const query = input.id
        ? supabase.from('atlas_custom_cases').update(row).eq('id', input.id)
        : supabase.from('atlas_custom_cases').insert(row)
      const { data, error } = await query.select().single()
      if (error) throw error
      const saved = data as AtlasCustomCaseRow
      customCases.value = [saved, ...customCases.value.filter((item) => item.id !== saved.id)]
      return saved
    }

    const saved = { ...row, id: row.id || `local-${crypto.randomUUID()}` }
    customCases.value = [saved, ...customCases.value.filter((item) => item.id !== saved.id)]
    writeLocal(LOCAL_CASES_KEY, customCases.value)
    return saved
  }

  const removeCustomCase = async (id: string) => {
    if (!user.value) return
    if (backendAvailable.value && !id.startsWith('local-')) {
      const { error } = await supabase.from('atlas_custom_cases').delete().eq('id', id)
      if (error) throw error
    }
    customCases.value = customCases.value.filter((item) => item.id !== id)
    writeLocal(LOCAL_CASES_KEY, customCases.value)
  }

  return {
    backendAvailable,
    imageOverrides,
    customCases,
    loading,
    load,
    uploadImage,
    saveImageOverride,
    removeImageOverride,
    saveCustomCase,
    removeCustomCase,
  }
}
