<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  matchesPathologySearch,
  normalizePathologySearch,
  pathologyAliasExpansions,
  pathologySearchScore,
} from '~/utils/pathologySearch'
import { icdoTranslationLabel, translateIcdoTerm } from '~/utils/icdoVietnamese'

definePageMeta({ layout: 'library', middleware: 'auth' })

type SourceTerm = { type: string; term: string }
type ChangeItem = { type: string; Term?: string; 'ICDO3.2'?: string; 'Term 3.2'?: string; 'Change type'?: string }
type MorphologyEntry = {
  code: string
  legacyCode: string
  extension: string
  behaviour: string
  preferred: string
  terms: SourceTerm[]
  codeReferences: string[]
  seeAlso: string[]
  notes: string[]
  includes: string[]
  excludes: string[]
  otherText: string[]
  changes: ChangeItem[]
}
type TopographyEntry = {
  code: string
  preferred: string
  terms: SourceTerm[]
  hierarchy: Array<{ code: string; term: string }>
  optional: boolean
  notes: string[]
  codeReferences: string[]
  includes: string[]
  excludes: string[]
  otherText: string[]
  changes: ChangeItem[]
}
type Catalog = {
  meta: Record<string, any>
  behaviours: Record<string, { vi: string; en: string }>
  morphology: MorphologyEntry[]
  topography: TopographyEntry[]
  optionalTopography: TopographyEntry[]
  deletedMorphologyCodes: Array<Record<string, string>>
}

const catalog = ref<Catalog | null>(null)
const loading = ref(true)
const loadError = ref('')
const morphologyQuery = ref('')
const topographyQuery = ref('')
const behaviourFilter = ref('all')
const includeOptionalTopography = ref(false)
const morphologyLimit = ref(36)
const topographyLimit = ref(24)
const selectedMorphology = ref<MorphologyEntry | null>(null)
const selectedTopography = ref<TopographyEntry | null>(null)
const copied = ref(false)

const translationFor = (value: string) => translateIcdoTerm(value)
const translatedText = (value: string) => translationFor(value).text
const sourceOnlyLabel = 'Chưa có bản dịch tiếng Việt đã kiểm duyệt'

const codeQueryMatches = (entry: MorphologyEntry, query: string) => {
  const compactQuery = query.toUpperCase().replace(/[^A-Z0-9/]/g, '')
  if (!compactQuery) return false
  return entry.code.replace(/[^A-Z0-9/]/g, '').includes(compactQuery)
    || entry.legacyCode.replace(/[^A-Z0-9/]/g, '').includes(compactQuery)
}

const morphologyFields = (entry: MorphologyEntry) => [
  entry.code,
  entry.legacyCode,
  entry.preferred,
  translatedText(entry.preferred),
  ...entry.terms.flatMap(term => [term.term, translatedText(term.term)]),
]

const topographyFields = (entry: TopographyEntry) => [
  entry.code,
  entry.preferred,
  translatedText(entry.preferred),
  ...entry.terms.flatMap(term => [term.term, translatedText(term.term)]),
  ...entry.hierarchy.flatMap(item => [item.term, translatedText(item.term)]),
]

const FEATURED_TERMS = [
  'adenocarcinoma, nos',
  'squamous cell carcinoma, nos',
  'basal cell carcinoma, nos',
  'hepatocellular carcinoma, nos',
  'renal cell carcinoma, nos',
  'urothelial carcinoma, nos',
  'papillary thyroid carcinoma, nos',
  'small cell carcinoma, nos',
  'gastrointestinal stromal tumour',
  'diffuse large b-cell lymphoma, nos',
  'glioblastoma, nos',
  'melanoma, nos',
]

const featuredMorphology = computed(() => {
  if (!catalog.value) return []
  return FEATURED_TERMS
    .map(term => catalog.value?.morphology.find(entry => entry.preferred.toLowerCase() === term))
    .filter(Boolean) as MorphologyEntry[]
})

