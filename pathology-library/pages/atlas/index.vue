<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: 'library',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { isEditor } = usePermissions()
const {
  loaded,
  loading,
  error,
  atlas,
  whoCatalog,
  webPathologyCatalog,
  medicalVi,
  searchAssistant,
  load: loadAtlasData,
} = useIntegratedAtlasData()
const {
  backendAvailable,
  imageOverrides,
  customCases,
  load: loadAtlasStorage,
  uploadImage,
  saveImageOverride,
  removeImageOverride,
  saveCustomCase,
  removeCustomCase,
} = useAtlasStorage()

const allowedViews = ['atlas', 'morphology', 'who', 'images']
const activeView = ref('atlas')
const query = ref('')
const selectedOrgan = ref('all')
const selectedPattern = ref('all')
const caseLimit = ref(36)
const selectedCase = ref<any | null>(null)
const caseDialogOpen = ref(false)
const failedImages = ref<Set<string>>(new Set())

const morphologyQuery = ref('')
const morphologyOrgan = ref('all')
const selectedClueIds = ref<string[]>([])

const whoQuery = ref('')
const whoVolume = ref('all')
const whoLimit = ref(48)
const imageQuery = ref('')
const imageOrgan = ref('all')
const imageLimit = ref(48)

const imageDialogOpen = ref(false)
const imageTarget = ref<any | null>(null)
const imageFile = ref<File | null>(null)
const imageSaving = ref(false)
const imageForm = ref({ imageUrl: '', sourceUrl: '', sourceLabel: '', isShared: false })

const customDialogOpen = ref(false)
const customImageFile = ref<File | null>(null)
const customSaving = ref(false)
const customForm = ref({
  chapter: 'thyroid',
  diagnosisVi: '',
  diagnosisEn: '',
  imageUrl: '',
  sourceUrl: '',
  sourceLabel: '',
  microVi: '',
  microEn: '',
  memoryVi: '',
  memoryEn: '',
  pitfallVi: '',
  pitfallEn: '',
  markers: '',
  icdoCode: '',
  whoUrl: '',
  pathologyOutlinesUrl: '',
  isShared: false,
})

const snackbar = ref({ show: false, text: '', color: 'success' })
const notify = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const normalize = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim()

const containsSearchTerms = (value: unknown, queryValue: unknown) => {
  const rawQuery = String(queryValue || '').toLowerCase().trim()
  if (!rawQuery) return true

  const rawText = String(value || '').toLowerCase()
  const normalizedText = normalize(value)
  if (rawText.includes(rawQuery)) return true

  const rawWords = rawText.split(/[^\p{L}\p{N}+/-]+/u).filter(Boolean)
  const normalizedWords = normalizedText.split(/[^a-z0-9+/-]+/).filter(Boolean)
  return rawQuery.split(/\s+/).filter(Boolean).every((rawToken) => {
    const normalizedToken = normalize(rawToken)
    const keepVietnameseMarks = rawToken !== normalizedToken
    const token = keepVietnameseMarks ? rawToken : normalizedToken
    const words = keepVietnameseMarks ? rawWords : normalizedWords
    return words.some((word) => word === token || (token.length >= 3 && word.startsWith(token)))
  })
}

const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
const splitMarkers = (value: string) => value.split(/[,;\n]/).map((line) => line.trim()).filter(Boolean)

const chapters = computed<any[]>(() => atlas.value?.chapters || [])
const patterns = computed<any[]>(() => atlas.value?.patterns || [])

const transformedCustomCases = computed(() => customCases.value.map((row: any) => ({
  id: `custom-${row.id}`,
  customId: row.id,
  custom: true,
  ownerId: row.user_id,
  chapter: row.chapter,
  diagnosis: row.diagnosis_vi,
  english: row.diagnosis_en || '',
  imageUrl: row.image_url || '',
  sourceUrl: row.source_url || '',
  source: row.source_label || 'Ảnh do người dùng cung cấp',
  imageVerified: Boolean(row.image_url && row.source_url),
  imageKind: 'Ảnh bổ sung',
  imageNote: 'Ảnh do người dùng bổ sung; cần kiểm tra trang nguồn trước khi sử dụng để học.',
  micro: row.microscopic_features_vi || [],
  report: [],
  memory: row.memory_point_vi || '',
  pitfall: row.pitfall_vi || '',
  markers: row.markers || [],
  icdo: row.icdo_code ? { code: row.icdo_code, version: 'ICD-O', verified: false } : null,
  learningEn: {
    micro: row.microscopic_features_en || [],
    report: [],
    memory: row.memory_point_en || '',
    pitfall: row.pitfall_en || '',
  },
  customWhoUrl: row.who_url || '',
  customPathologyOutlinesUrl: row.pathology_outlines_url || '',
  isShared: row.is_shared,
})))

const allCases = computed<any[]>(() => [
  ...(atlas.value?.cases || []),
  ...transformedCustomCases.value,
])

const chapterFor = (id: string) => chapters.value.find((chapter) => chapter.id === id) || chapters.value[0] || {}
const chapterCount = (id: string) => id === 'all'
  ? allCases.value.length
  : allCases.value.filter((item) => item.chapter === id).length

const organIcons: Record<string, string> = {
  all: 'mdi-view-dashboard-outline',
  thyroid: 'mdi-butterfly-outline',
  lung: 'mdi-lungs',
  colon: 'mdi-stomach',
  breast: 'mdi-ribbon',
  hpb: 'mdi-liver',
  gyn: 'mdi-gender-female',
  gu: 'mdi-gender-male-female',
  skin: 'mdi-hand-back-left-outline',
  heme: 'mdi-blood-bag',
  cns: 'mdi-brain',
  headneck: 'mdi-account-outline',
  soft: 'mdi-bone',
  uppergi: 'mdi-stomach',
  eye: 'mdi-eye-outline',
  inflammation: 'mdi-bacteria-outline',
}

const organIcon = (id: string) => organIcons[id] || 'mdi-microscope'
const activeChapter = computed(() => chapterFor(selectedOrgan.value))
const heroCases = computed(() => {
  const scoped = allCases.value.filter((item) => (
    (selectedOrgan.value === 'all' || item.chapter === selectedOrgan.value)
    && imageFor(item)
  ))
  return scoped.slice(0, 4)
})
const verifiedImageCount = computed(() => allCases.value.filter((item) => imageFor(item)).length)

const caseSearchText = (item: any) => normalize([
  item.diagnosis,
  item.english,
  chapterFor(item.chapter).name,
  ...(item.micro || []),
  ...(item.learningEn?.micro || []),
  item.memory,
  item.learningEn?.memory,
  item.pitfall,
  ...(item.markers || []),
  item.icdo?.code,
].join(' '))

