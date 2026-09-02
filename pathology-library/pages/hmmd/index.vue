<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  IHC_LOCALIZATION_OPTIONS,
  IHC_MARKER_ATLAS,
  type IhcMarkerProfile,
} from '~/utils/ihcMarkerAtlas'
import {
  IHC_MARKER_CATALOG,
  NORDIQC_SOURCE,
  type IhcMarkerCatalogEntry,
} from '~/utils/ihcMarkerCatalog'
import {
  HPA_IMAGE_METHOD_URL,
  HPA_LICENSE_URL,
  IHC_MARKER_IMAGES,
} from '~/utils/ihcMarkerImages'
import { IHC_MARKER_HPA_IMAGES } from '~/utils/ihcMarkerHpaImages'
import { markerFoundation } from '~/utils/ihcMarkerFoundations'
import { IHC_PANEL_REFERENCES, panelsForMarker } from '~/utils/ihcMarkerPanels'
import { IHC_MARKER_VI } from '~/utils/ihcMarkerTranslations'

definePageMeta({ layout: 'library', middleware: 'auth' })

const { dataset, loading, error, load } = useHmmdData()
const activeMode = ref<'atlas' | 'cases'>('atlas')

const markerQuery = ref('')
const markerOrgan = ref('all')
const localizationFilter = ref('all')
const catalogStatus = ref<'all' | 'reviewed' | 'images'>('all')
const catalogLimit = ref(40)
const selectedMarker = ref<IhcMarkerProfile | null>(null)
const selectedCatalogEntry = ref<IhcMarkerCatalogEntry | null>(null)
const markerDialogOpen = ref(false)
const catalogDialogOpen = ref(false)

const query = ref('')
const organ = ref('all')
const positiveMarkers = ref<string[]>([])
const negativeMarkers = ref<string[]>([])
const positiveMarkerSearch = ref('')
const negativeMarkerSearch = ref('')
const limit = ref(36)
const selectedCase = ref<any | null>(null)
const caseDialogOpen = ref(false)

const organLabels: Record<string, string> = {
  all: 'Tất cả cơ quan',
  biliary_pancreas: 'Đường mật - tụy',
  bone_soft_tissue: 'Xương - mô mềm',
  breast: 'Vú',
  cns: 'Hệ thần kinh trung ương',
  colorectal: 'Đại trực tràng',
  endocrine: 'Nội tiết',
  esophagus: 'Thực quản',
  gynecologic: 'Phụ khoa',
  head_neck: 'Đầu cổ',
  hematolymphoid: 'Huyết học - hạch lympho',
  kidney: 'Thận',
  liver: 'Gan',
  lung: 'Phổi',
  mediastinum: 'Trung thất',
  other: 'Khác / chưa phân nhóm',
  peritoneum_retroperitoneum: 'Phúc mạc - sau phúc mạc',
  skin: 'Da',
  small_bowel: 'Ruột non',
  stomach: 'Dạ dày',
  thyroid: 'Tuyến giáp',
  urinary_male: 'Tiết niệu - sinh dục nam',
}

const normalize = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim()

const hpaTissueVi: Record<string, string> = {
  Appendix: 'Ruột thừa',
  'Bone marrow': 'Tủy xương',
  Breast: 'Tuyến vú',
  'Cerebral cortex': 'Vỏ đại não',
  Cervix: 'Cổ tử cung',
  Colon: 'Đại tràng',
  Duodenum: 'Tá tràng',
  'Endometrium 2': 'Nội mạc tử cung (mẫu 2)',
  Epididymis: 'Mào tinh',
  'Fallopian tube': 'Vòi tử cung',
  Hypothalamus: 'Vùng hạ đồi',
  Kidney: 'Thận',
  'Lactating breast': 'Tuyến vú đang tiết sữa',
  Liver: 'Gan',
  Lung: 'Phổi',
  'Lymph node': 'Hạch lympho',
  'Oral mucosa': 'Niêm mạc miệng',
  Ovary: 'Buồng trứng',
  Pancreas: 'Tụy',
  Placenta: 'Nhau thai',
  Prostate: 'Tuyến tiền liệt',
  Rectum: 'Trực tràng',
  Retina: 'Võng mạc',
  'Salivary gland': 'Tuyến nước bọt',
  'Skeletal muscle': 'Cơ vân',
  'Skin 1': 'Da (mẫu 1)',
  'Small intestine': 'Ruột non',
  'Smooth muscle': 'Cơ trơn',
  Spleen: 'Lách',
  'Stomach 2': 'Dạ dày (mẫu 2)',
  Testis: 'Tinh hoàn',
  'Thyroid gland': 'Tuyến giáp',
  Tonsil: 'Amidan',
  'Urinary bladder': 'Bàng quang',
}

const localizedTissue = (value: string) => hpaTissueVi[value] ? `${hpaTissueVi[value]} / ${value}` : value
const localizedImageText = (value: string) => value
  .replace(/not detected/gi, 'không phát hiện')
  .replace(/\bhigh\b/gi, 'mạnh')
  .replace(/\bmedium\b/gi, 'trung bình')
  .replace(/\blow\b/gi, 'yếu')

const markerKey = (value: unknown) => normalize(value).replace(/[^a-z0-9]/g, '')
const cases = computed<any[]>(() => dataset.value?.cases || [])
const meta = computed(() => dataset.value?.meta || {})

const reviewedProfileIdsByCatalogId: Record<string, string> = {
  '14': 'alk',
  '1': 'ki67',
  '2': 'er',
  '9': 'napsina',
  '10': 'p40',
  '11': 'her2',
  '48': 'glypican3',
  '53': 'melana',
  '64': 'pax8',
  '71': 's100',
  '75': 'ttf1',
}

const reviewedProfiles = new Map(IHC_MARKER_ATLAS.map(item => [item.id, item]))

// Normal-tissue ALK expression is not a valid visual surrogate for ALK IHC in lung cancer.
// Keep the assay-specific FDA/NordiQC links in the ALK profile and do not show a mismatched tissue image.
const markerImagesFor = (entry: IhcMarkerCatalogEntry, profileId?: string) => {
  if (entry.name === 'ALK (lung)') return undefined
  return IHC_MARKER_IMAGES[profileId || ''] || IHC_MARKER_HPA_IMAGES[entry.name]
}

const localizationKeyFor = (value: string) => {
  const key = normalize(value)
  if (key.includes('nhan') && key.includes('bao tuong')) return 'nuclear-cytoplasmic'
  if (key.includes('mang') && key.includes('bao tuong')) return 'membranous-cytoplasmic'
  if (key.includes('nhan')) return 'nuclear'
  if (key.includes('mang')) return 'membranous'
  return 'cytoplasmic'
}

const markerCatalogItems = IHC_MARKER_CATALOG.map((entry) => {
  const profileId = reviewedProfileIdsByCatalogId[entry.id]
  const profile = reviewedProfiles.get(profileId)
  const foundation = markerFoundation(entry)
  return {
    entry,
    nameVi: IHC_MARKER_VI[entry.name] || entry.fullNameEn,
    profile,
    foundation,
    panels: panelsForMarker(entry.name),
    localizationKey: profile?.localization || localizationKeyFor(foundation.localization),
    images: markerImagesFor(entry, profileId),
  }
})

// The footer is a directory of source organizations. Marker-, clone- and assay-specific
// documents remain attached to the relevant marker profile to keep this list readable.
const referenceLibrary = [...IHC_PANEL_REFERENCES]

const markerAtlasStats = computed(() => ({
  markers: IHC_MARKER_CATALOG.length,
  reviewed: markerCatalogItems.filter(item => item.profile || item.foundation.curated).length,
  deepProfiles: IHC_MARKER_ATLAS.length,
  sourceReviewed: markerCatalogItems.filter(item => !item.profile && item.foundation.curated).length,
  imagePairs: markerCatalogItems.filter(item => item.images).length,
  panels: new Set(markerCatalogItems.flatMap(item => item.panels.map(panel => panel.id))).size,
  contexts: IHC_MARKER_ATLAS.reduce((total, item) => total + item.contexts.length, 0),
  sources: referenceLibrary.length,
}))

const markerOrganItems = computed(() => {
  const organs = [...new Set(IHC_MARKER_ATLAS.flatMap(item => item.organs))].sort((a, b) => a.localeCompare(b, 'vi'))
  return [{ value: 'all', title: 'Tất cả cơ quan / mô' }, ...organs.map(value => ({ value, title: value }))]
})