const morphologyResults = computed(() => {
  if (!catalog.value) return []
  const query = morphologyQuery.value.trim()
  if (!query) {
    return featuredMorphology.value
      .filter(entry => behaviourFilter.value === 'all' || entry.behaviour === behaviourFilter.value)
      .slice(0, morphologyLimit.value)
  }
  return catalog.value.morphology
    .filter((entry) => {
      if (behaviourFilter.value !== 'all' && entry.behaviour !== behaviourFilter.value) return false
      return codeQueryMatches(entry, query) || matchesPathologySearch(morphologyFields(entry), query)
    })
    .sort((a, b) => {
      const exactA = codeQueryMatches(a, query) ? 1000 : 0
      const exactB = codeQueryMatches(b, query) ? 1000 : 0
      return exactB + pathologySearchScore(morphologyFields(b), query)
        - exactA - pathologySearchScore(morphologyFields(a), query)
    })
    .slice(0, morphologyLimit.value)
})

const allTopography = computed(() => {
  if (!catalog.value) return []
  return includeOptionalTopography.value
    ? [...catalog.value.topography, ...catalog.value.optionalTopography]
    : catalog.value.topography
})

const FEATURED_SITES = ['C34.9', 'C50.9', 'C16.9', 'C18.9', 'C22.0', 'C25.9', 'C61.9', 'C64.9', 'C73.9', 'C54.1', 'C56.9', 'C44.9']
const topographyResults = computed(() => {
  const query = topographyQuery.value.trim()
  if (!query) {
    return FEATURED_SITES
      .map(code => allTopography.value.find(entry => entry.code === code))
      .filter(Boolean)
      .slice(0, topographyLimit.value) as TopographyEntry[]
  }
  const normalized = normalizePathologySearch(query)
  return allTopography.value
    .filter(entry => normalizePathologySearch(entry.code).includes(normalized) || matchesPathologySearch(topographyFields(entry), query))
    .sort((a, b) => pathologySearchScore(topographyFields(b), query) - pathologySearchScore(topographyFields(a), query))
    .slice(0, topographyLimit.value)
})

const behaviourItems = computed(() => [
  { value: 'all', label: 'Tất cả hành vi' },
  ...Object.entries(catalog.value?.behaviours || {}).map(([value, item]) => ({ value, label: `/${value} · ${item.vi}` })),
])
const morphologyAliases = computed(() => pathologyAliasExpansions(morphologyQuery.value))
const combinedCode = computed(() => {
  if (!selectedTopography.value && !selectedMorphology.value) return ''
  return [selectedTopography.value?.code, selectedMorphology.value?.code].filter(Boolean).join(' · ')
})
const selectedBehaviour = computed(() => selectedMorphology.value
  ? catalog.value?.behaviours?.[selectedMorphology.value.behaviour]
  : null)

