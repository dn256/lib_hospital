<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { libraryModule, type LibraryModuleId } from '~/utils/libraryModules'
import { normalizePathologySearch, pathologySearchScore } from '~/utils/pathologySearch'
import { translateIcdoTerm } from '~/utils/icdoVietnamese'

definePageMeta({ layout: 'library', middleware: 'auth' })

type Source = Exclude<LibraryModuleId, 'images'>
type Result = { id: string; title: string; subtitle?: string; to: RouteLocationRaw }
type Candidate = Result & { fields: unknown; exactCode?: string }
type Group = { status: 'loading' | 'ready' | 'error'; results: Result[] }
type CodeEntry = { code: string; preferred: string; legacyCode?: string; terms: { term: string }[] }
type CodeCatalog = { morphology: CodeEntry[]; topography: CodeEntry[]; optionalTopography: CodeEntry[] }

const sources: Source[] = ['library', 'atlas', 'hmmd', 'who', 'icdo']
const term = ref('')
const submitted = ref(false)
const groups = ref<Partial<Record<Source, Group>>>({})
const { search } = useCases()
const { diagnoses, loadAll } = useCatalogs()
const atlasData = useIntegratedAtlasData()
const { english, label } = useLibraryLanguage()
let requestId = 0
let codeCatalog: Promise<CodeCatalog> | undefined

const rank = (items: Candidate[], query: string): Result[] => {
  const code = query.toUpperCase().replace(/\s+/g, '')
  return items
    .map(item => ({ item, score: item.exactCode === code ? 1000 : pathologySearchScore(item.fields, query) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }) => item)
}

const caseResults = async (query: string): Promise<Result[]> => {
  const rows = await search({ keyword: query, status: ['published'], limit: 6 })
  if (!rows?.length) return []
  if (rows.some((row: any) => !row.diagnosis_name && !row.diagnosis?.name && !row.diagnoses?.name) && !diagnoses.value.length) {
    await loadAll().catch(() => undefined)
  }
  return rows.filter((row: any) => row.version_id).map((row: any) => ({
    id: row.version_id,
    title: row.diagnosis_name || row.diagnosis?.name || row.diagnoses?.name
      || diagnoses.value.find(diagnosis => diagnosis.id === row.diagnosis_id)?.name
      || label('Ca bệnh đã công bố', 'Published case'),
    to: { path: `/cases/${encodeURIComponent(row.version_id)}` },
  }))
}

const atlasResults = async (query: string) => {
  await atlasData.load()
  return rank((atlasData.atlas.value?.cases || []).map((item: any) => ({
    id: item.id,
    title: english.value ? item.english || item.diagnosis : item.diagnosis,
    subtitle: english.value ? item.diagnosis : item.english,
    fields: [item.diagnosis, item.english, item.markers, item.icdo?.code],
    to: { path: '/atlas', query: { entry: item.id } },
  })), query)
}

const whoResults = async (query: string) => {
  await atlasData.load()
  const translate = (value: string) => atlasData.medicalVi.value?.translateDetailed?.(value)?.text || value
  const volumes = new Map<string, { nameVi: string; nameEn: string; revision?: string }>(
    (atlasData.whoCatalog.value?.volumes || []).map((volume: any) => [volume.id, volume]),
  )
  return rank((atlasData.whoCatalog.value?.entries || []).filter((item: any) => item.entryType === 'diagnosis').map((item: any) => {
    const vi = translate(item.nameEn)
    const volume = volumes.get(item.volumeId)
    const volumeLabel = english.value ? volume?.nameEn : volume?.nameVi
    return {
      id: `${item.bookId}-${item.chapterId}`,
      title: item.nameEn,
      subtitle: [
        !english.value && vi !== item.nameEn ? vi : '',
        volumeLabel,
        volume?.revision === 'Beta' ? label('Chỉ mục bản beta', 'Beta index') : '',
      ].filter(Boolean).join(' · '),
      fields: [item.nameEn, vi],
      to: { path: '/atlas', query: { view: 'who', q: item.nameEn, volume: item.volumeId } },
    }
  }), query)
}

const markerResults = async (query: string) => {
  const [{ IHC_MARKER_CATALOG }, { IHC_MARKER_VI }] = await Promise.all([
    import('~/utils/ihcMarkerCatalog'),
    import('~/utils/ihcMarkerTranslations'),
  ])
  return rank(IHC_MARKER_CATALOG.map(item => ({
    id: item.id,
    title: item.name,
    subtitle: item.fullNameEn,
    fields: [item.name, item.fullNameEn, IHC_MARKER_VI[item.name]],
    to: { path: '/hmmd', query: { marker: item.id } },
  })), query)
}

