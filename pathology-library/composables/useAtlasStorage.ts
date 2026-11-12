import { ref, watch } from 'vue'

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
  const owner = useState<string | null>('atlas-storage-owner', () => null)
  watch(() => user.value?.id, id => {
    const nextOwner = id || null
    if (owner.value === nextOwner) return
    owner.value = nextOwner
    imageOverrides.value = {}
    customCases.value = []
    backendAvailable.value = true
  }, { immediate: true, flush: 'sync' })

  const readLocal = <T>(key: string, fallback: T): T => {
    if (!import.meta.client) return fallback
    try {
      return (JSON.parse(localStorage.getItem(key) || 'null') as T | null) ?? fallback
    } catch {
      return fallback
    }
  }

  const localKey = (key: string, userId: string) => `${key}:${userId}`
  const writeLocal = (key: string, userId: string, value: unknown) => {
    if (import.meta.client) localStorage.setItem(localKey(key, userId), JSON.stringify(value))
  }

  const load = async () => {
    const userId = user.value?.id
    if (!userId) return
    loading.value = true
    try {
      const [overrideResult, caseResult] = await Promise.all([
        supabase.from('atlas_image_overrides').select('*').order('updated_at', { ascending: false }),
        supabase.from('atlas_custom_cases').select('*').order('updated_at', { ascending: false }),
      ])

      if (overrideResult.error || caseResult.error) {
        throw overrideResult.error || caseResult.error
      }

      if (user.value?.id !== userId) return
      const overrides = new Map<string, AtlasImageOverride>()
      for (const item of (overrideResult.data || []) as AtlasImageOverride[]) {
        const current = overrides.get(item.case_id)
        if (!current || (item.user_id === userId && current.user_id !== userId)) {
          overrides.set(item.case_id, item)
        }
      }
      imageOverrides.value = Object.fromEntries(overrides)
      customCases.value = (caseResult.data || []) as AtlasCustomCaseRow[]
      backendAvailable.value = true
    } catch {
      if (user.value?.id !== userId) return
      backendAvailable.value = false
      const storedOverrides = readLocal<Record<string, AtlasImageOverride>>(
        localKey(LOCAL_OVERRIDES_KEY, userId),
        readLocal(LOCAL_OVERRIDES_KEY, {}),
      )
      const storedCases = readLocal<AtlasCustomCaseRow[]>(
        localKey(LOCAL_CASES_KEY, userId),
        readLocal(LOCAL_CASES_KEY, []),
      )
      imageOverrides.value = Object.fromEntries(Object.entries(storedOverrides).filter(([, row]) => row?.user_id === userId))
      customCases.value = storedCases.filter(row => row?.user_id === userId)
    } finally {
      loading.value = false
    }
  }

  const uploadImage = async (caseId: string, file: File) => {
    if (!user.value) throw new Error('Bạn cần đăng nhập để tải ảnh.')
    const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type]
    if (!extension) throw new Error('Chỉ hỗ trợ ảnh JPEG, PNG, WebP và GIF.')
    if (file.size > 8 * 1024 * 1024) throw new Error('Ảnh phải nhỏ hơn 8 MB.')
    if (!backendAvailable.value) throw new Error('Supabase Storage chưa sẵn sàng. Hãy dùng URL ảnh tạm thời.')

    const objectPath = `${user.value.id}/${caseId}/${crypto.randomUUID()}.${extension}`
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
    writeLocal(LOCAL_OVERRIDES_KEY, row.user_id, imageOverrides.value)
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
    if (!backendAvailable.value) writeLocal(LOCAL_OVERRIDES_KEY, user.value.id, next)
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
    writeLocal(LOCAL_CASES_KEY, row.user_id, customCases.value)
    return saved
  }

  const removeCustomCase = async (id: string) => {
    if (!user.value) return
    if (backendAvailable.value && !id.startsWith('local-')) {
      const { error } = await supabase.from('atlas_custom_cases').delete().eq('id', id)
      if (error) throw error
    }
    customCases.value = customCases.value.filter((item) => item.id !== id)
    if (!backendAvailable.value || id.startsWith('local-')) {
      writeLocal(LOCAL_CASES_KEY, user.value.id, customCases.value.filter(item => item.id?.startsWith('local-')))
    }
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