const setMorphology = (entry: MorphologyEntry) => {
  selectedMorphology.value = entry
  window.scrollTo({ top: 170, behavior: 'smooth' })
}
const setTopography = (entry: TopographyEntry) => {
  selectedTopography.value = entry
  window.scrollTo({ top: 170, behavior: 'smooth' })
}
const copyCombinedCode = async () => {
  if (!combinedCode.value) return
  await navigator.clipboard.writeText(combinedCode.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
const changeBadges = (entry: MorphologyEntry | TopographyEntry) => [...new Set(entry.changes.map(change => change.type))]
const changeLabel = (value: string) => ({
  'new-four-digit': 'Mã hình thái mới',
  'new-five-digit': 'Mã chi tiết mới',
  'code-change': 'Đổi mã',
  'behaviour-change': 'Đổi mã hành vi',
  'new-term': 'Thuật ngữ mới',
  'term-change': 'Đổi thuật ngữ',
  'new-code': 'Mã vị trí mới',
  'new-optional-code': 'Mã tùy chọn mới',
  'new-optional-term': 'Thuật ngữ tùy chọn mới',
  'optional-term-change': 'Đổi thuật ngữ tùy chọn',
}[value] || value)

onMounted(async () => {
  try {
    const response = await fetch('/icdo-data/icdo4-catalog.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    catalog.value = await response.json()
  } catch (error: any) {
    loadError.value = `Không thể tải danh mục ICD-O-4: ${error?.message || 'lỗi không xác định'}`
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="icdo-page">
    <section class="icdo-hero">
      <div class="hero-copy">
        <p class="eyebrow">IARC · FINAL TABLES 20.07.2026</p>
        <h1>Tra cứu ICD-O-4</h1>
        <p>Tra mã vị trí cơ quan và hình thái u bằng tiếng Việt, English, mã đầy đủ hoặc từ viết tắt. Danh pháp tiếng Anh được giữ nguyên theo bảng chính thức của WHO/IARC.</p>
        <div class="hero-actions">
          <a href="#coding-workspace" class="primary-action"><v-icon size="18">mdi-magnify</v-icon> Bắt đầu tra cứu</a>
          <a :href="catalog?.meta?.sourceUrl" target="_blank" rel="noopener" class="secondary-action"><v-icon size="18">mdi-open-in-new</v-icon> Nguồn ICD-O-4</a>
        </div>
      </div>
      <div class="hero-stats" aria-label="Thống kê danh mục">
        <div><strong>{{ catalog?.meta?.morphologyCodeCount?.toLocaleString('vi-VN') || '2.390' }}</strong><span>mã hình thái</span></div>
        <div><strong>{{ catalog?.meta?.morphologyTermCount?.toLocaleString('vi-VN') || '4.720' }}</strong><span>thuật ngữ</span></div>
        <div><strong>{{ catalog?.meta?.topographyCodeCount?.toLocaleString('vi-VN') || '337' }}</strong><span>mã vị trí chuẩn</span></div>
      </div>
    </section>

    <main id="coding-workspace" class="icdo-workspace">
      <div v-if="loading" class="state-panel"><v-progress-circular indeterminate color="primary" /><span>Đang kiểm tra và lập chỉ mục ICD-O-4...</span></div>
      <div v-else-if="loadError" class="state-panel error"><v-icon>mdi-alert-circle-outline</v-icon><span>{{ loadError }}</span></div>

      <template v-else-if="catalog">
        <section class="coding-strip" aria-labelledby="coding-summary-title">
          <div class="strip-heading">
            <div><p>PHIẾU MÃ HÓA HAI TRỤC</p><h2 id="coding-summary-title">Vị trí + Hình thái / Hành vi</h2></div>
            <button class="icon-button" :disabled="!combinedCode" :title="copied ? 'Đã sao chép' : 'Sao chép mã đang chọn'" @click="copyCombinedCode">
              <v-icon size="20">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
            </button>
          </div>
          <div class="selection-grid">
            <button class="selection-cell" :class="{ empty: !selectedTopography }" @click="topographyQuery = ''">
              <span>01 · VỊ TRÍ CƠ QUAN / TOPOGRAPHY</span>
              <strong>{{ selectedTopography?.code || 'Chưa chọn mã Cxx.x' }}</strong>
              <p v-if="selectedTopography">{{ translatedText(selectedTopography.preferred) || sourceOnlyLabel }}</p>
              <small>{{ selectedTopography?.preferred || 'Chọn cơ quan ở cột bên phải' }}</small>
            </button>
            <button class="selection-cell" :class="{ empty: !selectedMorphology }" @click="morphologyQuery = ''">
              <span>02 · HÌNH THÁI / MORPHOLOGY</span>
              <strong>{{ selectedMorphology?.code || 'Chưa chọn mã 5 chữ số / hành vi' }}</strong>
              <p v-if="selectedMorphology">{{ translatedText(selectedMorphology.preferred) || sourceOnlyLabel }}</p>
              <small>{{ selectedMorphology?.preferred || 'Tìm chẩn đoán ở vùng kết quả chính' }}</small>
            </button>
            <div class="combined-cell" :class="{ ready: selectedTopography && selectedMorphology }">
              <span>KẾT QUẢ ĐỐI CHIẾU</span>
              <strong>{{ combinedCode || 'Cxx.x · xxxxx/x' }}</strong>
              <p>{{ selectedBehaviour ? `${selectedBehaviour.vi} / ${selectedBehaviour.en}` : 'Mã hành vi nằm sau dấu “/” của mã hình thái.' }}</p>
            </div>
          </div>
          <p class="coding-note"><v-icon size="16">mdi-information-outline</v-icon> ICD-O mã hóa vị trí và hình thái trên hai trục độc lập. Luôn đối chiếu quy tắc đăng ký ung thư và hạn chế vị trí của từng thực thể trước khi sử dụng.</p>
        </section>

        <section class="lookup-grid">
          <div class="morphology-panel">
            <div class="panel-heading">
              <div><p>CHẨN ĐOÁN / MORPHOLOGY</p><h2>Tra mã hình thái</h2></div>
              <span>{{ morphologyResults.length }} kết quả đang hiển thị</span>
            </div>
            <div class="search-row">
              <label class="search-box">
                <v-icon size="21">mdi-magnify</v-icon>
                <input v-model="morphologyQuery" type="search" placeholder="Tên Việt, English, BCC, SCC, HCC, PTC, 8140/3..." @input="morphologyLimit = 36">
                <button v-if="morphologyQuery" title="Xóa nội dung tìm kiếm" @click="morphologyQuery = ''"><v-icon size="18">mdi-close</v-icon></button>
              </label>
              <select v-model="behaviourFilter" aria-label="Lọc theo mã hành vi">
                <option v-for="item in behaviourItems" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </div>
            <p v-if="morphologyAliases.length" class="alias-note"><v-icon size="16">mdi-lightbulb-on-outline</v-icon> Đã nhận dạng viết tắt và đối chiếu với: {{ morphologyAliases.slice(0, 3).join(' · ') }}</p>

            <div v-if="morphologyResults.length" class="morphology-list">
              <article v-for="entry in morphologyResults" :key="entry.code" class="morphology-card" :class="{ selected: selectedMorphology?.code === entry.code }">
                <button class="card-main" @click="setMorphology(entry)">
                  <span class="code-badge">{{ entry.code }}</span>
                  <span class="translation-status" :class="translationFor(entry.preferred).status">{{ icdoTranslationLabel(translationFor(entry.preferred).status) }}</span>
                  <h3>{{ translatedText(entry.preferred) || sourceOnlyLabel }}</h3>
                  <p class="english-term">{{ entry.preferred }}</p>
                  <div class="card-meta">
                    <span>Mã hình thái 4 chữ số để tra cứu: {{ entry.legacyCode || 'Không áp dụng' }}</span>
                    <span>{{ entry.terms.length }} thuật ngữ nguồn</span>
                  </div>
                  <div v-if="changeBadges(entry).length" class="change-row">
                    <span v-for="badge in changeBadges(entry).slice(0, 3)" :key="badge">{{ changeLabel(badge) }}</span>
                  </div>
                </button>
                <div class="behaviour-row">
                  <span :class="`behaviour behaviour-${entry.behaviour}`">/{{ entry.behaviour }} · {{ catalog.behaviours[entry.behaviour]?.vi || 'Mã hành vi khác' }}</span>
                  <button title="Chọn mã hình thái này" @click="setMorphology(entry)"><v-icon size="19">mdi-arrow-right</v-icon></button>
                </div>
              </article>
            </div>
            <div v-else class="empty-results"><v-icon size="32">mdi-database-search-outline</v-icon><strong>Chưa tìm thấy mã phù hợp</strong><span>Thử tên tiếng Việt, tên tiếng Anh, mã ICD-O-4 hoặc một từ viết tắt chuyên ngành.</span></div>
          </div>

          <aside class="topography-panel">
            <div class="panel-heading compact">
              <div><p>CƠ QUAN / TOPOGRAPHY</p><h2>Chọn vị trí</h2></div>
            </div>
            <label class="search-box topo-search">
              <v-icon size="20">mdi-map-marker-search-outline</v-icon>
              <input v-model="topographyQuery" type="search" placeholder="Vú, phổi, dạ dày, breast, C50..." @input="topographyLimit = 24">
              <button v-if="topographyQuery" title="Xóa nội dung tìm kiếm" @click="topographyQuery = ''"><v-icon size="18">mdi-close</v-icon></button>
            </label>
            <label class="optional-toggle">
              <input v-model="includeOptionalTopography" type="checkbox">
              <span><strong>Hiện mã vị trí chi tiết tùy chọn</strong><small>ICD-O-4 optional four-digit topography</small></span>
            </label>

            <div class="topography-list">
              <button v-for="entry in topographyResults" :key="`${entry.optional}-${entry.code}`" class="topography-item" :class="{ selected: selectedTopography?.code === entry.code && selectedTopography?.optional === entry.optional }" @click="setTopography(entry)">
                <span class="site-code">{{ entry.code }}</span>
                <span class="site-copy">
                  <strong>{{ translatedText(entry.preferred) || sourceOnlyLabel }}</strong>
                  <small>{{ entry.preferred }}</small>
                  <i v-if="entry.optional">Mã chi tiết tùy chọn</i>
                </span>
                <v-icon size="18">mdi-chevron-right</v-icon>
              </button>
            </div>
            <button v-if="topographyResults.length >= topographyLimit" class="load-more" @click="topographyLimit += 24">Hiện thêm vị trí</button>
          </aside>
        </section>

        <section v-if="selectedMorphology" class="detail-panel">
          <div class="detail-title">
            <div><p>HỒ SƠ MÃ ĐANG CHỌN</p><h2>{{ selectedMorphology.code }} · {{ translatedText(selectedMorphology.preferred) || selectedMorphology.preferred }}</h2></div>
            <button class="icon-button" title="Đóng hồ sơ" @click="selectedMorphology = null"><v-icon size="20">mdi-close</v-icon></button>
          </div>
          <div class="detail-grid">
            <div>
              <span class="detail-label">Danh pháp chính thức / Preferred term</span>
              <strong>{{ selectedMorphology.preferred }}</strong>
              <p>{{ translatedText(selectedMorphology.preferred) || 'Chưa có bản dịch tiếng Việt đã kiểm duyệt; giữ nguyên danh pháp nguồn để tránh diễn giải sai.' }}</p>
            </div>
            <div>
              <span class="detail-label">Hành vi / Behaviour</span>
              <strong>/{{ selectedMorphology.behaviour }} · {{ selectedBehaviour?.vi }}</strong>
              <p>{{ selectedBehaviour?.en }}</p>
            </div>
          </div>
          <div class="term-table">
            <div class="table-head"><span>Quan hệ</span><span>Tiếng Việt hỗ trợ tra cứu</span><span>Thuật ngữ WHO/IARC</span></div>
            <div v-for="term in selectedMorphology.terms.slice(0, 18)" :key="`${term.type}-${term.term}`" class="table-row">
              <span>{{ term.type }}</span>
              <span>{{ translatedText(term.term) || sourceOnlyLabel }}</span>
              <span>{{ term.term }}</span>
            </div>
          </div>
          <div v-if="selectedMorphology.codeReferences.length || selectedMorphology.notes.length || selectedMorphology.includes.length || selectedMorphology.excludes.length" class="coding-details">
            <p v-if="selectedMorphology.codeReferences.length"><strong>Giới hạn vị trí:</strong> {{ selectedMorphology.codeReferences.join(' · ') }}</p>
            <p v-if="selectedMorphology.includes.length"><strong>Bao gồm:</strong> {{ selectedMorphology.includes.join(' · ') }}</p>
            <p v-if="selectedMorphology.excludes.length"><strong>Loại trừ:</strong> {{ selectedMorphology.excludes.join(' · ') }}</p>
            <p v-if="selectedMorphology.notes.length"><strong>Ghi chú nguồn:</strong> {{ selectedMorphology.notes.join(' · ') }}</p>
          </div>
        </section>

        <section class="source-panel">
          <div><p>NGUỒN DỮ LIỆU</p><h2>Bảng cuối cùng ICD-O-4 của IARC/WHO</h2><span>Dữ liệu được lập chỉ mục từ ba tệp người dùng cung cấp; tên tiếng Anh và cấu trúc mã được giữ nguyên. Bản dịch tiếng Việt chỉ hỗ trợ tìm và học.</span></div>
          <div class="source-links">
            <a :href="catalog.meta.sourceUrl" target="_blank" rel="noopener"><span><strong>WHO/IARC</strong><small>ICD-O-4 official tables</small></span><v-icon size="18">mdi-open-in-new</v-icon></a>
            <a :href="catalog.meta.releaseUrl" target="_blank" rel="noopener"><span><strong>IARC News</strong><small>Thông báo phát hành bảng cuối cùng</small></span><v-icon size="18">mdi-open-in-new</v-icon></a>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.icdo-page { min-height: 100vh; color: #17364a; background: rgba(234,241,244,.96); }
.icdo-hero { min-height: 340px; padding: 54px max(28px,calc((100vw - 1500px)/2)); display: grid; grid-template-columns: minmax(0,1fr) 470px; align-items: center; gap: 52px; color: #fff; background: rgba(10,39,57,.9); border-bottom: 3px solid #d4af37; }
.hero-copy { max-width: 840px; }.eyebrow,.panel-heading p,.strip-heading p,.detail-title p,.source-panel > div > p { margin: 0 0 8px; color: #54d9d2; font-size: .69rem; font-weight: 900; letter-spacing: .03em; text-transform: uppercase; }.hero-copy h1 { margin: 0; font: 700 3.2rem/1 var(--font-heading); }.hero-copy > p:last-of-type { max-width: 780px; margin: 17px 0 0; color: #c4d4dc; font-size: .95rem; line-height: 1.7; }.hero-actions { margin-top: 25px; display: flex; flex-wrap: wrap; gap: 10px; }.hero-actions a { min-height: 43px; padding: 0 17px; display: inline-flex; align-items: center; gap: 8px; border-radius: 5px; font-size: .79rem; font-weight: 800; }.primary-action { color: #112e40; background: #f0cb58; }.secondary-action { color: #fff; border: 1px solid rgba(255,255,255,.32); background: rgba(255,255,255,.06); }
.hero-stats { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid rgba(255,255,255,.18); background: rgba(6,28,43,.5); }.hero-stats div { min-height: 122px; padding: 20px; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid rgba(255,255,255,.16); }.hero-stats div:last-child { border: 0; }.hero-stats strong { color: #f0cb58; font: 700 1.85rem var(--font-heading); }.hero-stats span { margin-top: 4px; color: #b8cad4; font-size: .69rem; }
.icdo-workspace { width: min(1500px,calc(100% - 48px)); margin: 0 auto; padding: 28px 0 50px; }.state-panel { min-height: 300px; display: grid; place-items: center; align-content: center; gap: 15px; background: #fff; border: 1px solid #d2dfe4; }.state-panel.error { color: #a7343f; }
.coding-strip,.morphology-panel,.topography-panel,.detail-panel,.source-panel { background: #fff; border: 1px solid #cad9df; border-radius: 6px; box-shadow: 0 12px 30px rgba(17,48,65,.07); }.coding-strip { padding: 22px; }.strip-heading,.panel-heading,.detail-title { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }.strip-heading h2,.panel-heading h2,.detail-title h2,.source-panel h2 { margin: 0; font: 700 1.6rem/1.2 var(--font-heading); }.icon-button { width: 38px; height: 38px; display: grid; place-items: center; color: #126b75; background: #f3f8f9; border: 1px solid #c7d9df; border-radius: 4px; }.icon-button:disabled { opacity: .45; cursor: not-allowed; }
.selection-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr .8fr; border: 1px solid #cadbe1; }.selection-cell,.combined-cell { min-height: 132px; padding: 17px; display: flex; flex-direction: column; text-align: left; background: #f7fafb; border-right: 1px solid #cadbe1; }.selection-cell:hover { background: #eef7f7; }.selection-cell > span,.combined-cell > span { color: #17877f; font-size: .61rem; font-weight: 900; }.selection-cell strong,.combined-cell strong { margin-top: 8px; color: #123448; font-size: 1.05rem; }.selection-cell p,.combined-cell p { margin: 8px 0 0; color: #425f70; font-size: .73rem; }.selection-cell small { margin-top: 3px; color: #748995; font-size: .66rem; }.selection-cell.empty { border-top: 3px solid #9eafb8; }.combined-cell { border-right: 0; background: #102f43; }.combined-cell > span { color: #63ddd7; }.combined-cell strong { color: #fff; font: 700 1.3rem var(--font-heading); }.combined-cell p { color: #bdd0da; }.combined-cell.ready { border-top: 3px solid #f0cb58; }.coding-note { margin: 14px 0 0; display: flex; align-items: flex-start; gap: 8px; color: #667e8b; font-size: .7rem; }
.lookup-grid { margin-top: 18px; display: grid; grid-template-columns: minmax(0,1fr) 440px; align-items: start; gap: 18px; }.morphology-panel,.topography-panel { padding: 22px; }.panel-heading > span { color: #708792; font-size: .69rem; }.panel-heading.compact { align-items: center; }.search-row { margin-top: 16px; display: grid; grid-template-columns: minmax(0,1fr) 260px; gap: 10px; }.search-box { min-height: 46px; padding: 0 13px; display: flex; align-items: center; gap: 9px; background: #fff; border: 1px solid #9db3bd; border-radius: 4px; }.search-box:focus-within { border-color: #128a91; box-shadow: 0 0 0 3px rgba(18,138,145,.1); }.search-box input { min-width: 0; flex: 1; border: 0; outline: 0; color: #17364a; background: transparent; font: 500 .82rem var(--font-body); }.search-box button { color: #607985; }.search-row select { padding: 0 12px; color: #17364a; background: #fff; border: 1px solid #9db3bd; border-radius: 4px; font: 600 .78rem var(--font-body); }.alias-note { margin: 10px 0 0; padding: 8px 10px; display: flex; align-items: center; gap: 7px; color: #365e6e; background: #eef8f7; border-left: 3px solid #1fa39d; font-size: .68rem; }
.morphology-list { margin-top: 16px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 11px; }.morphology-card { min-width: 0; overflow: hidden; border: 1px solid #cfdae0; border-radius: 5px; background: #fff; }.morphology-card:hover,.morphology-card.selected { border-color: #17999a; box-shadow: 0 10px 22px rgba(20,100,107,.1); }.morphology-card.selected { box-shadow: inset 4px 0 #17999a; }.card-main { width: 100%; min-height: 190px; padding: 15px; display: block; text-align: left; }.code-badge { display: inline-flex; padding: 4px 7px; color: #fff; background: #13536a; border-radius: 3px; font-size: .7rem; font-weight: 900; }.translation-status { float: right; padding: 4px 6px; color: #486672; background: #edf3f5; border-radius: 3px; font-size: .54rem; font-style: normal; font-weight: 800; }.translation-status.curated { color: #08766f; background: #e2f5f2; }.translation-status.assisted { color: #8a6510; background: #fff4d6; }.card-main h3 { min-height: 48px; margin: 13px 0 0; color: #13384b; font: 700 1.06rem/1.32 var(--font-heading); }.english-term { min-height: 38px; margin: 5px 0 0; color: #5f7480; font-size: .72rem; line-height: 1.45; }.card-meta { margin-top: 12px; padding-top: 10px; display: flex; justify-content: space-between; gap: 10px; color: #7b8e97; border-top: 1px solid #e2e9ec; font-size: .59rem; }.change-row { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px; }.change-row span { padding: 3px 5px; color: #7b5b08; background: #fff4d1; font-size: .55rem; font-weight: 800; }.behaviour-row { min-height: 42px; padding: 8px 11px; display: flex; align-items: center; justify-content: space-between; background: #f5f8f9; border-top: 1px solid #dce6e9; }.behaviour { padding: 4px 6px; color: #355566; background: #e8f0f3; border-radius: 3px; font-size: .59rem; font-weight: 800; }.behaviour-3,.behaviour-6,.behaviour-9 { color: #9b2434; background: #fce9ec; }.behaviour-0 { color: #14754f; background: #e2f4eb; }.behaviour-2 { color: #815d09; background: #fff2cc; }
.topography-panel { position: sticky; top: 88px; }.topo-search { margin-top: 16px; }.optional-toggle { margin: 10px 0 14px; padding: 10px; display: flex; align-items: flex-start; gap: 9px; color: #315668; background: #f3f7f8; border: 1px solid #dae4e8; font-size: .69rem; }.optional-toggle input { margin-top: 3px; accent-color: #138985; }.optional-toggle span { display: flex; flex-direction: column; }.optional-toggle small { color: #7b8f98; font-size: .58rem; }.topography-list { display: grid; gap: 6px; }.topography-item { width: 100%; min-height: 68px; padding: 10px; display: grid; grid-template-columns: 66px minmax(0,1fr) 20px; align-items: center; gap: 10px; text-align: left; background: #fff; border: 1px solid #d3dfe4; border-radius: 4px; }.topography-item:hover,.topography-item.selected { border-color: #138985; background: #edf8f7; }.site-code { padding: 7px 5px; color: #fff; background: #164b60; border-radius: 3px; text-align: center; font-size: .69rem; font-weight: 900; }.site-copy { min-width: 0; display: flex; flex-direction: column; }.site-copy strong { overflow: hidden; color: #173a4d; font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }.site-copy small { margin-top: 3px; overflow: hidden; color: #6f848f; font-size: .61rem; text-overflow: ellipsis; white-space: nowrap; }.site-copy i { width: fit-content; margin-top: 4px; padding: 2px 4px; color: #84610d; background: #fff0bf; font-size: .51rem; font-style: normal; font-weight: 800; }.load-more { width: 100%; margin-top: 9px; padding: 9px; color: #126b75; border: 1px solid #b8d5d7; font-size: .68rem; font-weight: 800; }.empty-results { min-height: 260px; margin-top: 16px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; color: #718691; background: #f6f9fa; border: 1px dashed #b9cbd2; text-align: center; }.empty-results strong { color: #24495a; }.empty-results span { max-width: 500px; font-size: .7rem; }
.detail-panel { margin-top: 18px; padding: 22px; }.detail-grid { margin-top: 17px; display: grid; grid-template-columns: 1.4fr .6fr; border: 1px solid #cedde2; }.detail-grid > div { padding: 16px; background: #f7fafb; border-right: 1px solid #cedde2; }.detail-grid > div:last-child { border: 0; }.detail-label { display: block; color: #198b83; font-size: .59rem; font-weight: 900; }.detail-grid strong { display: block; margin-top: 7px; color: #17384a; font-size: .85rem; }.detail-grid p { margin: 5px 0 0; color: #627a85; font-size: .69rem; }.term-table { margin-top: 14px; border: 1px solid #d3dfe4; }.table-head,.table-row { display: grid; grid-template-columns: 130px 1fr 1fr; }.table-head { color: #fff; background: #164359; font-size: .6rem; font-weight: 900; }.table-head span,.table-row span { min-width: 0; padding: 9px 11px; border-right: 1px solid #d5e1e5; }.table-head span:last-child,.table-row span:last-child { border: 0; }.table-row { color: #456272; border-top: 1px solid #dde6e9; font-size: .66rem; }.table-row:nth-child(odd) { background: #f7fafb; }.coding-details { margin-top: 14px; padding: 12px 14px; color: #526d79; background: #fff9e8; border-left: 3px solid #d4af37; font-size: .68rem; }.coding-details p { margin: 5px 0; }
.source-panel { margin-top: 18px; padding: 24px; display: grid; grid-template-columns: .7fr 1.3fr; gap: 30px; color: #fff; background: #133a4e; border-color: #1d5268; }.source-panel > div > span { display: block; margin-top: 10px; color: #bfd0d9; font-size: .7rem; line-height: 1.6; }.source-links { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }.source-links a { min-height: 70px; padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #fff; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.18); border-radius: 4px; }.source-links a:hover { border-color: #57dcd5; background: rgba(87,220,213,.1); }.source-links span { display: flex; flex-direction: column; }.source-links strong { color: #62ddd7; font-size: .65rem; }.source-links small { margin-top: 4px; color: #d5e1e6; font-size: .67rem; }
@media (max-width: 1100px) { .icdo-hero { grid-template-columns: 1fr; }.hero-stats { max-width: 660px; }.lookup-grid { grid-template-columns: 1fr; }.topography-panel { position: static; }.selection-grid { grid-template-columns: 1fr 1fr; }.combined-cell { grid-column: 1 / -1; min-height: 98px; }.selection-cell:nth-child(2) { border-right: 0; }.source-panel { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .icdo-hero { min-height: 0; padding: 36px 18px; gap: 26px; }.hero-copy h1 { font-size: 2.5rem; }.hero-stats { grid-template-columns: 1fr; }.hero-stats div { min-height: 78px; border-right: 0; border-bottom: 1px solid rgba(255,255,255,.16); }.icdo-workspace { width: calc(100% - 24px); padding-top: 12px; }.coding-strip,.morphology-panel,.topography-panel,.detail-panel { padding: 14px; }.selection-grid,.search-row,.morphology-list,.detail-grid,.source-links { grid-template-columns: 1fr; }.selection-cell { border-right: 0; border-bottom: 1px solid #cadbe1; }.selection-cell:nth-child(2) { border-bottom: 1px solid #cadbe1; }.strip-heading,.panel-heading,.detail-title { align-items: flex-start; }.panel-heading > span { display: none; }.table-head,.table-row { grid-template-columns: 88px 1fr; }.table-head span:last-child,.table-row span:last-child { grid-column: 1 / -1; border-top: 1px solid #d5e1e5; }.source-panel { padding: 18px; } }
</style>