const caseSearchScore = (item: any, queryValue: unknown) => {
  const rawQuery = String(queryValue || '').trim()
  const normalizedQuery = normalize(rawQuery)
  if (!rawQuery) return 0

  const searchText = caseSearchText(item)
  const diagnosisText = normalize(`${item.diagnosis || ''} ${item.english || ''}`)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)

  if (!containsSearchTerms([
    item.diagnosis,
    item.english,
    chapterFor(item.chapter).name,
    ...(item.micro || []),
    ...(item.learningEn?.micro || []),
    item.memory,
    item.learningEn?.memory,
    item.pitfall,
    ...(item.markers || []),
    item.icdo?.code,
  ].join(' '), rawQuery)) return -1

  let score = tokens.length
  if (searchText.includes(normalizedQuery)) score += 4
  if (diagnosisText.includes(normalizedQuery)) score += 12
  return score
}

const filteredCases = computed(() => {
  const rawQuery = query.value
  const matches = allCases.value.filter((item) => {
    if (selectedOrgan.value !== 'all' && item.chapter !== selectedOrgan.value) return false
    if (selectedPattern.value !== 'all' && !(item.pattern || []).includes(selectedPattern.value)) return false
    return !rawQuery || caseSearchScore(item, rawQuery) >= 0
  })

  if (!rawQuery) return matches
  return matches.sort((a, b) => caseSearchScore(b, rawQuery) - caseSearchScore(a, rawQuery))
})

const visibleCases = computed(() => filteredCases.value.slice(0, caseLimit.value))

const imageFor = (item: any) => {
  if (!item || failedImages.value.has(item.id)) return ''
  const override = imageOverrides.value[item.id]
  if (override?.image_url) return override.image_url
  if (item.imageUrl) return item.imageUrl
  if (item.imageVerified !== true || !item.file) return ''
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(item.file)}?width=1200`
}

const imageSourceFor = (item: any) => {
  const override = imageOverrides.value[item?.id]
  if (override?.source_url) return override.source_url
  if (item?.sourceUrl) return item.sourceUrl
  if (item?.file) return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(String(item.file).replaceAll(' ', '_'))}`
  return ''
}

const whoUrlFor = (item: any) => item?.customWhoUrl
  || atlas.value?.whoLinks?.[item?.id]?.url
  || item?.classification?.url
  || chapterFor(item?.chapter).who
  || ''

const pathologyUrlFor = (item: any) => item?.customPathologyOutlinesUrl
  || atlas.value?.pathologyOutlinesLinks?.[item?.id]
  || chapterFor(item?.chapter).po
  || ''

const markImageFailed = (id: string) => {
  failedImages.value = new Set([...failedImages.value, id])
}

const openCase = (item: any) => {
  selectedCase.value = item
  caseDialogOpen.value = true
}

const groupedMorphologyClues = computed(() => {
  const groups = new Map<string, any[]>()
  for (const clue of searchAssistant.value?.morphologyClues || []) {
    const group = clue.group || 'Khác'
    groups.set(group, [...(groups.get(group) || []), clue])
  }
  return [...groups.entries()].map(([group, clues]) => ({ group, clues }))
})

const morphologyResults = computed(() => {
  if (!searchAssistant.value?.rankCases) return []
  if (!morphologyQuery.value && morphologyOrgan.value === 'all' && selectedClueIds.value.length === 0) return []
  return searchAssistant.value.rankCases(allCases.value, {
    query: morphologyQuery.value,
    morphologyQuery: morphologyQuery.value,
    clueIds: selectedClueIds.value,
    organ: morphologyOrgan.value,
    chapterNameFor: (id: string) => chapterFor(id).name || id,
  }).slice(0, 36)
})

const translationCache = new Map<string, string>()
const translationCorrections: Record<string, string> = {
  'solitary tracheobronchial papilloma': 'U nhú đơn độc khí - phế quản',
  'ectopic thyroid and parathyroid tissues': 'Mô tuyến giáp và tuyến cận giáp lạc chỗ',
  'non-small cell carcinoma nos': 'Ung thư biểu mô không tế bào nhỏ, không định loại khác (NOS)',
  'salivary gland-type carcinomas': 'Các ung thư biểu mô típ tuyến nước bọt',
  'carcinoid/neuroendocrine tumours of the lung': 'Các u carcinoid và u thần kinh nội tiết của phổi',
  'carcinoid/neuroendocrine tumors of the lung': 'Các u carcinoid và u thần kinh nội tiết của phổi',
  'lactating adenoma': 'U tuyến tiết sữa',
  'nipple adenoma': 'U tuyến núm vú',
  'adenocarcinoma of the lung': 'Ung thư biểu mô tuyến của phổi',
  'small cell lung carcinoma': 'Ung thư biểu mô tế bào nhỏ của phổi',
}
const translate = (value: string) => {
  if (!value) return ''
  if (translationCache.has(value)) return translationCache.get(value) as string
  const translated = translationCorrections[value.toLowerCase().trim()]
    || medicalVi.value?.translateDetailed?.(value)?.text
    || value
  translationCache.set(value, translated)
  return translated
}

const whoVolumes = computed<any[]>(() => whoCatalog.value?.volumes || [])
const whoEntries = computed<any[]>(() => whoCatalog.value?.entries || [])
const whoFiltered = computed(() => {
  return whoEntries.value.filter((entry) => {
    if (whoVolume.value !== 'all' && entry.volumeId !== whoVolume.value) return false
    if (!whoQuery.value) return entry.entryType === 'diagnosis'
    return containsSearchTerms([entry.nameEn, translate(entry.nameEn), entry.sectionEn, translate(entry.sectionEn), entry.groupEn].join(' '), whoQuery.value)
  })
})
const visibleWhoEntries = computed(() => whoFiltered.value.slice(0, whoLimit.value))
const volumeFor = (id: string) => whoVolumes.value.find((volume) => volume.id === id)

const webEntries = computed<any[]>(() => webPathologyCatalog.value?.entries || [])
const webOrgans = computed<any[]>(() => webPathologyCatalog.value?.organs || [])
const webFiltered = computed(() => {
  return webEntries.value.filter((entry) => {
    if (imageOrgan.value !== 'all' && entry.organ !== imageOrgan.value) return false
    return containsSearchTerms([
      entry.titleEn,
      translate(entry.titleEn),
      ...(entry.trailEn || []),
      ...(entry.trailEn || []).map(translate),
      entry.organ,
    ].join(' '), imageQuery.value)
  })
})
const visibleWebEntries = computed(() => webFiltered.value.slice(0, imageLimit.value))

const openImageManager = (item: any) => {
  const override = imageOverrides.value[item.id]
  imageTarget.value = item
  imageFile.value = null
  imageForm.value = {
    imageUrl: override?.image_url || item.imageUrl || '',
    sourceUrl: override?.source_url || item.sourceUrl || '',
    sourceLabel: override?.source_label || item.source || '',
    isShared: Boolean(override?.is_shared),
  }
  imageDialogOpen.value = true
}

