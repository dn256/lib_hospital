<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({ layout: 'library', middleware: 'auth' })

const { dataset, loading, error, load } = useHmmdData()
const query = ref('')
const organ = ref('all')
const positiveMarkers = ref<string[]>([])
const negativeMarkers = ref<string[]>([])
const limit = ref(36)
const selectedCase = ref<any | null>(null)
const dialogOpen = ref(false)

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

const markerKey = (value: unknown) => normalize(value).replace(/[^a-z0-9]/g, '')
const cases = computed<any[]>(() => dataset.value?.cases || [])
const meta = computed(() => dataset.value?.meta || {})

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
  const variants = new Map<string, { title: string, count: number }>()
  for (const item of cases.value) {
    for (const marker of [...(item.positive || []), ...(item.negative || [])]) {
      const key = markerKey(marker)
      if (!key) continue
      const current = variants.get(key)
      variants.set(key, { title: current?.title || marker, count: (current?.count || 0) + 1 })
    }
  }
  return [...variants.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .map((item) => item.title)
})

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
  return selected.every((marker) => keys.has(markerKey(marker)))
}

const filteredCases = computed(() => {
  const tokens = normalize(query.value).split(/\s+/).filter(Boolean)
  return cases.value.filter((item) => {
    if (organ.value !== 'all' && item.organ !== organ.value) return false
    if (!hasMarkers(item.positive || [], positiveMarkers.value)) return false
    if (!hasMarkers(item.negative || [], negativeMarkers.value)) return false
    const searchText = searchTextFor(item)
    return tokens.every((token) => searchText.includes(token))
  })
})