const markerSearchTextFor = (item: typeof markerCatalogItems[number]) => normalize([
  item.entry.name,
  item.entry.fullNameEn,
  item.nameVi,
  item.profile?.name,
  item.profile?.gene,
  ...(item.profile?.aliases || []),
  item.profile?.category,
  item.profile?.localizationVi,
  item.profile?.summaryVi,
  item.profile?.positiveVi,
  item.profile?.negativeVi,
  item.foundation.localization,
  item.foundation.positive,
  item.foundation.negative,
  ...item.foundation.indications,
  ...item.panels.flatMap(panel => [panel.title, panel.question, panel.rationale, ...panel.members.flatMap(member => [member.marker, member.role])]),
  ...(item.profile?.organs || []),
  ...(item.profile?.pitfallsVi || []),
  ...(item.profile?.contexts.flatMap(context => [context.organ, context.tissue, context.pattern, context.meaning, context.limitation]) || []),
].join(' '))

const markerCoreSearchTextFor = (item: typeof markerCatalogItems[number]) => normalize([
  item.entry.name,
  item.entry.fullNameEn,
  item.nameVi,
  item.profile?.name,
  item.profile?.gene,
  ...(item.profile?.aliases || []),
].join(' '))

const filteredAtlasMarkers = computed(() => {
  const tokens = normalize(markerQuery.value).split(/\s+/).filter(Boolean)
  return markerCatalogItems.filter((item) => {
    if (catalogStatus.value === 'reviewed' && !item.profile && !item.foundation.curated) return false
    if (catalogStatus.value === 'images' && !item.images) return false
    if (markerOrgan.value !== 'all' && !item.profile?.organs.includes(markerOrgan.value)) return false
    if (localizationFilter.value === 'mixed' && !item.localizationKey.includes('-')) return false
    if (localizationFilter.value !== 'all' && localizationFilter.value !== 'mixed' && item.localizationKey !== localizationFilter.value) return false
    const normalizedQuery = normalize(markerQuery.value)
    if (!normalizedQuery) return true
    const searchText = markerSearchTextFor(item)
    const coreSearchText = markerCoreSearchTextFor(item)
    const compactSearchText = markerKey(searchText)
    const compactQuery = markerKey(normalizedQuery)
    if (coreSearchText.includes(normalizedQuery) || markerKey(coreSearchText).includes(compactQuery)) return true
    if (tokens.length > 1) return searchText.includes(normalizedQuery) || compactSearchText.includes(compactQuery)
    return tokens.every(token => searchText.includes(token) || compactSearchText.includes(markerKey(token)))
  })
})

const visibleAtlasMarkers = computed(() => filteredAtlasMarkers.value.slice(0, catalogLimit.value))
const selectedMarkerCatalogEntry = computed(() => selectedMarker.value
  ? IHC_MARKER_CATALOG.find(entry => reviewedProfileIdsByCatalogId[entry.id] === selectedMarker.value?.id)
  : undefined)
const selectedMarkerCatalogItem = computed(() => selectedMarkerCatalogEntry.value
  ? markerCatalogItems.find(item => item.entry.id === selectedMarkerCatalogEntry.value?.id)
  : undefined)
const selectedMarkerImages = computed(() => selectedMarkerCatalogItem.value?.images)
const selectedMarkerPanels = computed(() => selectedMarkerCatalogEntry.value ? panelsForMarker(selectedMarkerCatalogEntry.value.name) : [])
const selectedMarkerIndications = computed(() => {
  if (!selectedMarker.value) return []
  if (selectedMarker.value.indicationsVi?.length) return selectedMarker.value.indicationsVi
  return selectedMarker.value.contexts.map(context => `${context.tissue}: ${context.meaning}`)
})
const selectedCatalogFoundation = computed(() => selectedCatalogEntry.value ? markerFoundation(selectedCatalogEntry.value) : undefined)
const selectedCatalogPanels = computed(() => selectedCatalogEntry.value ? panelsForMarker(selectedCatalogEntry.value.name) : [])
const selectedCatalogImages = computed(() => selectedCatalogEntry.value
  ? markerCatalogItems.find(item => item.entry.id === selectedCatalogEntry.value?.id)?.images
  : undefined)

const assessmentLabel = (value: string) => value.replace(/^Run\s*/i, 'Đợt ngoại kiểm ')

const openMarker = (item: IhcMarkerProfile) => {
  selectedMarker.value = item
  markerDialogOpen.value = true
}

const openCatalogItem = (item: typeof markerCatalogItems[number]) => {
  if (item.profile) {
    openMarker(item.profile)
    return
  }
  selectedCatalogEntry.value = item.entry
  catalogDialogOpen.value = true
}

const organItems = computed(() => {
  const counts = new Map<string, number>()
  for (const item of cases.value) counts.set(item.organ || 'other', (counts.get(item.organ || 'other') || 0) + 1)
  return [
    { value: 'all', title: `Tất cả cơ quan (${cases.value.length.toLocaleString('vi-VN')})` },
    ...[...counts.entries()]
      .sort((a, b) => (organLabels[a[0]] || a[0]).localeCompare(organLabels[b[0]] || b[0], 'vi'))
      .map(([value, count]) => ({ value, title: `${organLabels[value] || value} (${count.toLocaleString('vi-VN')})` })),
  ]
})