const saveManagedImage = async () => {
  if (!imageTarget.value) return
  imageSaving.value = true
  try {
    let imageUrl = imageForm.value.imageUrl.trim()
    if (imageFile.value) imageUrl = await uploadImage(imageTarget.value.id, imageFile.value)
    if (!/^https?:\/\//i.test(imageUrl)) throw new Error('Ảnh cần có URL hợp lệ hoặc tệp tải lên.')
    if (!/^https?:\/\//i.test(imageForm.value.sourceUrl.trim())) throw new Error('Cần nhập URL trang nguồn của ảnh.')
    await saveImageOverride({
      case_id: imageTarget.value.id,
      image_url: imageUrl,
      source_url: imageForm.value.sourceUrl.trim(),
      source_label: imageForm.value.sourceLabel.trim() || 'Nguồn ảnh do người dùng cung cấp',
      is_shared: isEditor.value && imageForm.value.isShared,
    })
    failedImages.value = new Set([...failedImages.value].filter((id) => id !== imageTarget.value.id))
    imageDialogOpen.value = false
    notify(backendAvailable.value ? 'Đã lưu ảnh vào Atlas.' : 'Đã lưu ảnh tạm trên thiết bị này.', backendAvailable.value ? 'success' : 'warning')
  } catch (saveError: any) {
    notify(saveError?.message || 'Không thể lưu ảnh.', 'error')
  } finally {
    imageSaving.value = false
  }
}

const restoreImage = async () => {
  if (!imageTarget.value) return
  try {
    await removeImageOverride(imageTarget.value.id)
    imageDialogOpen.value = false
    notify('Đã khôi phục ảnh gốc của hồ sơ.')
  } catch (restoreError: any) {
    notify(restoreError?.message || 'Không thể khôi phục ảnh.', 'error')
  }
}

const resetCustomForm = () => {
  customImageFile.value = null
  customForm.value = {
    chapter: selectedOrgan.value !== 'all' ? selectedOrgan.value : 'thyroid',
    diagnosisVi: '', diagnosisEn: '', imageUrl: '', sourceUrl: '', sourceLabel: '',
    microVi: '', microEn: '', memoryVi: '', memoryEn: '', pitfallVi: '', pitfallEn: '',
    markers: '', icdoCode: '', whoUrl: '', pathologyOutlinesUrl: '', isShared: false,
  }
}

const openCustomCaseDialog = () => {
  resetCustomForm()
  customDialogOpen.value = true
}

const saveNewCustomCase = async () => {
  if (!customForm.value.diagnosisVi.trim()) {
    notify('Cần nhập tên chẩn đoán tiếng Việt.', 'error')
    return
  }
  customSaving.value = true
  try {
    let imageUrl = customForm.value.imageUrl.trim()
    if (customImageFile.value) imageUrl = await uploadImage(`custom-${Date.now()}`, customImageFile.value)
    if (imageUrl && !customForm.value.sourceUrl.trim()) throw new Error('Ảnh phải có URL trang nguồn để đối chiếu.')
    await saveCustomCase({
      chapter: customForm.value.chapter,
      diagnosis_vi: customForm.value.diagnosisVi.trim(),
      diagnosis_en: customForm.value.diagnosisEn.trim() || null,
      image_url: imageUrl || null,
      source_url: customForm.value.sourceUrl.trim() || null,
      source_label: customForm.value.sourceLabel.trim() || null,
      microscopic_features_vi: splitLines(customForm.value.microVi),
      microscopic_features_en: splitLines(customForm.value.microEn),
      memory_point_vi: customForm.value.memoryVi.trim() || null,
      memory_point_en: customForm.value.memoryEn.trim() || null,
      pitfall_vi: customForm.value.pitfallVi.trim() || null,
      pitfall_en: customForm.value.pitfallEn.trim() || null,
      markers: splitMarkers(customForm.value.markers),
      icdo_code: customForm.value.icdoCode.trim() || null,
      who_url: customForm.value.whoUrl.trim() || null,
      pathology_outlines_url: customForm.value.pathologyOutlinesUrl.trim() || null,
      is_shared: isEditor.value && customForm.value.isShared,
    })
    customDialogOpen.value = false
    notify(backendAvailable.value ? 'Đã thêm hồ sơ vào Atlas.' : 'Đã lưu hồ sơ tạm trên thiết bị này.', backendAvailable.value ? 'success' : 'warning')
  } catch (saveError: any) {
    notify(saveError?.message || 'Không thể thêm hồ sơ.', 'error')
  } finally {
    customSaving.value = false
  }
}

const deleteCustomCase = async (item: any) => {
  if (!item?.customId || !window.confirm(`Xóa hồ sơ “${item.diagnosis}”?`)) return
  try {
    await removeCustomCase(item.customId)
    caseDialogOpen.value = false
    notify('Đã xóa hồ sơ tự thêm.')
  } catch (deleteError: any) {
    notify(deleteError?.message || 'Không thể xóa hồ sơ.', 'error')
  }
}

watch(() => route.query.view, (value) => {
  const next = typeof value === 'string' && allowedViews.includes(value) ? value : 'atlas'
  activeView.value = next
}, { immediate: true })

watch(activeView, async (value) => {
  if (route.query.view === value || (value === 'atlas' && !route.query.view)) return
  await router.replace({ query: value === 'atlas' ? {} : { ...route.query, view: value } })
})

watch([query, selectedOrgan, selectedPattern], () => { caseLimit.value = 36 })
watch([whoQuery, whoVolume], () => { whoLimit.value = 48 })
watch([imageQuery, imageOrgan], () => { imageLimit.value = 48 })

onMounted(async () => {
  try {
    await Promise.all([loadAtlasData(), loadAtlasStorage()])
  } catch (mountError) {
    console.error(mountError)
  }
})
</script>

<template>
  <div class="atlas-page">
    <section class="atlas-hero">
      <div class="hero-content">
        <div class="hero-kicker">
          <span class="live-dot" />
          Không gian học tập tích hợp
        </div>
        <h1>Atlas Giải phẫu bệnh</h1>
        <p class="hero-copy">Quan sát vi thể, định hướng hình thái và mở đúng nguồn WHO trong cùng một không gian PathologyLib.</p>

        <div class="hero-actions">
          <button type="button" class="hero-primary" @click="activeView = 'atlas'">
            <v-icon size="19">mdi-microscope</v-icon>
            Khám phá Atlas
            <v-icon size="18">mdi-arrow-right</v-icon>
          </button>
          <button type="button" class="hero-secondary" @click="activeView = 'morphology'">
            <v-icon size="18">mdi-shape-outline</v-icon>
            Tìm theo hình thái
          </button>
        </div>

        <div class="hero-stats" aria-label="Thống kê dữ liệu Atlas">
          <div><strong>{{ allCases.length || 120 }}</strong><span>hồ sơ Atlas</span></div>
          <div><strong>{{ verifiedImageCount }}</strong><span>hồ sơ có ảnh</span></div>
          <div><strong>{{ whoCatalog?.entries?.length?.toLocaleString('vi-VN') || '4.487' }}</strong><span>mục WHO</span></div>
        </div>

        <div class="atlas-status" :class="backendAvailable ? 'online' : 'local'">
          <v-icon size="16">{{ backendAvailable ? 'mdi-cloud-check-outline' : 'mdi-cloud-alert-outline' }}</v-icon>
          <span>{{ backendAvailable ? 'Supabase đang đồng bộ ảnh và hồ sơ theo tài khoản.' : 'Chưa áp migration Atlas; thay đổi đang được lưu cục bộ.' }}</span>
        </div>
      </div>

      <div class="hero-gallery" aria-label="Ảnh vi thể nổi bật trong Atlas">
        <button
          v-for="(item, index) in heroCases"
          :key="item.id"
          type="button"
          class="hero-slide"
          :class="`hero-slide-${index + 1}`"
          @click="openCase(item)"
        >
          <v-img :src="imageFor(item)" :alt="`${item.diagnosis} / ${item.english}`" cover height="100%" @error="markImageFailed(item.id)" />
          <span class="hero-slide-shade" />
          <span class="hero-slide-copy">
            <small>{{ chapterFor(item.chapter).name }}</small>
            <strong>{{ item.diagnosis }}</strong>
          </span>
        </button>
        <div v-if="heroCases.length === 0" class="hero-gallery-empty">
          <v-icon size="42">mdi-image-search-outline</v-icon>
          <span>Đang chuẩn bị ảnh vi thể</span>
        </div>
      </div>
    </section>

    <v-tabs v-model="activeView" class="workspace-tabs" color="primary" show-arrows>
      <v-tab value="atlas"><v-icon start>mdi-view-grid-outline</v-icon>Atlas ca</v-tab>
      <v-tab value="morphology"><v-icon start>mdi-shape-outline</v-icon>Tìm theo hình thái</v-tab>
      <v-tab value="who"><v-icon start>mdi-book-open-page-variant</v-icon>Danh mục WHO</v-tab>
      <v-tab value="images"><v-icon start>mdi-image-multiple-outline</v-icon>Kho ảnh nguồn</v-tab>
    </v-tabs>

    <div v-if="loading && !loaded" class="state-panel">
      <v-progress-circular indeterminate color="primary" size="38" />
      <strong>Đang nạp kho dữ liệu giải phẫu bệnh…</strong>
    </div>
    <div v-else-if="error" class="state-panel error-state">
      <v-icon size="38">mdi-alert-circle-outline</v-icon><strong>{{ error }}</strong>
      <v-btn color="primary" @click="loadAtlasData">Tải lại</v-btn>
    </div>

    <template v-else-if="loaded">
      <section v-show="activeView === 'atlas'" class="organ-explorer" aria-label="Chọn hệ cơ quan">
        <header class="organ-explorer-heading">
          <div><p>KHÁM PHÁ THEO CƠ QUAN</p><h2>Chọn cơ quan để bắt đầu</h2></div>
          <span>{{ chapters.length - 1 }} nhóm · {{ allCases.length }} hồ sơ</span>
        </header>
        <div class="organ-rail">
          <button
            v-for="chapter in chapters"
            :key="chapter.id"
            type="button"
            :class="{ active: selectedOrgan === chapter.id }"
            :style="{ '--organ-color': chapter.color }"
            @click="selectedOrgan = chapter.id"
          >
            <span class="organ-icon"><v-icon size="20">{{ organIcon(chapter.id) }}</v-icon></span>
            <span class="organ-label"><strong>{{ chapter.name }}</strong><small>{{ chapterCount(chapter.id) }} hồ sơ</small></span>
            <v-icon class="organ-arrow" size="17">mdi-arrow-right</v-icon>
          </button>
        </div>
      </section>

      <section v-show="activeView === 'atlas'" class="atlas-workspace">
        <div class="atlas-results">
          <div class="atlas-toolbar">
            <div class="toolbar-title">
              <span class="toolbar-organ-icon" :style="{ background: activeChapter.color }"><v-icon size="22">{{ organIcon(activeChapter.id) }}</v-icon></span>
              <div><p>{{ activeChapter.short || 'ALL' }} · BẢN ATLAS</p><h2>{{ activeChapter.name || 'Tất cả cơ quan' }}</h2><span>{{ activeChapter.intro }}</span></div>
            </div>
            <div class="toolbar-actions">
              <v-text-field v-model="query" prepend-inner-icon="mdi-magnify" placeholder="Tìm tiếng Việt, English, marker, ICD-O…" hide-details density="compact" clearable />
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openCustomCaseDialog">Thêm hồ sơ</v-btn>
            </div>
          </div>

          <div class="pattern-filter">
            <button v-for="pattern in patterns" :key="pattern[0]" type="button" :class="{ active: selectedPattern === pattern[0] }" @click="selectedPattern = pattern[0]">
              {{ pattern[1] }}
            </button>
          </div>

          <div class="results-summary"><strong>{{ filteredCases.length }}</strong> hồ sơ phù hợp</div>
          <TransitionGroup name="atlas-list" tag="div" class="case-grid">
            <AtlasCaseCard
              v-for="(item, index) in visibleCases"
              :key="item.id"
              :item="item"
              :chapter="chapterFor(item.chapter)"
              :image-url="imageFor(item)"
              :style="{ '--card-index': index % 12 }"
              @select="openCase"
              @image-error="markImageFailed"
            />
          </TransitionGroup>
          <div v-if="visibleCases.length === 0" class="empty-results"><v-icon size="38">mdi-magnify-close</v-icon><strong>Không tìm thấy hồ sơ phù hợp</strong><span>Thử tên tiếng Việt, tiếng Anh, cơ quan hoặc marker khác.</span></div>
          <div v-if="visibleCases.length < filteredCases.length" class="load-more"><v-btn variant="outlined" color="primary" @click="caseLimit += 36">Hiển thị thêm</v-btn></div>
        </div>
      </section>

      <section v-show="activeView === 'morphology'" class="content-view morphology-view">
        <header class="view-header"><div><p>ĐỊNH HƯỚNG KHI CHƯA BIẾT TÊN BỆNH</p><h2>Tìm từ hình thái đang thấy</h2><span>Kết quả là gợi ý chẩn đoán phân biệt, không phải kết luận chẩn đoán.</span></div></header>
        <div class="morphology-form">
          <v-select v-model="morphologyOrgan" :items="chapters" item-title="name" item-value="id" label="1. Cơ quan" density="comfortable" hide-details />
          <v-text-field v-model="morphologyQuery" label="2. Nhập hình thái tiếng Việt hoặc English" placeholder="VD: tế bào nhỏ, nuclear molding, tạo tuyến…" prepend-inner-icon="mdi-magnify" hide-details clearable />
          <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="morphologyQuery=''; morphologyOrgan='all'; selectedClueIds=[]">Xóa lựa chọn</v-btn>
        </div>
        <div class="clue-groups">
          <section v-for="group in groupedMorphologyClues" :key="group.group">
            <h3>{{ group.group }}</h3>
            <div><button v-for="clue in group.clues" :key="clue.id" type="button" :class="{ active: selectedClueIds.includes(clue.id) }" @click="selectedClueIds = selectedClueIds.includes(clue.id) ? selectedClueIds.filter(id => id !== clue.id) : [...selectedClueIds, clue.id]">{{ clue.label }}</button></div>
          </section>
        </div>
        <div class="morph-results-heading"><h3>Gợi ý chẩn đoán phân biệt</h3><span>{{ morphologyResults.length }} kết quả</span></div>
        <div v-if="morphologyResults.length" class="case-grid">
          <AtlasCaseCard v-for="result in morphologyResults" :key="result.item.id" :item="result.item" :chapter="chapterFor(result.item.chapter)" :image-url="imageFor(result.item)" @select="openCase" @image-error="markImageFailed" />
        </div>
        <div v-else class="empty-results"><v-icon size="38">mdi-shape-outline</v-icon><strong>Chọn cơ quan, hình thái hoặc nhập mô tả</strong><span>Công cụ hỗ trợ tìm khi chưa nhớ chính xác tên chẩn đoán.</span></div>
      </section>

      <section v-show="activeView === 'who'" class="content-view">
        <header class="view-header"><div><p>WHO CLASSIFICATION OF TUMOURS ONLINE</p><h2>Danh mục WHO dẫn đúng từng mục</h2><span>Giữ nguyên tên tiếng Anh chính thức và bổ sung bản dịch tiếng Việt để tra cứu.</span></div><div class="view-counter"><strong>{{ whoFiltered.length.toLocaleString('vi-VN') }}</strong><span>mục phù hợp</span></div></header>
        <div class="library-filter">
          <v-text-field v-model="whoQuery" prepend-inner-icon="mdi-magnify" placeholder="Tìm tiếng Việt hoặc English…" hide-details clearable />
          <v-select v-model="whoVolume" :items="[{ id: 'all', nameVi: 'Tất cả quyển WHO' }, ...whoVolumes]" item-title="nameVi" item-value="id" hide-details />
        </div>
        <div class="source-grid">
          <article v-for="entry in visibleWhoEntries" :key="`${entry.bookId}-${entry.chapterId}`" class="source-card">
            <div class="source-card-top"><span>{{ volumeFor(entry.volumeId)?.short }}</span><small>{{ entry.entryType }}</small></div>
            <h3>{{ translate(entry.nameEn) }}</h3><p class="source-english">{{ entry.nameEn }}</p>
            <p>{{ translate(entry.sectionEn) }}</p>
            <a :href="entry.url" target="_blank" rel="noopener noreferrer">Mở đúng mục WHO <v-icon size="15">mdi-open-in-new</v-icon></a>
          </article>
        </div>
        <div v-if="visibleWhoEntries.length < whoFiltered.length" class="load-more"><v-btn variant="outlined" color="primary" @click="whoLimit += 48">Hiển thị thêm</v-btn></div>
      </section>

      <section v-show="activeView === 'images'" class="content-view">
        <header class="view-header"><div><p>KHO LIÊN KẾT ẢNH WEBPATHOLOGY</p><h2>Mở gallery đúng chủ đề trên nguồn gốc</h2><span>Atlas chỉ lập chỉ mục và dẫn nguồn; không sao chép ảnh có bản quyền.</span></div><div class="view-counter"><strong>{{ webFiltered.length.toLocaleString('vi-VN') }}</strong><span>gallery phù hợp</span></div></header>
        <div class="library-filter">
          <v-text-field v-model="imageQuery" prepend-inner-icon="mdi-magnify" placeholder="Tìm dạ dày, stomach, adenocarcinoma…" hide-details clearable />
          <v-select v-model="imageOrgan" :items="[{ id: 'all', name: 'Tất cả cơ quan' }, ...webOrgans.map((organ: any) => ({ id: organ.id || organ.organ || organ, name: translate(organ.nameEn || organ.name || organ.id || organ) }))]" item-title="name" item-value="id" hide-details />
        </div>
        <div class="source-grid">
          <article v-for="entry in visibleWebEntries" :key="entry.url" class="source-card image-source-card">
            <div class="source-card-top"><span>{{ translate(entry.organ) }}</span><small>WebPathology</small></div>
            <h3>{{ translate(entry.titleEn) }}</h3><p class="source-english">{{ entry.titleEn }}</p>
            <p>{{ (entry.trailEn || []).map(translate).join(' › ') }}</p>
            <a :href="entry.url" target="_blank" rel="noopener noreferrer">Mở gallery nguồn <v-icon size="15">mdi-open-in-new</v-icon></a>
          </article>
        </div>
        <div v-if="visibleWebEntries.length < webFiltered.length" class="load-more"><v-btn variant="outlined" color="primary" @click="imageLimit += 48">Hiển thị thêm</v-btn></div>
      </section>
    </template>

    <AtlasCaseDialog
      v-model="caseDialogOpen"
      :item="selectedCase"
      :chapter="selectedCase ? chapterFor(selectedCase.chapter) : null"
      :image-url="imageFor(selectedCase)"
      :image-source-url="imageSourceFor(selectedCase)"
      :who-url="whoUrlFor(selectedCase)"
      :pathology-outlines-url="pathologyUrlFor(selectedCase)"
      :can-edit="isEditor"
      @manage-image="openImageManager"
      @delete-custom="deleteCustomCase"
      @image-error="markImageFailed"
    />

    <v-dialog v-model="imageDialogOpen" max-width="650">
      <v-card class="editor-dialog">
        <v-card-title>Quản lý ảnh · {{ imageTarget?.diagnosis }}</v-card-title>
        <v-card-text>
          <v-file-input v-model="imageFile" label="Tải ảnh lên Supabase Storage" accept="image/jpeg,image/png,image/webp,image/gif" prepend-icon="mdi-camera" show-size clearable />
          <div class="field-divider"><span>hoặc dùng URL ảnh</span></div>
          <v-text-field v-model="imageForm.imageUrl" label="URL ảnh" placeholder="https://…" />
          <v-text-field v-model="imageForm.sourceUrl" label="URL trang nguồn *" placeholder="Trang mô tả ảnh hoặc tệp gốc" />
          <v-text-field v-model="imageForm.sourceLabel" label="Tên nguồn" placeholder="Wikimedia Commons, nguồn nội bộ…" />
          <v-checkbox v-if="isEditor" v-model="imageForm.isShared" label="Chia sẻ ảnh này cho mọi người dùng Atlas" hide-details />
          <p class="dialog-note">Không tải ảnh có thông tin định danh người bệnh. Chỉ dùng ảnh bạn có quyền sử dụng và luôn lưu trang nguồn.</p>
        </v-card-text>
        <v-card-actions><v-btn variant="text" color="error" @click="restoreImage">Khôi phục ảnh gốc</v-btn><v-spacer /><v-btn variant="text" @click="imageDialogOpen=false">Hủy</v-btn><v-btn color="primary" :loading="imageSaving" @click="saveManagedImage">Lưu ảnh</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="customDialogOpen" max-width="960" :fullscreen="$vuetify.display.smAndDown">
      <v-card class="editor-dialog custom-dialog">
        <v-card-title>Thêm hồ sơ Atlas</v-card-title>
        <v-card-text>
          <div class="custom-form-grid">
            <v-select v-model="customForm.chapter" :items="chapters.filter((item: any) => item.id !== 'all')" item-title="name" item-value="id" label="Cơ quan *" />
            <v-text-field v-model="customForm.icdoCode" label="ICD-O" placeholder="VD: 8140/3" />
            <v-text-field v-model="customForm.diagnosisVi" label="Chẩn đoán tiếng Việt *" />
            <v-text-field v-model="customForm.diagnosisEn" label="Official English term" />
            <v-textarea v-model="customForm.microVi" label="Đặc điểm vi thể tiếng Việt" rows="4" placeholder="Mỗi đặc điểm một dòng" />
            <v-textarea v-model="customForm.microEn" label="Microscopic features in English" rows="4" placeholder="One feature per line" />
            <v-textarea v-model="customForm.memoryVi" label="Điểm ghi nhớ tiếng Việt" rows="2" />
            <v-textarea v-model="customForm.memoryEn" label="Memory point in English" rows="2" />
            <v-textarea v-model="customForm.pitfallVi" label="Bẫy chẩn đoán tiếng Việt" rows="2" />
            <v-textarea v-model="customForm.pitfallEn" label="Diagnostic pitfall in English" rows="2" />
            <v-text-field v-model="customForm.markers" label="HMMD / marker" placeholder="TTF-1, Napsin A, p40…" class="span-two" />
            <v-file-input v-model="customImageFile" label="Tải ảnh lên" accept="image/jpeg,image/png,image/webp,image/gif" show-size />
            <v-text-field v-model="customForm.imageUrl" label="Hoặc URL ảnh" />
            <v-text-field v-model="customForm.sourceUrl" label="URL trang nguồn của ảnh" />
            <v-text-field v-model="customForm.sourceLabel" label="Tên nguồn ảnh" />
            <v-text-field v-model="customForm.whoUrl" label="URL đúng thực thể WHO" />
            <v-text-field v-model="customForm.pathologyOutlinesUrl" label="URL đúng chủ đề PathologyOutlines" />
            <v-checkbox v-if="isEditor" v-model="customForm.isShared" label="Chia sẻ hồ sơ cho mọi người dùng" class="span-two" />
          </div>
          <p class="dialog-note">Hồ sơ tự thêm cần được người có chuyên môn kiểm tra trước khi chia sẻ. Không dùng chức năng này làm báo cáo chẩn đoán chính thức.</p>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="customDialogOpen=false">Hủy</v-btn><v-btn color="primary" :loading="customSaving" @click="saveNewCustomCase">Lưu hồ sơ</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right">{{ snackbar.text }}<template #actions><v-btn variant="text" @click="snackbar.show=false">Đóng</v-btn></template></v-snackbar>
  </div>
</template>

<style scoped>
.atlas-page { min-height: 100%; padding-bottom: 34px; overflow: hidden; background: #eef3f5; }
.atlas-hero { position: relative; min-height: 390px; padding: 42px max(28px, calc((100vw - 1680px) / 2)); display: grid; grid-template-columns: minmax(0, .92fr) minmax(470px, .78fr); align-items: center; gap: clamp(34px, 5vw, 82px); overflow: hidden; color: #fff; background: #102f43; }
.atlas-hero::before { content: ''; position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(108, 217, 210, .055) 1px, transparent 1px), linear-gradient(90deg, rgba(108, 217, 210, .055) 1px, transparent 1px); background-size: 42px 42px; mask-image: linear-gradient(90deg, #000, transparent 78%); }
.hero-content, .hero-gallery { position: relative; z-index: 1; }
.hero-kicker, .view-header p { margin: 0 0 10px; color: #f0cb58; font-size: .72rem; font-weight: 900; letter-spacing: 0; text-transform: uppercase; }
.hero-kicker { display: flex; align-items: center; gap: 9px; }
.live-dot { width: 8px; height: 8px; background: #55d8d0; border-radius: 50%; box-shadow: 0 0 0 6px rgba(85,216,208,.12); animation: livePulse 2.4s ease-in-out infinite; }
.atlas-hero h1 { margin: 0; font: 700 3.1rem/1.08 var(--font-heading); letter-spacing: 0; }
.hero-copy { max-width: 680px; margin: 14px 0 0; color: #cbdbe3; font-size: 1rem; line-height: 1.65; }
.hero-actions { margin-top: 25px; display: flex; flex-wrap: wrap; gap: 10px; }
.hero-primary, .hero-secondary { min-height: 44px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border-radius: 6px; font: 800 .82rem var(--font-body); cursor: pointer; transition: transform .2s ease, background-color .2s ease, border-color .2s ease; }
.hero-primary { color: #102f43; background: #f0cb58; border: 1px solid #f0cb58; }.hero-primary:hover { background: #ffe080; transform: translateY(-2px); }
.hero-secondary { color: #fff; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.26); }.hero-secondary:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.5); transform: translateY(-2px); }
.hero-stats { max-width: 610px; margin-top: 28px; display: grid; grid-template-columns: repeat(3, minmax(100px, 1fr)); }
.hero-stats div { padding-right: 20px; display: flex; flex-direction: column; }.hero-stats div + div { padding-left: 20px; border-left: 1px solid rgba(255,255,255,.2); }
.hero-stats strong { color: #fff; font-size: 1.55rem; line-height: 1; }.hero-stats span { margin-top: 7px; color: #9fb6c2; font-size: .72rem; }
.atlas-status { width: fit-content; min-height: 30px; margin-top: 20px; padding: 5px 10px; display: flex; align-items: center; gap: 7px; border: 1px solid; border-radius: 5px; font-size: .7rem; font-weight: 700; }.atlas-status.online { color: #94ebe1; background: rgba(23,105,95,.18); border-color: rgba(148,235,225,.26); }.atlas-status.local { color: #ffe28a; background: rgba(118,88,0,.18); border-color: rgba(255,226,138,.28); }
.hero-gallery { height: 310px; display: grid; grid-template-columns: 1.25fr .75fr; grid-template-rows: 1fr 1fr 1fr; gap: 10px; perspective: 900px; }
.hero-slide { position: relative; min-width: 0; min-height: 0; padding: 0; overflow: hidden; background: #203f50; border: 1px solid rgba(255,255,255,.18); border-radius: 7px; cursor: pointer; box-shadow: 0 18px 40px rgba(2,20,31,.32); animation: galleryReveal .7s ease both; transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease; }
.hero-slide-1 { grid-row: 1 / -1; animation-delay: .08s; }.hero-slide-2 { animation-delay: .16s; }.hero-slide-3 { animation-delay: .24s; }.hero-slide-4 { animation-delay: .32s; }
.hero-slide:hover { z-index: 2; border-color: #f0cb58; transform: translateY(-4px) scale(1.015); box-shadow: 0 24px 54px rgba(2,20,31,.44); }
.hero-slide :deep(.v-img__img) { transition: transform .55s ease; }.hero-slide:hover :deep(.v-img__img) { transform: scale(1.06); }
.hero-slide-shade { position: absolute; inset: 30% 0 0; background: linear-gradient(transparent, rgba(4,22,32,.94)); }
.hero-slide-copy { position: absolute; right: 12px; bottom: 12px; left: 12px; display: flex; flex-direction: column; color: #fff; text-align: left; }.hero-slide-copy small { margin-bottom: 3px; color: #76e0d7; font-size: .62rem; font-weight: 900; text-transform: uppercase; }.hero-slide-copy strong { font-size: .76rem; line-height: 1.35; }
.hero-slide-1 .hero-slide-copy { right: 18px; bottom: 18px; left: 18px; }.hero-slide-1 .hero-slide-copy strong { font-size: 1rem; }
.hero-gallery-empty { grid-column: 1/-1; grid-row: 1/-1; display: grid; place-content: center; justify-items: center; gap: 10px; color: #9eb6c2; border: 1px dashed rgba(255,255,255,.25); border-radius: 7px; }
.workspace-tabs { position: sticky; top: 68px; z-index: 30; padding: 0 max(18px, calc((100vw - 1680px) / 2)); background: rgba(255,255,255,.97); border-bottom: 1px solid #d5e0e4; box-shadow: 0 8px 24px rgba(18,50,67,.06); backdrop-filter: blur(12px); }
.state-panel { min-height: 420px; display: grid; place-content: center; justify-items: center; gap: 14px; color: #385568; }.error-state { color: #a13b3f; }
.organ-explorer { padding: 28px max(22px, calc((100vw - 1680px) / 2)) 24px; background: #fff; border-bottom: 1px solid #d7e2e6; }
.organ-explorer-heading { margin-bottom: 15px; display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }.organ-explorer-heading p { margin: 0 0 3px; color: #16877e; font-size: .66rem; font-weight: 900; }.organ-explorer-heading h2 { margin: 0; color: #15384b; font: 700 1.42rem var(--font-heading); }.organ-explorer-heading > span { color: #718791; font-size: .74rem; }
.organ-rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(172px, 1fr); gap: 9px; overflow-x: auto; padding: 2px 2px 10px; scroll-snap-type: x proximity; scrollbar-width: thin; }
.organ-rail button { position: relative; min-height: 74px; padding: 11px 12px; display: grid; grid-template-columns: 38px minmax(0,1fr) 18px; align-items: center; gap: 10px; overflow: hidden; color: #23475a; background: #f7fafb; border: 1px solid #d5e1e6; border-radius: 7px; text-align: left; cursor: pointer; scroll-snap-align: start; transition: color .2s ease, background-color .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
.organ-rail button::after { content: ''; position: absolute; right: 0; bottom: 0; left: 0; height: 3px; background: var(--organ-color); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }.organ-rail button:hover, .organ-rail button.active { color: #143548; background: #fff; border-color: color-mix(in srgb, var(--organ-color) 55%, #d5e1e6); transform: translateY(-2px); box-shadow: 0 10px 25px rgba(18,50,67,.1); }.organ-rail button:hover::after, .organ-rail button.active::after { transform: scaleX(1); }
.organ-icon { width: 38px; height: 38px; display: grid; place-items: center; color: #fff; background: var(--organ-color); border-radius: 6px; }.organ-label { min-width: 0; display: flex; flex-direction: column; }.organ-label strong { overflow: hidden; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }.organ-label small { margin-top: 4px; color: #758b96; font-size: .66rem; }.organ-arrow { color: #9aadb6; opacity: 0; transform: translateX(-5px); transition: opacity .2s ease, transform .2s ease; }.organ-rail button:hover .organ-arrow, .organ-rail button.active .organ-arrow { opacity: 1; transform: translateX(0); }
.atlas-workspace { max-width: 1740px; margin: 0 auto; }
.atlas-results { min-width: 0; padding: 28px clamp(18px,3vw,42px) 42px; }.atlas-toolbar { padding-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 30px; border-bottom: 1px solid #d8e2e6; }.toolbar-title { min-width: 0; display: flex; align-items: center; gap: 14px; }.toolbar-organ-icon { flex: 0 0 auto; width: 48px; height: 48px; display: grid; place-items: center; color: #fff; border-radius: 7px; box-shadow: 0 8px 18px rgba(18,50,67,.16); }.toolbar-title p { margin: 0; color: #16877e; font-size: .67rem; font-weight: 900; }.toolbar-title h2 { margin: 2px 0 0; color: #17364a; font: 700 1.55rem var(--font-heading); letter-spacing: 0; }.toolbar-title span:not(.toolbar-organ-icon) { max-width: 680px; display: block; margin-top: 4px; color: #6a808b; font-size: .72rem; line-height: 1.45; }.toolbar-actions { width: min(680px, 52%); display: grid; grid-template-columns: minmax(240px,1fr) auto; gap: 10px; }
.pattern-filter { margin: 19px 0 12px; padding: 11px 0; display: flex; flex-wrap: wrap; gap: 7px; border-top: 1px solid #d9e3e7; border-bottom: 1px solid #d9e3e7; }.pattern-filter button, .clue-groups button { min-height: 32px; padding: 5px 10px; color: #2d5366; background: #fff; border: 1px solid #c7d9e0; border-radius: 4px; font: 700 .72rem var(--font-body); cursor: pointer; }.pattern-filter button.active, .clue-groups button.active { color: #fff; background: #1d7180; border-color: #1d7180; }.results-summary { margin: 10px 0 13px; color: #69808c; font-size: .76rem; }
.case-grid { position: relative; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }.atlas-list-enter-active, .atlas-list-leave-active, .atlas-list-move { transition: opacity .34s ease, transform .34s ease; }.atlas-list-enter-from { opacity: 0; transform: translateY(18px); }.atlas-list-leave-to { opacity: 0; transform: scale(.97); }.atlas-list-leave-active { position: absolute; }
.load-more { padding: 25px 0 5px; display: flex; justify-content: center; }.empty-results { min-height: 250px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #69808c; text-align: center; }.empty-results strong { color: #385568; }.empty-results span { font-size: .8rem; }
.content-view { max-width: 1580px; margin: 0 auto; padding: 27px clamp(18px,3vw,38px) 42px; }.view-header { min-height: 94px; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }.view-header h2 { margin: 0; color: #17364a; font: 700 1.75rem var(--font-heading); letter-spacing: 0; }.view-header span { color: #6c818c; font-size: .8rem; }.view-counter { min-width: 130px; padding-left: 18px; display: flex; flex-direction: column; border-left: 2px solid #d4af37; }.view-counter strong { color: #17364a; font-size: 1.5rem; }.morphology-form, .library-filter { padding: 18px; display: grid; grid-template-columns: minmax(180px,.35fr) minmax(300px,1fr) auto; align-items: center; gap: 12px; background: #fff; border: 1px solid #d4e0e5; border-radius: 5px; }
.clue-groups { margin-top: 16px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }.clue-groups section { padding: 15px; background: #fff; border: 1px solid #d7e2e6; border-radius: 5px; }.clue-groups h3 { margin: 0 0 10px; color: #56717f; font: 800 .68rem var(--font-body); text-transform: uppercase; }.clue-groups section > div { display: flex; flex-wrap: wrap; gap: 6px; }.morph-results-heading { margin: 24px 0 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #d4e0e5; }.morph-results-heading h3 { margin: 0 0 9px; color: #17364a; font: 700 1rem var(--font-body); }.morph-results-heading span { color: #718691; font-size: .74rem; }
.library-filter { grid-template-columns: minmax(300px,1fr) minmax(240px,.4fr); margin-bottom: 18px; }.source-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }.source-card { min-width: 0; padding: 16px; background: #fff; border: 1px solid #d5e0e5; border-radius: 5px; box-shadow: 0 3px 10px rgba(20,53,71,.05); }.source-card-top { display: flex; justify-content: space-between; color: #16877e; font-size: .65rem; font-weight: 900; text-transform: uppercase; }.source-card-top small { color: #6d818b; }.source-card h3 { margin: 10px 0 0; color: #15374a; font: 700 .98rem/1.4 var(--font-body); letter-spacing: 0; }.source-card p { min-height: 36px; margin: 8px 0; color: #627985; font-size: .73rem; line-height: 1.45; }.source-card .source-english { min-height: 0; color: #315b6e; font-weight: 600; }.source-card a { min-height: 34px; margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; color: #176c70; font-size: .74rem; font-weight: 800; }
.editor-dialog :deep(.v-card-title) { color: #fff; background: #173b4e; font: 700 1.1rem var(--font-body); }.editor-dialog :deep(.v-card-text) { padding-top: 22px; }.field-divider { margin: 4px 0 18px; display: flex; align-items: center; gap: 10px; color: #7b8c95; font-size: .7rem; }.field-divider::before, .field-divider::after { content:''; flex:1; height:1px; background:#d9e2e6; }.dialog-note { padding: 10px 12px; color: #6c7f89; background: #eef3f5; border-left: 3px solid #d4af37; font-size: .72rem; line-height: 1.5; }.custom-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }.span-two { grid-column: 1/-1; }
@keyframes livePulse { 0%, 100% { box-shadow: 0 0 0 5px rgba(85,216,208,.1); } 50% { box-shadow: 0 0 0 9px rgba(85,216,208,0); } }
@keyframes galleryReveal { from { opacity: 0; transform: translateY(20px) rotateX(4deg); } to { opacity: 1; transform: translateY(0) rotateX(0); } }

@media (max-width: 1440px) {
  .case-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .atlas-hero { grid-template-columns: minmax(0,1fr) minmax(410px,.8fr); }
}
@media (max-width: 1180px) {
  .atlas-hero { min-height: 360px; grid-template-columns: minmax(0,1fr) minmax(360px,.72fr); gap: 30px; }
  .hero-gallery { height: 270px; }
  .source-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .atlas-toolbar { align-items: flex-start; flex-direction: column; }
  .toolbar-actions { width: 100%; }
}
@media (max-width: 960px) {
  .workspace-tabs { top: 62px; }
  .atlas-hero { min-height: 0; grid-template-columns: 1fr; }
  .hero-gallery { width: 100%; max-width: 720px; height: 300px; }
  .organ-explorer { padding-top: 22px; }
  .case-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .morphology-form { grid-template-columns: 1fr; }
  .clue-groups { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .atlas-hero { padding: 28px 16px; gap: 26px; }
  .atlas-hero h1 { font-size: 2.25rem; }
  .hero-copy { font-size: .9rem; }
  .hero-actions > button { width: 100%; }
  .hero-stats { width: 100%; }
  .hero-stats div { padding-right: 10px; }.hero-stats div + div { padding-left: 10px; }
  .hero-stats strong { font-size: 1.28rem; }.hero-stats span { font-size: .64rem; }
  .atlas-status { width: 100%; }
  .hero-gallery { height: 238px; grid-template-columns: 1.12fr .88fr; gap: 7px; }
  .hero-slide-copy strong { font-size: .68rem; }.hero-slide-1 .hero-slide-copy strong { font-size: .82rem; }
  .organ-explorer { padding-right: 14px; padding-left: 14px; }.organ-explorer-heading { align-items: flex-start; flex-direction: column; gap: 4px; }
  .organ-rail { grid-auto-columns: minmax(158px, 76vw); }
  .toolbar-title { align-items: flex-start; }.toolbar-title span:not(.toolbar-organ-icon) { display: none; }
  .toolbar-actions, .library-filter, .custom-form-grid { grid-template-columns: 1fr; }
  .case-grid, .source-grid { grid-template-columns: 1fr; }
  .content-view, .atlas-results { padding-right: 14px; padding-left: 14px; }
  .view-header { flex-direction: column; }.view-counter { padding-left: 0; border-left: 0; }.span-two { grid-column: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot, .hero-slide { animation: none; }
  .hero-slide, .hero-primary, .hero-secondary, .organ-rail button, .atlas-list-enter-active, .atlas-list-leave-active, .atlas-list-move { transition: none; }
}
</style>