const visibleCases = computed(() => filteredCases.value.slice(0, limit.value))
const firstLine = (value: unknown) => String(value || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || 'Chưa có kết luận HMMD'
const confidenceLabel = (value: string) => ({ high: 'Độ tin cậy cao', medium: 'Cần đối chiếu', low: 'Chưa phân nhóm chắc chắn' }[value] || 'Chưa đánh giá')

const openCase = (item: any) => {
  selectedCase.value = item
  dialogOpen.value = true
}

watch([query, organ, positiveMarkers, negativeMarkers], () => { limit.value = 36 })

onMounted(() => load().catch(() => undefined))
</script>

<template>
  <div class="hmmd-page">
    <section class="hmmd-hero">
      <div>
        <p class="eyebrow">KHO TRA CỨU NỘI BỘ · CÓ XÁC THỰC</p>
        <h1>Tra cứu Hóa mô miễn dịch</h1>
        <p>Tìm theo cơ quan, chẩn đoán, kết luận hoặc tổ hợp dấu ấn dương tính/âm tính trong cùng tài khoản PathologyLib.</p>
      </div>
      <div class="hero-stats" aria-label="Thống kê HMMD">
        <span><strong>{{ Number(meta.caseCount || cases.length).toLocaleString('vi-VN') }}</strong> ca</span>
        <span><strong>{{ meta.markerCount || markerItems.length }}</strong> dấu ấn</span>
        <span><strong>{{ meta.organCount || 0 }}</strong> nhóm cơ quan</span>
      </div>
    </section>

    <v-alert type="warning" variant="tonal" density="compact" class="data-notice">
      Dữ liệu ca thực hành hỗ trợ tra cứu, không phải quy tắc chẩn đoán. Luôn diễn giải HMMD cùng hình thái, chứng nội và bối cảnh lâm sàng.
    </v-alert>

    <section class="search-panel">
      <div class="search-grid">
        <v-text-field v-model="query" label="Tên bệnh, mô tả, vị trí hoặc ICD" placeholder="VD: small cell, ung thư vú, dạ dày, C16.9…" prepend-inner-icon="mdi-magnify" clearable hide-details />
        <v-select v-model="organ" :items="organItems" label="Cơ quan" hide-details />
        <v-autocomplete v-model="positiveMarkers" :items="markerItems" label="Dấu ấn dương tính" placeholder="VD: TTF1, Napsin A" multiple chips closable-chips clearable hide-details />
        <v-autocomplete v-model="negativeMarkers" :items="markerItems" label="Dấu ấn âm tính" placeholder="VD: p40, CK5/6" multiple chips closable-chips clearable hide-details />
      </div>
      <div class="result-line"><strong>{{ filteredCases.length.toLocaleString('vi-VN') }}</strong> ca phù hợp</div>
    </section>

    <div v-if="loading" class="state-box"><v-progress-circular indeterminate color="primary" /><span>Đang tải kho HMMD đã bảo vệ…</span></div>
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

    <v-dialog v-model="dialogOpen" max-width="980" scrollable>
      <v-card v-if="selectedCase" class="detail-card">
        <v-card-title class="detail-title">
          <div><small>{{ selectedCase.caseCode }} · {{ organLabels[selectedCase.organ] || selectedCase.organ }}</small><h2>{{ firstLine(selectedCase.conclusionText || selectedCase.nameVi) }}</h2></div>
          <v-btn icon="mdi-close" variant="text" aria-label="Đóng chi tiết HMMD" @click="dialogOpen = false" />
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
.hmmd-page { min-height: 100vh; padding: 28px clamp(14px, 3vw, 42px) 56px; color: #102d3c; background: #eef4f5; }
.hmmd-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: clamp(24px, 4vw, 48px); color: white; background: #173b4e; border-bottom: 4px solid #e0b62f; }
.eyebrow { margin: 0 0 8px; color: #63d9d0; font: 700 .76rem var(--font-body); letter-spacing: .08em; }.hmmd-hero h1 { margin: 0; font: 700 clamp(2rem, 4vw, 3.4rem)/1.05 var(--font-heading); letter-spacing: 0; }.hmmd-hero p:last-child { max-width: 780px; margin: 14px 0 0; color: #d7e6eb; }
.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(90px, 1fr)); border: 1px solid rgba(255,255,255,.2); }.hero-stats span { padding: 14px 18px; border-right: 1px solid rgba(255,255,255,.2); font-size: .76rem; }.hero-stats span:last-child { border-right: 0; }.hero-stats strong { display: block; color: #f2cf55; font-size: 1.5rem; }
.data-notice { margin: 16px 0; }.search-panel { padding: 20px; background: white; border: 1px solid #cbd9de; }.search-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 12px; }.result-line { margin-top: 16px; color: #5b717c; }.result-line strong { color: #0e7180; }
.state-box { min-height: 320px; display: grid; place-content: center; justify-items: center; gap: 14px; }.case-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }.hmmd-card { min-width: 0; display: flex; flex-direction: column; padding: 18px; background: white; border: 1px solid #c9d7dc; cursor: pointer; transition: border-color .18s, transform .18s; }.hmmd-card:hover { border-color: #168b91; transform: translateY(-2px); }.hmmd-card header,.hmmd-card footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.hmmd-card header span { color: #087a82; font-weight: 700; }.hmmd-card header small { color: #72858e; }.hmmd-card h2 { margin: 12px 0 8px; font: 700 1.08rem/1.38 var(--font-body); letter-spacing: 0; }.clinical { min-height: 48px; margin: 0 0 12px; color: #5c717c; font-size: .86rem; }.marker-groups { display: grid; gap: 8px; margin-top: auto; }.marker-groups>div { display: flex; flex-wrap: wrap; gap: 5px; }.marker-groups b { width: 52px; font-size: .74rem; }.marker-groups>div:first-child b { color: #087a60; }.marker-groups>div:nth-child(2) b { color: #b3424b; }.marker-groups span,.marker-groups em,.detail-markers span { padding: 3px 7px; color: #395663; background: #edf4f5; border: 1px solid #d4e2e5; font: 600 .7rem var(--font-body); font-style: normal; }.hmmd-card footer { margin-top: 16px; padding-top: 12px; color: #0d6874; border-top: 1px solid #e2eaed; font-size: .8rem; }
.load-more { padding: 24px; text-align: center; }.detail-card { border-top: 4px solid #e0b62f; }.detail-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; white-space: normal; }.detail-title small { color: #087a82; }.detail-title h2 { margin-top: 6px; font: 700 1.35rem/1.35 var(--font-body); letter-spacing: 0; }.detail-card section { margin-bottom: 18px; }.detail-card h3 { margin-bottom: 8px; color: #173b4e; font: 700 .84rem var(--font-body); text-transform: uppercase; }.preserve-lines { white-space: pre-line; }.detail-markers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }.detail-markers section { padding: 14px; background: #f4f8f9; border-left: 3px solid #168b91; }.detail-markers section:nth-child(2) { border-left-color: #c74a58; }.detail-markers section div { display: flex; flex-wrap: wrap; gap: 6px; }.detail-meta { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid #d7e2e5; }.detail-meta span { padding: 12px; border-right: 1px solid #d7e2e5; }.detail-meta span:last-child { border-right: 0; }.detail-meta b { display: block; margin-bottom: 4px; color: #72858e; font-size: .72rem; text-transform: uppercase; }
@media (max-width: 1100px) { .search-grid { grid-template-columns: 1fr 1fr; }.case-grid { grid-template-columns: 1fr 1fr; }.hmmd-hero { align-items: flex-start; flex-direction: column; } }
@media (max-width: 680px) { .hmmd-page { padding: 12px 10px 36px; }.hmmd-hero { padding: 24px 18px; }.hero-stats { width: 100%; }.hero-stats span { padding: 10px; }.search-grid,.case-grid,.detail-markers,.detail-meta { grid-template-columns: 1fr; }.detail-meta span { border-right: 0; border-bottom: 1px solid #d7e2e5; }.detail-meta span:last-child { border-bottom: 0; } }
</style>