const markerItems = computed(() => {
  const variants = new Map<string, { title: string, value: string, key: string, count: number }>()
  for (const item of cases.value) {
    for (const marker of [...(item.positive || []), ...(item.negative || [])]) {
      const key = markerKey(marker)
      if (!key) continue
      const current = variants.get(key)
      variants.set(key, {
        title: current?.title || marker,
        value: current?.value || marker,
        key,
        count: (current?.count || 0) + 1,
      })
    }
  }
  return [...variants.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
})

const markerOptions = (searchValue: string, selected: string[], excluded: string[]) => {
  const searchKey = markerKey(searchValue)
  const selectedKeys = new Set(selected.map(markerKey))
  const excludedKeys = new Set(excluded.map(markerKey))
  const selectedOptions = markerItems.value.filter(item => selectedKeys.has(item.key))
  const matchingOptions = markerItems.value.filter((item) => {
    if (selectedKeys.has(item.key) || excludedKeys.has(item.key)) return false
    return !searchKey || item.key.includes(searchKey)
  })
  return [...selectedOptions, ...matchingOptions].slice(0, searchKey ? 80 : 40)
}

const positiveMarkerItems = computed(() => markerOptions(positiveMarkerSearch.value, positiveMarkers.value, negativeMarkers.value))
const negativeMarkerItems = computed(() => markerOptions(negativeMarkerSearch.value, negativeMarkers.value, positiveMarkers.value))

const searchTextFor = (item: any) => normalize([
  item.caseCode,
  item.nameVi,
  item.nameEn,
  item.diagnosisText,
  item.conclusionText,
  item.specimenSite,
  item.icdo,
  item.icd10Suggested,
  item.icd10SuggestedName,
  ...(item.positiveDisplay || item.positive || []),
  ...(item.negativeDisplay || item.negative || []),
  item.notesText,
].join(' '))

const hasMarkers = (values: string[], selected: string[]) => {
  const keys = new Set((values || []).map(markerKey))
  return selected.every(marker => keys.has(markerKey(marker)))
}

const filteredCases = computed(() => {
  const tokens = normalize(query.value).split(/\s+/).filter(Boolean)
  return cases.value.filter((item) => {
    if (organ.value !== 'all' && item.organ !== organ.value) return false
    if (!hasMarkers(item.positive || [], positiveMarkers.value)) return false
    if (!hasMarkers(item.negative || [], negativeMarkers.value)) return false
    const searchText = searchTextFor(item)
    const compactSearchText = markerKey(searchText)
    return tokens.every(token => searchText.includes(token) || compactSearchText.includes(markerKey(token)))
  })
})

const visibleCases = computed(() => filteredCases.value.slice(0, limit.value))
const firstLine = (value: unknown) => String(value || '').split(/\r?\n/).map(line => line.trim()).find(Boolean) || 'Chưa có kết luận HMMD'
const confidenceLabel = (value: string) => ({ high: 'Độ tin cậy cao', medium: 'Cần đối chiếu', low: 'Chưa phân nhóm chắc chắn' }[value] || 'Chưa đánh giá')

const openCase = (item: any) => {
  selectedCase.value = item
  caseDialogOpen.value = true
}

watch([query, organ, positiveMarkers, negativeMarkers], () => { limit.value = 36 })
watch([markerQuery, markerOrgan, localizationFilter, catalogStatus], () => { catalogLimit.value = 40 })
onMounted(() => load().catch(() => undefined))
</script>

<template>
  <div class="hmmd-page">
    <section class="hmmd-hero">
      <div>
        <p class="eyebrow">THƯ VIỆN CHUYÊN NGÀNH · CÓ XÁC THỰC</p>
        <h1>Thư viện Hóa mô miễn dịch</h1>
        <p>Tra cứu kiểu bắt màu, ý nghĩa theo cơ quan, bẫy diễn giải và đối chiếu trực tiếp với nguồn chuyên ngành.</p>
      </div>
      <div class="hero-stats" aria-label="Thống kê thư viện HMMD">
        <span><strong>{{ markerAtlasStats.markers }}</strong> marker nguồn độc lập</span>
        <span><strong>{{ markerAtlasStats.markers }}</strong> hồ sơ diễn giải nền</span>
        <span><strong>{{ markerAtlasStats.imagePairs }}</strong> cặp ảnh đối chứng</span>
      </div>
    </section>

    <nav class="mode-switcher" aria-label="Chế độ Thư viện HMMD">
      <button :class="{ active: activeMode === 'atlas' }" @click="activeMode = 'atlas'">
        <v-icon size="20">mdi-microscope</v-icon>
        <span><b>Atlas marker</b><small>Kiểu bắt màu và ý nghĩa</small></span>
      </button>
      <button :class="{ active: activeMode === 'cases' }" @click="activeMode = 'cases'">
        <v-icon size="20">mdi-file-search-outline</v-icon>
        <span><b>Tra ca thực hành</b><small>Tổ hợp dương tính và âm tính</small></span>
      </button>
    </nav>

    <v-alert type="warning" variant="tonal" density="compact" class="data-notice">
      Công cụ hỗ trợ học tập, không phải quy tắc chẩn đoán. Luôn diễn giải HMMD cùng hình thái, chứng nội, clone kháng thể, quy trình phòng xét nghiệm và bối cảnh lâm sàng.
    </v-alert>

    <template v-if="activeMode === 'atlas'">
      <section class="atlas-intro">
        <div>
          <p class="section-kicker">KHO MARKER ĐỘC LẬP · KHÔNG LẤY TỪ METADATA CA BỆNH</p>
          <h2>Tra marker trước chẩn đoán, đọc kiểu bắt màu theo từng mô</h2>
          <p>Danh mục nền đồng bộ từ NordiQC; {{ markerAtlasStats.reviewed }} hồ sơ đã đối chiếu chuyên biệt ({{ markerAtlasStats.deepProfiles }} hồ sơ theo cơ quan và {{ markerAtlasStats.sourceReviewed }} hồ sơ theo tiêu chí ngoại kiểm), {{ markerAtlasStats.panels }} panel phối hợp.</p>
        </div>
        <a class="source-status" :href="NORDIQC_SOURCE.url" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-shield-check-outline</v-icon><span>{{ markerAtlasStats.markers }} mục NordiQC · {{ markerAtlasStats.sources }} nhóm nguồn<br><small>Đồng bộ {{ NORDIQC_SOURCE.syncedAt }}</small></span></a>
      </section>

      <section class="marker-toolbar">
        <v-text-field
          v-model="markerQuery"
          label="Tìm tên marker, tên đầy đủ Anh/Việt, gen hoặc mô đích"
          placeholder="VD: TTF-1, thụ thể estrogen, CK7, protein sửa chữa bắt cặp sai..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
        />
        <v-select v-model="markerOrgan" :items="markerOrganItems" label="Cơ quan / mô" hide-details />
        <v-select v-model="localizationFilter" :items="IHC_LOCALIZATION_OPTIONS" label="Vị trí bắt màu" hide-details />
      </section>

      <div class="catalog-status" aria-label="Mức độ biên soạn">
        <button :class="{ active: catalogStatus === 'all' }" @click="catalogStatus = 'all'">Tất cả {{ markerAtlasStats.markers }}</button>
        <button :class="{ active: catalogStatus === 'reviewed' }" @click="catalogStatus = 'reviewed'">Đã đối chiếu chuyên biệt {{ markerAtlasStats.reviewed }}</button>
        <button :class="{ active: catalogStatus === 'images' }" @click="catalogStatus = 'images'">Có cặp ảnh {{ markerAtlasStats.imagePairs }}</button>
      </div>

      <div class="result-line atlas-result">
        <span><strong>{{ filteredAtlasMarkers.length }}</strong> marker phù hợp</span>
        <small>Mọi marker đều có hồ sơ nền và panel liên quan; trạng thái chuyên biệt chỉ dành cho hồ sơ đã đối chiếu nội dung theo cơ quan hoặc báo cáo ngoại kiểm của marker.</small>
      </div>

      <section v-if="filteredAtlasMarkers.length" class="marker-grid">
        <article v-for="item in visibleAtlasMarkers" :key="item.entry.id" class="marker-card" :class="{ 'index-only': !item.profile }" @click="openCatalogItem(item)">
          <header>
            <span>{{ item.profile ? item.profile.category : 'NordiQC assessment' }}</span>
            <small>{{ item.entry.assessmentYear }}</small>
          </header>
          <div v-if="item.images" class="marker-image-preview">
            <img :src="item.images.positive.imageUrl" :alt="`${item.entry.name}: ${localizedTissue(item.images.positive.tissue)}`" loading="lazy">
            <b>{{ localizedTissue(item.images.positive.tissue) }}</b>
          </div>
          <div v-else-if="item.profile" class="stain-preview" :class="item.profile.localization" aria-hidden="true">
            <span v-for="cell in 12" :key="cell" class="cell"><i /></span>
            <b>{{ item.profile.localizationVi }}</b>
          </div>
          <div v-else class="catalog-glyph" aria-hidden="true">
            <v-icon size="34">mdi-test-tube</v-icon>
            <span>{{ assessmentLabel(item.entry.latestAssessment) }}</span>
          </div>
          <div class="marker-card-body">
            <p class="marker-alias">{{ item.entry.fullNameEn }}</p>
            <h3>{{ item.entry.name }}</h3>
            <p>{{ item.profile?.summaryVi || item.nameVi }}</p>
            <div v-if="item.profile" class="organ-chips"><span v-for="target in item.profile.organs.slice(0, 4)" :key="target">{{ target }}</span></div>
            <div class="review-state" :class="{ ready: item.profile || item.foundation.curated }"><v-icon size="15">{{ item.profile || item.foundation.curated ? 'mdi-check-decagram' : 'mdi-book-open-page-variant-outline' }}</v-icon>{{ item.profile ? 'Đã biên soạn theo cơ quan' : item.foundation.curated ? 'Đã đối chiếu báo cáo ngoại kiểm' : 'Hồ sơ nền có nguồn trực tiếp' }}</div>
          </div>
          <footer><span>Mở hồ sơ marker</span><v-icon size="18">mdi-arrow-right</v-icon></footer>
        </article>
      </section>
      <div v-if="visibleAtlasMarkers.length < filteredAtlasMarkers.length" class="load-more"><v-btn variant="outlined" color="primary" @click="catalogLimit += 40">Hiển thị thêm marker</v-btn></div>
      <div v-else class="empty-state">
        <v-icon size="36">mdi-flask-empty-outline</v-icon>
        <h3>Chưa có marker phù hợp</h3>
        <p>Thử tên viết tắt, tên gen, tên tiếng Việt hoặc bỏ bớt bộ lọc.</p>
      </div>
    </template>

    <template v-else>
      <section class="search-panel">
        <div class="search-grid">
          <v-text-field v-model="query" label="Tên bệnh, mô tả, marker, vị trí hoặc ICD" placeholder="Nhập tiếng Việt, tiếng Anh, marker hoặc mã bệnh..." prepend-inner-icon="mdi-magnify" clearable hide-details />
          <v-select v-model="organ" :items="organItems" label="Cơ quan" hide-details />
          <v-autocomplete
            v-model="positiveMarkers"
            v-model:search="positiveMarkerSearch"
            :items="positiveMarkerItems"
            item-title="title"
            item-value="value"
            label="Dấu ấn dương tính"
            placeholder="Gõ tên dấu ấn..."
            prepend-inner-icon="mdi-plus-circle-outline"
            multiple chips closable-chips clearable auto-select-first no-filter hide-details
            :menu-props="{ maxHeight: 420 }"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props"><template #append><span class="marker-count">{{ item.raw.count.toLocaleString('vi-VN') }} ca</span></template></v-list-item>
            </template>
          </v-autocomplete>
          <v-autocomplete
            v-model="negativeMarkers"
            v-model:search="negativeMarkerSearch"
            :items="negativeMarkerItems"
            item-title="title"
            item-value="value"
            label="Dấu ấn âm tính"
            placeholder="Gõ tên dấu ấn..."
            prepend-inner-icon="mdi-minus-circle-outline"
            multiple chips closable-chips clearable auto-select-first no-filter hide-details
            :menu-props="{ maxHeight: 420 }"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props"><template #append><span class="marker-count">{{ item.raw.count.toLocaleString('vi-VN') }} ca</span></template></v-list-item>
            </template>
          </v-autocomplete>
        </div>
        <div class="result-line"><strong>{{ filteredCases.length.toLocaleString('vi-VN') }}</strong> ca phù hợp</div>
      </section>

      <div v-if="loading" class="state-box"><v-progress-circular indeterminate color="primary" /><span>Đang tải kho HMMD đã bảo vệ...</span></div>
      <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      <section v-else class="case-grid">
        <article v-for="item in visibleCases" :key="item.id" class="hmmd-card" @click="openCase(item)">
          <header><span>{{ organLabels[item.organ] || item.organ }}</span><small>{{ item.caseCode }}</small></header>
          <h2>{{ firstLine(item.conclusionText || item.nameVi) }}</h2>
          <p class="clinical"><strong>Chẩn đoán lâm sàng:</strong> {{ item.diagnosisText || item.nameEn || 'Chưa ghi nhận' }}</p>
          <div class="marker-groups">
            <div><b>Dương</b><span v-for="marker in (item.positiveDisplay || item.positive || []).slice(0, 5)" :key="marker">{{ marker }}</span><em v-if="(item.positive || []).length > 5">+{{ item.positive.length - 5 }}</em></div>
            <div><b>Âm</b><span v-for="marker in (item.negativeDisplay || item.negative || []).slice(0, 5)" :key="marker">{{ marker }}</span><em v-if="(item.negative || []).length > 5">+{{ item.negative.length - 5 }}</em></div>
          </div>
          <footer><span>{{ item.specimenSite || 'Chưa xác định vị trí' }}</span><v-icon size="18">mdi-arrow-right</v-icon></footer>
        </article>
      </section>

      <div v-if="visibleCases.length < filteredCases.length" class="load-more"><v-btn variant="outlined" color="primary" @click="limit += 36">Hiển thị thêm</v-btn></div>
    </template>

    <v-dialog v-model="markerDialogOpen" max-width="1180" scrollable>
      <v-card v-if="selectedMarker" class="marker-detail-card">
        <v-card-title class="detail-title marker-detail-title">
          <div>
            <small>{{ selectedMarker.category }} · {{ selectedMarker.gene }}</small>
            <h2>{{ selectedMarker.name }}</h2>
            <p>{{ selectedMarker.aliases.join(' · ') }}</p>
          </div>
          <v-btn icon="mdi-close" variant="text" aria-label="Đóng hồ sơ marker" @click="markerDialogOpen = false" />
        </v-card-title>
        <v-card-text class="marker-detail-content">
          <div class="marker-summary-layout">
            <div class="stain-preview detail-stain" :class="selectedMarker.localization" aria-hidden="true">
              <span v-for="cell in 20" :key="cell" class="cell"><i /></span>
              <b>{{ selectedMarker.localizationVi }}</b>
            </div>
            <div class="marker-summary-copy">
              <p class="section-kicker">KIỂU BẮT MÀU CẦN THẤY</p>
              <h3>{{ selectedMarker.signalVi }}</h3>
              <p>{{ selectedMarker.summaryVi }}</p>
              <div class="organ-chips"><span v-for="target in selectedMarker.organs" :key="target">{{ target }}</span></div>
            </div>
          </div>

          <section class="indication-section">
            <div><p class="section-kicker">KHI NÀO NÊN DÙNG</p><h3>Chỉ định và câu hỏi chẩn đoán</h3></div>
            <ul><li v-for="indication in selectedMarkerIndications" :key="indication">{{ indication }}</li></ul>
          </section>

          <section v-if="selectedMarkerImages" class="reference-images">
            <div class="section-heading">
              <div><p class="section-kicker">ẢNH MÔ THAM CHIẾU</p><h3>Đối chiếu vùng có biểu hiện và không phát hiện</h3></div>
              <a :href="HPA_IMAGE_METHOD_URL" target="_blank" rel="noopener noreferrer">Phương pháp HPA <v-icon size="16">mdi-open-in-new</v-icon></a>
            </div>
            <div class="image-pair">
              <a v-for="image in [selectedMarkerImages.positive, selectedMarkerImages.negative]" :key="image.imageUrl" :href="image.sourceUrl" target="_blank" rel="noopener noreferrer">
                <figure>
                  <div class="image-frame"><img :src="image.imageUrl" :alt="`${selectedMarker.name}: ${localizedImageText(image.label)} tại ${localizedTissue(image.tissue)}`" loading="lazy"></div>
                  <figcaption><b>{{ localizedImageText(image.label) }}</b><span>{{ localizedTissue(image.tissue) }} · {{ image.antibody }}</span><p>{{ localizedImageText(image.finding) }}</p><small>{{ image.source }} · {{ image.license }}</small></figcaption>
                </figure>
              </a>
            </div>
            <p class="image-note"><v-icon size="17">mdi-information-outline</v-icon>{{ selectedMarkerImages.note }} <a :href="HPA_LICENSE_URL" target="_blank" rel="noopener noreferrer">Giấy phép ảnh</a></p>
            <a v-if="selectedMarkerImages.diagnosticGuide" class="diagnostic-image-guide" :href="selectedMarkerImages.diagnosticGuide.url" target="_blank" rel="noopener noreferrer">
              <v-icon size="22">mdi-image-search-outline</v-icon>
              <span><b>{{ selectedMarkerImages.diagnosticGuide.title }}</b><small>{{ selectedMarkerImages.diagnosticGuide.note }}</small></span>
              <v-icon size="18">mdi-open-in-new</v-icon>
            </a>
          </section>

          <div class="interpretation-grid">
            <section><v-icon size="20">mdi-plus-circle-outline</v-icon><h3>Dương tính gợi ý</h3><p>{{ selectedMarker.positiveVi }}</p></section>
            <section><v-icon size="20">mdi-minus-circle-outline</v-icon><h3>Âm tính và giới hạn</h3><p>{{ selectedMarker.negativeVi }}</p></section>
            <section><v-icon size="20">mdi-check-decagram-outline</v-icon><h3>Chứng mô</h3><p>{{ selectedMarker.controlVi }}</p></section>
          </div>

          <section class="context-section">
            <div class="section-heading"><div><p class="section-kicker">DIỄN GIẢI THEO CƠ QUAN</p><h3>Không dùng một ngưỡng cho mọi mô</h3></div><span>{{ selectedMarker.contexts.length }} bối cảnh</span></div>
            <div class="context-list">
              <article v-for="context in selectedMarker.contexts" :key="`${context.organ}-${context.tissue}`">
                <header><b>{{ context.organ }}</b><span>{{ context.tissue }}</span></header>
                <dl>
                  <div><dt>Kiểu bắt màu</dt><dd>{{ context.pattern }}</dd></div>
                  <div><dt>Ý nghĩa</dt><dd>{{ context.meaning }}</dd></div>
                  <div><dt>Giới hạn</dt><dd>{{ context.limitation }}</dd></div>
                </dl>
              </article>
            </div>
          </section>

          <section v-if="selectedMarkerPanels.length" class="panel-section">
            <div class="section-heading"><div><p class="section-kicker">PHỐI HỢP MARKER</p><h3>Vì sao phải đọc theo panel</h3></div><span>{{ selectedMarkerPanels.length }} tình huống</span></div>
            <div class="panel-list">
              <article v-for="panel in selectedMarkerPanels" :key="panel.id">
                <header><div><small>{{ panel.question }}</small><h4>{{ panel.title }}</h4></div><v-icon size="20">mdi-vector-combine</v-icon></header>
                <p>{{ panel.rationale }}</p>
                <div class="panel-members">
                  <span v-for="member in panel.members" :key="member.marker" :class="{ current: member.marker === selectedMarkerCatalogEntry?.name }"><b>{{ member.marker }}</b><small>{{ member.role }}</small></span>
                </div>
                <footer><a v-if="selectedMarkerCatalogEntry" :href="selectedMarkerCatalogEntry.sourceUrl" target="_blank" rel="noopener noreferrer">Nguồn {{ selectedMarkerCatalogEntry.name }} <v-icon size="14">mdi-open-in-new</v-icon></a><a v-for="url in panel.sourceUrls" :key="url" :href="url" target="_blank" rel="noopener noreferrer">Nguồn panel <v-icon size="14">mdi-open-in-new</v-icon></a></footer>
              </article>
            </div>
          </section>

          <section class="pitfall-section">
            <div><p class="section-kicker">BẪY DIỄN GIẢI</p><h3>Điểm cần kiểm tra trước khi kết luận</h3></div>
            <ul><li v-for="pitfall in selectedMarker.pitfallsVi" :key="pitfall">{{ pitfall }}</li></ul>
          </section>

          <section class="sources-section">
            <div class="section-heading"><div><p class="section-kicker">NGUỒN ĐỐI CHIẾU</p><h3>Mở trực tiếp tài liệu gốc</h3></div><span>Rà soát {{ selectedMarker.reviewedAt }}</span></div>
            <a v-for="source in selectedMarker.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">
              <span><b>{{ source.organization }}</b>{{ source.title }}<small v-if="source.year">{{ source.year }}</small></span>
              <v-icon size="18">mdi-open-in-new</v-icon>
            </a>
          </section>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="catalogDialogOpen" max-width="1120" scrollable>
      <v-card v-if="selectedCatalogEntry" class="catalog-detail-card">
        <v-card-title class="detail-title marker-detail-title">
          <div>
            <small>DANH MỤC NGOẠI KIỂM NORDIQC · {{ selectedCatalogEntry.assessmentYear }}</small>
            <h2>{{ selectedCatalogEntry.name }}</h2>
            <p>{{ IHC_MARKER_VI[selectedCatalogEntry.name] || selectedCatalogEntry.fullNameEn }}</p>
          </div>
          <v-btn icon="mdi-close" variant="text" aria-label="Đóng chỉ mục marker" @click="catalogDialogOpen = false" />
        </v-card-title>
        <v-card-text class="catalog-detail-content">
          <div class="catalog-language-grid">
            <section><span>TIẾNG VIỆT</span><p>{{ IHC_MARKER_VI[selectedCatalogEntry.name] || 'Chưa có bản dịch đã rà soát.' }}</p></section>
            <section><span>ENGLISH</span><p>{{ selectedCatalogEntry.fullNameEn }}</p></section>
          </div>
          <v-alert :type="selectedCatalogFoundation?.curated ? 'success' : 'info'" variant="tonal" density="compact">
            {{ selectedCatalogFoundation?.curated ? selectedCatalogFoundation.evidenceLabel : 'Hồ sơ nền được tạo từ chỉ mục nguồn trực tiếp và panel học tập, chưa thay thế rà soát chuyên sâu theo từng cơ quan.' }} Không sử dụng marker đơn độc để suy ra chẩn đoán.
          </v-alert>

          <section v-if="selectedCatalogFoundation" class="foundation-summary">
            <div><p class="section-kicker">KIỂU BẮT MÀU CẦN ĐỌC</p><h3>{{ selectedCatalogFoundation.localization }}</h3></div>
            <div><p class="section-kicker">KHI NÀO NÊN DÙNG</p><ul><li v-for="item in selectedCatalogFoundation.indications" :key="item">{{ item }}</li></ul></div>
          </section>

          <section v-if="selectedCatalogImages" class="reference-images">
            <div class="section-heading"><div><p class="section-kicker">ẢNH MÔ THAM CHIẾU</p><h3>Biểu hiện ở mô bình thường</h3></div><a :href="HPA_IMAGE_METHOD_URL" target="_blank" rel="noopener noreferrer">Phương pháp HPA <v-icon size="16">mdi-open-in-new</v-icon></a></div>
            <div class="image-pair">
              <a v-for="image in [selectedCatalogImages.positive, selectedCatalogImages.negative]" :key="image.imageUrl" :href="image.sourceUrl" target="_blank" rel="noopener noreferrer">
                <figure><div class="image-frame"><img :src="image.imageUrl" :alt="`${selectedCatalogEntry.name}: ${localizedImageText(image.label)} tại ${localizedTissue(image.tissue)}`" loading="lazy"></div><figcaption><b>{{ localizedImageText(image.label) }}</b><span>{{ localizedTissue(image.tissue) }} · {{ image.antibody }}</span><p>{{ localizedImageText(image.finding) }}</p><small>{{ image.source }} · {{ image.license }}</small></figcaption></figure>
              </a>
            </div>
            <p class="image-note"><v-icon size="17">mdi-information-outline</v-icon>{{ selectedCatalogImages.note }} <a :href="HPA_LICENSE_URL" target="_blank" rel="noopener noreferrer">Giấy phép ảnh</a></p>
          </section>

          <div v-if="selectedCatalogFoundation" class="interpretation-grid">
            <section><v-icon size="20">mdi-plus-circle-outline</v-icon><h3>Dương tính gợi ý</h3><p>{{ selectedCatalogFoundation.positive }}</p></section>
            <section><v-icon size="20">mdi-minus-circle-outline</v-icon><h3>Âm tính và giới hạn</h3><p>{{ selectedCatalogFoundation.negative }}</p></section>
            <section><v-icon size="20">mdi-check-decagram-outline</v-icon><h3>Chứng mô</h3><p>{{ selectedCatalogFoundation.control }}</p></section>
          </div>

          <section v-if="selectedCatalogPanels.length" class="panel-section">
            <div class="section-heading"><div><p class="section-kicker">PHỐI HỢP MARKER</p><h3>Marker bổ trợ nhau như thế nào</h3></div><span>{{ selectedCatalogPanels.length }} tình huống</span></div>
            <div class="panel-list">
              <article v-for="panel in selectedCatalogPanels" :key="panel.id">
                <header><div><small>{{ panel.question }}</small><h4>{{ panel.title }}</h4></div><v-icon size="20">mdi-vector-combine</v-icon></header>
                <p>{{ panel.rationale }}</p>
                <div class="panel-members"><span v-for="member in panel.members" :key="member.marker" :class="{ current: member.marker === selectedCatalogEntry.name }"><b>{{ member.marker }}</b><small>{{ member.role }}</small></span></div>
                <footer><a :href="selectedCatalogEntry.sourceUrl" target="_blank" rel="noopener noreferrer">Nguồn {{ selectedCatalogEntry.name }} <v-icon size="14">mdi-open-in-new</v-icon></a><a v-for="url in panel.sourceUrls" :key="url" :href="url" target="_blank" rel="noopener noreferrer">Nguồn panel <v-icon size="14">mdi-open-in-new</v-icon></a></footer>
              </article>
            </div>
          </section>

          <section v-if="selectedCatalogFoundation" class="pitfall-section"><div><p class="section-kicker">BẪY DIỄN GIẢI</p><h3>Trước khi kết luận</h3></div><ul><li v-for="pitfall in selectedCatalogFoundation.pitfalls" :key="pitfall">{{ pitfall }}</li></ul></section>
          <div class="catalog-source-actions">
            <a :href="selectedCatalogEntry.sourceUrl" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-microscope</v-icon>Trang đánh giá NordiQC</a>
            <a :href="selectedCatalogEntry.reportUrl" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-file-pdf-box</v-icon>{{ assessmentLabel(selectedCatalogEntry.latestAssessment) }}</a>
            <a v-if="selectedCatalogEntry.protocolUrl" :href="selectedCatalogEntry.protocolUrl" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-flask-outline</v-icon>Quy trình được khuyến nghị</a>
          </div>
          <p class="assessment-explainer"><b>{{ assessmentLabel(selectedCatalogEntry.latestAssessment) }}</b> là mã đợt đánh giá ngoại kiểm kỹ thuật của NordiQC, không phải số lượng marker, điểm số hay mức độ dương tính.</p>
        </v-card-text>
      </v-card>
    </v-dialog>

    <section class="global-references" aria-labelledby="hmmd-reference-title">
      <div class="reference-intro"><p class="section-kicker">THƯ MỤC NGUỒN</p><h2 id="hmmd-reference-title">Nguồn nền tảng của PathologyLib</h2><p>Các tổ chức, hệ phân loại, hướng dẫn, chương trình ngoại kiểm và kho ảnh được dùng để xây dựng Atlas, Thư viện HMMD và công cụ tra cứu. Tài liệu riêng của từng dấu ấn, clone hoặc hệ thống xét nghiệm được đặt trong chính hồ sơ marker tương ứng.</p></div>
      <div class="reference-grid">
        <a v-for="source in referenceLibrary" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer"><span><small>{{ source.organization }}</small><b>{{ source.title }}</b></span><v-icon size="18">mdi-open-in-new</v-icon></a>
      </div>
    </section>

    <v-dialog v-model="caseDialogOpen" max-width="980" scrollable>
      <v-card v-if="selectedCase" class="detail-card">
        <v-card-title class="detail-title">
          <div><small>{{ selectedCase.caseCode }} · {{ organLabels[selectedCase.organ] || selectedCase.organ }}</small><h2>{{ firstLine(selectedCase.conclusionText || selectedCase.nameVi) }}</h2></div>
          <v-btn icon="mdi-close" variant="text" aria-label="Đóng chi tiết HMMD" @click="caseDialogOpen = false" />
        </v-card-title>
        <v-card-text>
          <section><h3>Kết luận HMMD</h3><p class="preserve-lines">{{ selectedCase.conclusionText || selectedCase.nameVi }}</p></section>
          <section><h3>Chẩn đoán lâm sàng / chỉ định</h3><p>{{ selectedCase.diagnosisText || selectedCase.nameEn || 'Chưa ghi nhận' }}</p></section>
          <div class="detail-markers">
            <section><h3>Dương tính</h3><div><span v-for="marker in (selectedCase.positiveDisplay || selectedCase.positive || [])" :key="marker">{{ marker }}</span><i v-if="!(selectedCase.positive || []).length">Không ghi nhận</i></div></section>
            <section><h3>Âm tính</h3><div><span v-for="marker in (selectedCase.negativeDisplay || selectedCase.negative || [])" :key="marker">{{ marker }}</span><i v-if="!(selectedCase.negative || []).length">Không ghi nhận</i></div></section>
          </div>
          <section v-if="selectedCase.notesText"><h3>Ghi chú</h3><p class="preserve-lines">{{ selectedCase.notesText }}</p></section>
          <div class="detail-meta">
            <span><b>Vị trí bệnh phẩm</b>{{ selectedCase.specimenSite || 'Chưa ghi nhận' }}</span>
            <span><b>ICD-10 gợi ý</b>{{ selectedCase.icd10Suggested ? `${selectedCase.icd10Suggested} · ${selectedCase.icd10SuggestedName || ''}` : 'Không có' }}</span>
            <span><b>Phân nhóm cơ quan</b>{{ confidenceLabel(selectedCase.organMappingConfidence) }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.hmmd-page { min-height: 100vh; padding: 28px clamp(14px, 3vw, 42px) 56px; color: #102d3c; background: transparent; }
.hmmd-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: clamp(24px, 4vw, 48px); color: white; background: #173b4e; border-bottom: 4px solid #e0b62f; }
.eyebrow,.section-kicker { margin: 0 0 8px; color: #2bbfb6; font: 800 .74rem var(--font-body); letter-spacing: .08em; }
.hmmd-hero .eyebrow { color: #63d9d0; }
.hmmd-hero h1 { margin: 0; font: 700 clamp(2rem, 4vw, 3.35rem)/1.05 var(--font-heading); letter-spacing: 0; }
.hmmd-hero p:last-child { max-width: 780px; margin: 14px 0 0; color: #d7e6eb; }
.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(92px, 1fr)); border: 1px solid rgba(255,255,255,.2); }
.hero-stats span { padding: 14px 18px; border-right: 1px solid rgba(255,255,255,.2); font-size: .76rem; }
.hero-stats span:last-child { border-right: 0; }
.hero-stats strong { display: block; color: #f2cf55; font-size: 1.5rem; }
.mode-switcher { display: flex; background: #fff; border: 1px solid #cbd9de; border-top: 0; }
.mode-switcher button { min-width: 220px; display: flex; align-items: center; gap: 10px; padding: 14px 18px; color: #58717d; text-align: left; border: 0; border-right: 1px solid #dbe5e8; background: transparent; cursor: pointer; }
.mode-switcher button.active { color: #0c6671; box-shadow: inset 0 -3px #e0b62f; background: #f5faf9; }
.mode-switcher span { display: grid; }
.mode-switcher b { font-size: .9rem; }
.mode-switcher small { margin-top: 2px; color: #7a8e97; }
.data-notice { margin: 16px 0; }
.atlas-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 22px 18px 16px; background: rgba(238,244,245,.97); border-right: 1px solid rgba(255,255,255,.18); border-left: 1px solid rgba(255,255,255,.18); }
.atlas-intro h2 { margin: 0; font: 700 1.65rem/1.2 var(--font-heading); letter-spacing: 0; }
.atlas-intro>div>p:last-child { margin: 8px 0 0; color: #617680; }
.source-status { display: flex; align-items: center; gap: 9px; padding: 10px 13px; color: #0b6e77; background: #e1f4f1; border-left: 3px solid #1fa99f; font-size: .82rem; font-weight: 700; text-decoration: none; }
.source-status small { color: #607b83; font-weight: 500; }
.marker-toolbar { display: grid; grid-template-columns: 1.6fr .85fr .85fr; gap: 12px; padding: 16px; background: white; border: 1px solid #cbd9de; }
.catalog-status { display: flex; flex-wrap: wrap; gap: 7px; padding: 12px 16px 4px; background: rgba(238,244,245,.97); border-right: 1px solid rgba(255,255,255,.18); border-left: 1px solid rgba(255,255,255,.18); }
.catalog-status button { padding: 8px 11px; color: #4c6671; background: white; border: 1px solid #c9dadd; border-radius: 4px; font: 700 .78rem var(--font-body); cursor: pointer; }
.catalog-status button.active { color: white; background: #126f7d; border-color: #126f7d; }
.result-line { margin-top: 16px; padding: 10px 14px; color: #5b717c; background: rgba(238,244,245,.97); border: 1px solid rgba(255,255,255,.18); }
.result-line strong { color: #0e7180; }
.atlas-result { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0 0 12px; }
.atlas-result small { max-width: 620px; text-align: right; }
.marker-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.marker-card { min-width: 0; display: flex; flex-direction: column; overflow: hidden; background: white; border: 1px solid #c7d7dc; border-radius: 6px; cursor: pointer; transition: border-color .18s, transform .18s, box-shadow .18s; }
.marker-card:hover { border-color: #168b91; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(18,59,71,.1); }
.marker-card.index-only { cursor: pointer; }
.marker-card>header,.marker-card>footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; }
.marker-card>header { color: #0a747c; border-bottom: 1px solid #dce7ea; font-size: .7rem; font-weight: 800; text-transform: uppercase; }
.marker-card>header small { color: #6b818a; text-transform: none; }
.marker-card>footer { margin-top: auto; color: #0b6874; border-top: 1px solid #e3ebee; font-size: .78rem; font-weight: 750; }
.marker-card-body { padding: 14px; }
.marker-card h3 { margin: 3px 0 8px; font: 800 1.32rem/1.15 var(--font-body); letter-spacing: 0; }
.marker-card-body>p:not(.marker-alias) { min-height: 62px; margin: 0; color: #5c707a; font-size: .84rem; line-height: 1.5; }
.marker-alias { min-height: 17px; margin: 0; color: #738891; font-size: .72rem; }
.catalog-glyph { min-height: 104px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #2d7f88; background: repeating-linear-gradient(135deg,#edf6f6,#edf6f6 12px,#e6f1f2 12px,#e6f1f2 24px); }
.catalog-glyph span { color: #607985; font-size: .72rem; font-weight: 700; }
.marker-image-preview { position: relative; height: 134px; overflow: hidden; background: #e8edef; }
.marker-image-preview img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .22s ease; }
.marker-card:hover .marker-image-preview img { transform: scale(1.025); }
.marker-image-preview b { position: absolute; right: 8px; bottom: 8px; max-width: calc(100% - 16px); overflow: hidden; padding: 4px 7px; color: white; background: rgba(12,45,58,.86); border-radius: 4px; font-size: .67rem; text-overflow: ellipsis; white-space: nowrap; }
.review-state { display: flex; align-items: center; gap: 5px; margin-top: 12px; color: #71858e; font-size: .68rem; font-weight: 700; }
.review-state.ready { color: #087b67; }
.organ-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
.organ-chips span { padding: 3px 7px; color: #176d72; background: #e9f5f3; border: 1px solid #c6e4df; border-radius: 4px; font-size: .68rem; font-weight: 700; }
.stain-preview { position: relative; min-height: 134px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; align-content: center; padding: 16px; overflow: hidden; background: #eee8f5; }
.stain-preview::after { position: absolute; inset: 0; content: ''; background: radial-gradient(circle at 20% 10%, rgba(255,255,255,.45), transparent 42%); pointer-events: none; }
.stain-preview .cell { position: relative; aspect-ratio: 1.2; display: grid; place-items: center; border: 3px solid rgba(121,83,144,.35); border-radius: 48% 52% 45% 55%; background: #d8c7e7; transform: rotate(-5deg); }
.stain-preview .cell:nth-child(3n) { transform: rotate(8deg) scale(.9); }
.stain-preview .cell i { width: 42%; aspect-ratio: 1; border-radius: 50%; background: #76518b; box-shadow: inset 0 0 0 2px rgba(255,255,255,.18); }
.stain-preview b { position: absolute; right: 9px; bottom: 8px; z-index: 1; padding: 4px 7px; color: white; background: rgba(21,51,62,.86); border-radius: 4px; font-size: .67rem; }
.stain-preview.nuclear .cell i { background: #9a531d; box-shadow: 0 0 0 2px #c78c4b; }
.stain-preview.membranous .cell { border-color: #a75c1d; box-shadow: inset 0 0 0 1px #d79b59; }
.stain-preview.cytoplasmic .cell { background: #bd8047; border-color: rgba(121,83,144,.28); }
.stain-preview.cytoplasmic .cell i { background: #76518b; }
.stain-preview.nuclear-cytoplasmic .cell { background: #bd8047; }
.stain-preview.nuclear-cytoplasmic .cell i { background: #884817; box-shadow: 0 0 0 2px #cf9554; }
.stain-preview.membranous-cytoplasmic .cell { background: #c98a4c; border-color: #964e17; box-shadow: inset 0 0 0 1px #e3b274; }
.empty-state { min-height: 280px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #6b8089; background: rgba(238,244,245,.97); text-align: center; }
.empty-state h3,.empty-state p { margin: 0; }
.marker-count { color: #71858f; font-size: .72rem; font-weight: 700; }
.search-panel { padding: 20px; background: white; border: 1px solid #cbd9de; }
.search-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 12px; }
.state-box { min-height: 320px; display: grid; place-content: center; justify-items: center; gap: 14px; }
.case-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
.hmmd-card { min-width: 0; display: flex; flex-direction: column; padding: 18px; background: white; border: 1px solid #c9d7dc; cursor: pointer; transition: border-color .18s, transform .18s; }
.hmmd-card:hover { border-color: #168b91; transform: translateY(-2px); }
.hmmd-card header,.hmmd-card footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.hmmd-card header span { color: #087a82; font-weight: 700; }
.hmmd-card header small { color: #72858e; }
.hmmd-card h2 { margin: 12px 0 8px; font: 700 1.08rem/1.38 var(--font-body); letter-spacing: 0; }
.clinical { min-height: 48px; margin: 0 0 12px; color: #5c717c; font-size: .86rem; }
.marker-groups { display: grid; gap: 8px; margin-top: auto; }
.marker-groups>div { display: flex; flex-wrap: wrap; gap: 5px; }
.marker-groups b { width: 52px; font-size: .74rem; }
.marker-groups>div:first-child b { color: #087a60; }
.marker-groups>div:nth-child(2) b { color: #b3424b; }
.marker-groups span,.marker-groups em,.detail-markers span { padding: 3px 7px; color: #395663; background: #edf4f5; border: 1px solid #d4e2e5; font: 600 .7rem var(--font-body); font-style: normal; }
.hmmd-card footer { margin-top: 16px; padding-top: 12px; color: #0d6874; border-top: 1px solid #e2eaed; font-size: .8rem; }
.load-more { padding: 24px; text-align: center; }
.detail-card,.marker-detail-card { border-top: 4px solid #e0b62f; }
.detail-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; white-space: normal; }
.detail-title small { color: #087a82; }
.detail-title h2 { margin-top: 6px; font: 700 1.35rem/1.35 var(--font-body); letter-spacing: 0; }
.detail-card section { margin-bottom: 18px; }
.detail-card h3 { margin-bottom: 8px; color: #173b4e; font: 700 .84rem var(--font-body); text-transform: uppercase; }
.preserve-lines { white-space: pre-line; }
.detail-markers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.detail-markers section { padding: 14px; background: #f4f8f9; border-left: 3px solid #168b91; }
.detail-markers section:nth-child(2) { border-left-color: #c74a58; }
.detail-markers section div { display: flex; flex-wrap: wrap; gap: 6px; }
.detail-meta { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid #d7e2e5; }
.detail-meta span { padding: 12px; border-right: 1px solid #d7e2e5; }
.detail-meta span:last-child { border-right: 0; }
.detail-meta b { display: block; margin-bottom: 4px; color: #72858e; font-size: .72rem; text-transform: uppercase; }
.marker-detail-title { padding: 22px 26px 16px; background: #f7fafb; border-bottom: 1px solid #d9e4e7; }
.marker-detail-title h2 { margin: 5px 0 2px; font-size: 2rem; }
.marker-detail-title p { margin: 0; color: #6d818b; font-size: .82rem; }
.marker-detail-content { padding: 22px 26px 30px !important; }
.marker-summary-layout { display: grid; grid-template-columns: 290px 1fr; gap: 24px; align-items: stretch; }
.detail-stain { min-height: 210px; grid-template-columns: repeat(5,1fr); border: 1px solid #d4e0e4; border-radius: 6px; }
.marker-summary-copy { align-self: center; }
.marker-summary-copy h3 { margin: 0; color: #173b4e; font: 750 1.12rem/1.45 var(--font-body); }
.marker-summary-copy>p:not(.section-kicker) { margin: 10px 0 0; color: #5d727c; }
.indication-section { display: grid; grid-template-columns: 250px 1fr; gap: 24px; margin-top: 22px; padding: 18px; background: #edf7f6; border-left: 4px solid #168b91; }
.indication-section h3 { margin: 0; color: #173b4e; font: 700 1.2rem/1.25 var(--font-heading); letter-spacing: 0; }
.indication-section ul { margin: 0; padding-left: 19px; color: #405f6b; font-size: .84rem; line-height: 1.55; }
.indication-section li+li { margin-top: 8px; }
.reference-images { margin-top: 22px; padding-top: 20px; border-top: 1px solid #d3e0e4; }
.reference-images .section-heading>a { display: inline-flex; align-items: center; gap: 4px; color: #0a737b; font-size: .76rem; font-weight: 700; text-decoration: none; }
.image-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.image-pair>a { color: inherit; text-decoration: none; }
.image-pair figure { height: 100%; margin: 0; overflow: hidden; background: #f7fafb; border: 1px solid #ccdadd; border-radius: 6px; }
.image-frame { aspect-ratio: 16/9; overflow: hidden; background: #e8edef; }
.image-frame img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .22s ease; }
.image-pair>a:hover img { transform: scale(1.025); }
.image-pair figcaption { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; padding: 12px; }
.image-pair figcaption>b { color: #0c756e; }
.image-pair figcaption>span { color: #617781; text-align: right; font-size: .74rem; }
.image-pair figcaption>p { grid-column: 1/-1; margin: 3px 0 0; color: #425f6b; font-size: .79rem; line-height: 1.45; }
.image-pair figcaption>small { grid-column: 1/-1; color: #798b93; }
.image-note { display: flex; align-items: flex-start; gap: 7px; margin: 10px 0 0; padding: 10px 12px; color: #5e7078; background: #fff9e8; border-left: 3px solid #e0b62f; font-size: .76rem; line-height: 1.45; }
.image-note a { margin-left: auto; color: #0a737b; white-space: nowrap; }
.diagnostic-image-guide { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 11px 13px; color: #fff; background: #126f7d; border-radius: 5px; text-decoration: none; }
.diagnostic-image-guide span { display: grid; flex: 1; }
.diagnostic-image-guide b { font-size: .82rem; }
.diagnostic-image-guide small { margin-top: 2px; color: #d5eef0; font-size: .72rem; }
.diagnostic-image-guide:hover { background: #0d5e69; }
.catalog-detail-card { border-top: 4px solid #e0b62f; }
.catalog-detail-content { padding: 20px 24px 26px !important; }
.catalog-language-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin-bottom: 16px; background: #cedde1; border: 1px solid #cedde1; }
.catalog-language-grid section { padding: 14px; background: #f7fafb; }
.catalog-language-grid span { color: #0a747c; font-size: .68rem; font-weight: 800; }
.catalog-language-grid p { margin: 6px 0 0; color: #294b59; }
.catalog-source-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.catalog-source-actions a { display: inline-flex; align-items: center; gap: 7px; padding: 9px 11px; color: #0c6571; border: 1px solid #bcd4d8; border-radius: 4px; font-size: .76rem; font-weight: 750; text-decoration: none; }
.catalog-source-actions a:hover { border-color: #178f94; background: #f0f8f8; }
.assessment-explainer { margin: 12px 0 0; color: #607680; font-size: .78rem; line-height: 1.45; }
.foundation-summary { display: grid; grid-template-columns: .85fr 1.6fr; gap: 1px; margin-top: 18px; background: #cddde1; border: 1px solid #cddde1; }
.foundation-summary>div { min-width: 0; padding: 17px; background: #f6fafb; }
.foundation-summary h3 { margin: 0; color: #173b4e; font: 750 1rem/1.45 var(--font-body); }
.foundation-summary ul { margin: 0; padding-left: 18px; color: #405f6b; font-size: .8rem; line-height: 1.55; }
.foundation-summary li+li { margin-top: 7px; }
.interpretation-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; margin: 22px 0; background: #cedde1; border: 1px solid #cedde1; }
.interpretation-grid section { min-width: 0; padding: 18px; background: #f7fafb; }
.interpretation-grid .v-icon { color: #10818a; }
.interpretation-grid h3 { margin: 8px 0 6px; color: #173b4e; font: 800 .88rem var(--font-body); }
.interpretation-grid p { margin: 0; color: #536b76; font-size: .82rem; line-height: 1.55; }
.context-section,.panel-section,.pitfall-section,.sources-section { margin-top: 22px; padding-top: 20px; border-top: 1px solid #d3e0e4; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.section-heading h3,.pitfall-section h3 { margin: 0; font: 700 1.28rem/1.2 var(--font-heading); letter-spacing: 0; }
.section-heading>span { color: #6a818a; font-size: .76rem; }
.context-list { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-top: 14px; }
.context-list article { border: 1px solid #cbdadd; border-radius: 6px; overflow: hidden; }
.context-list header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #eaf3f4; }
.context-list header b { color: #0a747c; font-size: .74rem; text-transform: uppercase; }
.context-list header span { color: #294b59; font-size: .8rem; }
.context-list dl { margin: 0; }
.context-list dl>div { display: grid; grid-template-columns: 105px 1fr; gap: 10px; padding: 9px 12px; border-top: 1px solid #e2eaed; }
.context-list dt { color: #71858e; font-size: .7rem; font-weight: 800; text-transform: uppercase; }
.context-list dd { margin: 0; color: #445e6a; font-size: .78rem; line-height: 1.45; }
.panel-list { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-top: 14px; }
.panel-list article { min-width: 0; padding: 15px; background: #f7fafb; border: 1px solid #cbdadd; border-radius: 6px; }
.panel-list article>header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.panel-list article>header .v-icon { flex: 0 0 auto; color: #0c7b82; }
.panel-list h4 { margin: 3px 0 0; color: #173b4e; font: 800 .98rem/1.3 var(--font-body); }
.panel-list header small { color: #6b818b; font-size: .7rem; }
.panel-list article>p { margin: 10px 0 12px; color: #4b6671; font-size: .8rem; line-height: 1.5; }
.panel-members { display: grid; gap: 6px; }
.panel-members span { min-width: 0; display: grid; grid-template-columns: minmax(72px,.35fr) 1fr; gap: 8px; padding: 7px 9px; background: white; border-left: 3px solid #b9ced3; }
.panel-members span.current { background: #e6f5f2; border-left-color: #12a093; }
.panel-members b { color: #0c6873; font-size: .75rem; overflow-wrap: anywhere; }
.panel-members small { color: #58717c; font-size: .7rem; line-height: 1.35; }
.panel-list footer { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 11px; }
.panel-list footer a { display: inline-flex; align-items: center; gap: 3px; color: #0b7078; font-size: .68rem; font-weight: 750; text-decoration: none; }
.global-references { display: grid; grid-template-columns: minmax(260px,.7fr) 1.3fr; gap: 30px; margin-top: 34px; padding: 28px; color: #eaf4f6; background: #173b4e; border-top: 4px solid #e0b62f; }
.reference-intro h2 { margin: 0; color: white; font: 700 1.65rem/1.2 var(--font-heading); }
.reference-intro>p:last-child { margin: 10px 0 0; color: #c3d7dd; font-size: .84rem; line-height: 1.55; }
.reference-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
.reference-grid>a { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; color: white; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.18); text-decoration: none; }
.reference-grid>a:hover { background: rgba(255,255,255,.1); border-color: #62d6ce; }
.reference-grid span { min-width: 0; display: grid; }
.reference-grid small { color: #64d6cf; font-size: .66rem; font-weight: 800; text-transform: uppercase; }
.reference-grid b { margin-top: 3px; color: #f4f8f9; font-size: .78rem; line-height: 1.35; }
.pitfall-section { display: grid; grid-template-columns: 250px 1fr; gap: 24px; }
.pitfall-section ul { margin: 0; padding-left: 19px; color: #4e6671; font-size: .84rem; line-height: 1.55; }
.pitfall-section li+li { margin-top: 8px; }
.sources-section>a { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 8px; padding: 11px 12px; color: #274b59; border: 1px solid #d4e0e4; border-radius: 5px; text-decoration: none; }
.sources-section>a:hover { color: #087780; border-color: #22a9a4; background: #f2faf9; }
.sources-section>a span { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 9px; }
.sources-section>a b { color: #0a737b; }
.sources-section>a small { color: #73868f; }
@media (max-width: 1180px) { .marker-grid { grid-template-columns: repeat(3,1fr); }.search-grid { grid-template-columns: 1fr 1fr; }.case-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 900px) { .hmmd-hero { align-items: flex-start; flex-direction: column; }.marker-toolbar { grid-template-columns: 1fr; }.marker-grid { grid-template-columns: repeat(2,1fr); }.marker-summary-layout { grid-template-columns: 240px 1fr; }.interpretation-grid,.foundation-summary { grid-template-columns: 1fr; }.context-list,.panel-list { grid-template-columns: 1fr; }.global-references { grid-template-columns: 1fr; } }
@media (max-width: 680px) { .hmmd-page { padding: 12px 10px 36px; }.hmmd-hero { padding: 24px 18px; }.hero-stats { width: 100%; }.hero-stats span { padding: 10px; }.mode-switcher button { flex: 1; min-width: 0; padding: 12px; }.mode-switcher small { display: none; }.atlas-intro { align-items: flex-start; flex-direction: column; }.atlas-result { align-items: flex-start; flex-direction: column; gap: 4px; }.atlas-result small { text-align: left; }.marker-grid,.search-grid,.case-grid,.detail-markers,.detail-meta,.marker-summary-layout,.image-pair,.catalog-language-grid,.reference-grid { grid-template-columns: 1fr; }.marker-card-body>p:not(.marker-alias) { min-height: 0; }.marker-detail-content,.catalog-detail-content { padding: 16px !important; }.marker-detail-title { padding: 16px; }.context-list dl>div { grid-template-columns: 1fr; gap: 3px; }.indication-section,.pitfall-section { grid-template-columns: 1fr; gap: 10px; }.detail-meta span { border-right: 0; border-bottom: 1px solid #d7e2e5; }.detail-meta span:last-child { border-bottom: 0; }.image-note { flex-wrap: wrap; }.image-note a { margin-left: 0; }.panel-members span { grid-template-columns: 1fr; gap: 2px; }.global-references { padding: 20px 16px; } }
</style>