const codeResults = async (query: string) => {
  codeCatalog ??= $fetch<CodeCatalog>('/icdo-data/icdo4-catalog.json').catch(error => {
    codeCatalog = undefined
    throw error
  })
  const catalog = await codeCatalog
  const codeItems = (entries: CodeEntry[], kind: 'morphology' | 'topography' | 'optional') => entries.map(item => {
    const translated = translateIcdoTerm(item.preferred).text
    return {
      id: `${kind}-${item.code}`,
      title: `${item.code} · ${english.value ? item.preferred : translated}`,
      subtitle: translated !== item.preferred ? (english.value ? translated : item.preferred) : undefined,
      fields: [item.code, item.legacyCode, item.preferred, translated, item.terms.map(term => term.term)],
      exactCode: item.code,
      to: { path: '/icdo', query: { code: item.code, kind } },
    }
  })
  return rank([
    ...codeItems(catalog.morphology, 'morphology'),
    ...codeItems(catalog.topography, 'topography'),
    ...codeItems(catalog.optionalTopography, 'optional'),
  ], query)
}

const find: Record<Source, (query: string) => Promise<Result[]>> = {
  library: caseResults,
  atlas: atlasResults,
  who: whoResults,
  hmmd: markerResults,
  icdo: codeResults,
}

const validTerm = computed(() => normalizePathologySearch(term.value).length >= 2)
const runSearch = async () => {
  if (!validTerm.value) return
  const id = ++requestId
  const query = term.value.trim()
  submitted.value = true
  groups.value = {}
  await Promise.all(sources.map(async source => {
    groups.value[source] = { status: 'loading', results: [] }
    try {
      const results = await find[source](query)
      if (id === requestId) groups.value[source] = { status: 'ready', results }
    } catch {
      if (id === requestId) groups.value[source] = { status: 'error', results: [] }
    }
  }))
}
</script>

<template>
  <div class="search-page">
    <header>
      <h1>{{ label('Tra cứu liên thông', 'Search across libraries') }}</h1>
      <p>{{ label('Tìm bằng tên bệnh, dấu ấn hoặc mã ICD-O-4.', 'Search by diagnosis, marker or ICD-O-4 code.') }}</p>
    </header>
    <form class="search-form" @submit.prevent="runSearch">
      <v-text-field
        v-model="term"
        :label="label('Từ khóa tra cứu', 'Search term')"
        placeholder="VD / e.g. GIST, PAX8, C50.9"
        prepend-inner-icon="mdi-magnify"
        maxlength="160"
        hide-details
        variant="outlined"
      />
      <v-btn type="submit" color="primary" size="large" :disabled="!validTerm">{{ label('Tìm kiếm', 'Search') }}</v-btn>
    </form>
    <div v-if="submitted" class="results-grid" aria-live="polite">
      <section v-for="source in sources" :key="source" class="result-group">
        <h2><v-icon size="20">{{ libraryModule(source).icon }}</v-icon> {{ label(libraryModule(source).vi, libraryModule(source).en) }}</h2>
        <p v-if="groups[source]?.status === 'loading'">{{ label('Đang tra cứu…', 'Searching…') }}</p>
        <p v-else-if="groups[source]?.status === 'error'" role="status">{{ label('Nguồn này chưa tải được. Hãy thử lại.', 'This source is unavailable. Try again.') }}</p>
        <ul v-else-if="groups[source]?.results.length">
          <li v-for="result in groups[source]?.results" :key="result.id">
            <NuxtLink :to="result.to">
              <strong>{{ result.title }}</strong>
              <span v-if="result.subtitle">{{ result.subtitle }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else>{{ label('Không tìm thấy kết quả.', 'No results found.') }}</p>
        <NuxtLink :to="libraryModule(source).path" class="module-link">{{ label('Mở mô-đun', 'Open module') }} <v-icon size="16">mdi-arrow-right</v-icon></NuxtLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.search-page { min-height: calc(100dvh - 122px); background: #eef3f5; color: #15384b; padding: clamp(16px, 4vw, 48px); }
.search-page > * { width: min(100%, 1240px); margin-inline: auto; }
.search-page h1 { margin: 0; font-size: clamp(1.9rem, 4vw, 3rem); line-height: 1.2; }
.search-page header p { color: #365467; margin: 8px 0 18px; }
.search-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; }
.search-form :deep(.v-field) { background: #fff; }
.results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr)); gap: 14px; margin-top: 24px; }
.result-group { min-width: 0; border: 1px solid #d1dfe5; border-radius: 8px; background: #fff; padding: 16px; }
.result-group h2 { font-size: 1.35rem; }
.result-group p { margin: 10px 0; color: #365467; }
.result-group ul { list-style: none; padding: 0; }
.result-group li a { display: block; padding: 9px 0; border-bottom: 1px solid #e4edf0; overflow-wrap: anywhere; }
.result-group li a:hover, .module-link:hover { color: #0b6357; text-decoration: underline; }
.result-group li span { display: block; color: #365467; font-size: .86rem; }
.module-link { display: inline-block; margin-top: 9px; font-size: .86rem; font-weight: 700; }
@media (max-width: 410px) { .search-form { grid-template-columns: 1fr; } }
</style>
