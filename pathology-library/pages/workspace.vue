<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { libraryModule, libraryModules, type LibraryModuleId } from '~/utils/libraryModules'

definePageMeta({ layout: 'library', middleware: 'auth' })

type PaneId = 'a' | 'b'
type Focus = 'both' | 'left' | 'right'
const paneIds = ['a', 'b'] as const
const moduleIds = new Set<string>(libraryModules.map(item => item.id))
const prefsKey = 'pathologylib-workspace-layout'
const selected = ref<Record<PaneId, LibraryModuleId>>({ a: 'library', b: 'atlas' })
const mountedModules = ref<Record<PaneId, LibraryModuleId[]>>({ a: ['library'], b: ['atlas'] })
const frameVersions = ref<Record<PaneId, Partial<Record<LibraryModuleId, number>>>>({ a: {}, b: {} })
const swapped = ref(false)
const focus = ref<Focus>('both')
const ratio = ref(50)
const panes = ref<HTMLElement | null>(null)
const dragging = ref(false)

const { label } = useLibraryLanguage()
const moduleOptions = computed(() => libraryModules.map(item => ({ value: item.id, title: label(item.vi, item.en) })))
const frameTitle = (id: LibraryModuleId) => {
  const item = libraryModule(id)
  return label(item.vi, item.en)
}
const sideFor = (pane: PaneId) => (pane === 'a') !== swapped.value ? 'left' : 'right'
const sideLabel = (pane: PaneId, vi: string, en: string) => sideFor(pane) === 'left'
  ? label(`${vi} trái`, `Left ${en}`)
  : label(`${vi} phải`, `Right ${en}`)
const frameUrl = (id: LibraryModuleId) => {
  const { path } = libraryModule(id)
  return `${path}${path.includes('?') ? '&' : '?'}embed=1`
}
const setModule = (pane: PaneId, value: LibraryModuleId) => {
  if (!moduleIds.has(value)) return
  selected.value[pane] = value
  if (!mountedModules.value[pane].includes(value)) mountedModules.value[pane].push(value)
}

onMounted(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(prefsKey) || 'null')
    if (!saved) return
    for (const pane of paneIds) {
      if (moduleIds.has(saved.selected?.[pane])) selected.value[pane] = saved.selected[pane]
      mountedModules.value[pane] = [selected.value[pane]]
    }
    if (typeof saved.swapped === 'boolean') swapped.value = saved.swapped
    if (['both', 'left', 'right'].includes(saved.focus)) focus.value = saved.focus
    if (typeof saved.ratio === 'number' && saved.ratio >= 30 && saved.ratio <= 70) ratio.value = saved.ratio
  } catch {
    // The workspace also works when browser storage is unavailable.
  }
})

watch(() => [selected.value.a, selected.value.b, swapped.value, focus.value, ratio.value], () => {
  try {
    sessionStorage.setItem(prefsKey, JSON.stringify({ selected: selected.value, swapped: swapped.value, focus: focus.value, ratio: ratio.value }))
  } catch {
    // Only display preferences are stored.
  }
})

const reloadPane = (pane: PaneId) => {
  const id = selected.value[pane]
  frameVersions.value[pane][id] = (frameVersions.value[pane][id] || 0) + 1
}

const gridStyle = computed(() => ({
  '--left-size': `minmax(0, ${ratio.value}fr)`,
  '--right-size': `minmax(0, ${100 - ratio.value}fr)`,
}))
const setRatio = (value: number) => { ratio.value = Math.max(30, Math.min(70, Math.round(value))) }
const moveDivider = (event: PointerEvent) => {
  if (!dragging.value || !panes.value) return
  const bounds = panes.value.getBoundingClientRect()
  if (bounds.width > 0) setRatio(100 * (event.clientX - bounds.left) / bounds.width)
}
const startResize = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  const handle = event.currentTarget as HTMLElement
  handle.focus()
  handle.setPointerCapture(event.pointerId)
  dragging.value = true
}
const resizeWithKeys = (event: KeyboardEvent) => {
  const next = { ArrowLeft: ratio.value - 5, ArrowRight: ratio.value + 5, Home: 30, End: 70 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  setRatio(next)
}
</script>

<template>
  <div class="workspace-page">
    <header class="workspace-toolbar">
      <div class="workspace-title">
        <p>{{ label('CHẾ ĐỘ ĐA NHIỆM', 'MULTITASKING') }}</p>
        <h1>{{ label('Bàn làm việc đôi', 'Dual workspace') }}</h1>
        <span>{{ label('Mở hai công cụ và đối chiếu trên cùng một màn hình.', 'Compare two tools side by side.') }}</span>
      </div>
      <div class="view-actions">
        <v-btn-toggle v-model="focus" mandatory density="compact" color="primary" variant="outlined" :aria-label="label('Vùng làm việc đang hiển thị', 'Visible workspace panes')">
          <v-btn value="left" icon="mdi-dock-left" :title="label('Chỉ hiện vùng trái', 'Show left pane only')" :aria-label="label('Chỉ hiện vùng trái', 'Show left pane only')" />
          <v-btn value="both" icon="mdi-view-split-vertical" :title="label('Hiện hai vùng', 'Show both panes')" :aria-label="label('Hiện hai vùng', 'Show both panes')" />
          <v-btn value="right" icon="mdi-dock-right" :title="label('Chỉ hiện vùng phải', 'Show right pane only')" :aria-label="label('Chỉ hiện vùng phải', 'Show right pane only')" />
        </v-btn-toggle>
        <v-btn icon="mdi-swap-horizontal" variant="outlined" size="small" :title="label('Đổi vị trí hai vùng', 'Swap panes')" :aria-label="label('Đổi vị trí hai vùng', 'Swap panes')" @click="swapped = !swapped; focus = 'both'" />
      </div>
    </header>

    <div ref="panes" class="pane-grid" :class="[`focus-${focus}`, { dragging }]" :style="gridStyle">
      <section
        v-for="pane in paneIds"
        v-show="focus === 'both' || focus === sideFor(pane)"
        :key="pane"
        class="workspace-pane"
        :class="`pane-${sideFor(pane)}`"
        :aria-label="sideLabel(pane, 'Vùng', 'pane')"
      >
        <div class="pane-toolbar">
          <v-select
            :model-value="selected[pane]"
            :items="moduleOptions"
            :aria-label="sideLabel(pane, 'Mô-đun vùng', 'pane module')"
            density="compact"
            hide-details
            variant="outlined"
            @update:model-value="setModule(pane, $event)"
          >
            <template #prepend-inner><v-icon size="18">{{ libraryModule(selected[pane]).icon }}</v-icon></template>
          </v-select>
          <v-btn :href="libraryModule(selected[pane]).path" target="_blank" rel="noopener" icon="mdi-open-in-new" variant="text" size="small" :title="label('Mở trong tab mới', 'Open in new tab')" :aria-label="label('Mở trong tab mới', 'Open in new tab')" />
          <v-btn icon="mdi-refresh" variant="text" size="small" :title="sideLabel(pane, 'Tải lại vùng', 'pane refresh')" :aria-label="sideLabel(pane, 'Tải lại vùng', 'pane refresh')" @click="reloadPane(pane)" />
        </div>
        <iframe
          v-for="id in mountedModules[pane]"
          v-show="id === selected[pane]"
          :key="`${id}-${frameVersions[pane][id] || 0}`"
          :src="frameUrl(id)"
          :title="frameTitle(id)"
          loading="lazy"
        />
      </section>
      <div
        v-if="focus === 'both'"
        class="pane-divider"
        role="separator"
        tabindex="0"
        :aria-label="label('Thay đổi chiều rộng hai vùng', 'Resize panes')"
        aria-orientation="vertical"
        aria-valuemin="30"
        aria-valuemax="70"
        :aria-valuenow="ratio"
        @pointerdown="startResize"
        @pointermove="moveDivider"
        @lostpointercapture="dragging = false"
        @keydown="resizeWithKeys"
      />
    </div>
  </div>
</template>

<style scoped>
.workspace-page { min-height: calc(100dvh - 68px); display: flex; flex-direction: column; background: #e9eff2; }
.workspace-toolbar { min-height: 88px; padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; gap: 24px; background: #fff; border-bottom: 1px solid #d2dde2; }
.workspace-title p { margin: 0; color: #16877e; font-size: .64rem; font-weight: 900; }
.workspace-title h1 { margin: 2px 0 0; color: #15384b; font: 700 1.45rem var(--font-heading); }
.workspace-title span { color: #718691; font-size: .7rem; }
.view-actions { display: flex; align-items: center; gap: 8px; }
.pane-grid { flex: 1; padding: 10px; display: grid; grid-template-columns: var(--left-size) 14px var(--right-size); grid-template-areas: "left divider right"; }
.pane-grid.focus-left { grid-template-columns: minmax(0,1fr); grid-template-areas: "left"; }
.pane-grid.focus-right { grid-template-columns: minmax(0,1fr); grid-template-areas: "right"; }
.pane-left { grid-area: left; }
.pane-right { grid-area: right; }
.workspace-pane { min-width: 0; overflow: hidden; background: #fff; border: 1px solid #cbd8de; border-radius: 8px; box-shadow: 0 10px 24px rgba(18,50,67,.09); }
.pane-toolbar { min-height: 51px; padding: 6px 8px; display: grid; grid-template-columns: minmax(0,280px) 36px 36px; align-items: center; gap: 4px; background: #f8fafb; border-bottom: 1px solid #d8e2e6; }
.pane-toolbar :deep(.v-field) { background: #fff; }
.workspace-pane iframe { width: 100%; height: max(440px, calc(100dvh - 218px)); display: block; border: 0; background: #fff; }
.pane-divider { grid-area: divider; cursor: col-resize; display: grid; place-items: center; touch-action: none; }
.pane-divider::before { content: ''; width: 4px; height: 52px; border-radius: 4px; background: #7d9ca9; }
.pane-divider:hover::before, .pane-divider:focus-visible::before, .dragging .pane-divider::before { background: #136959; }
.dragging iframe { pointer-events: none; }
@media (max-width: 900px) {
  .pane-grid.focus-both { grid-template-columns: minmax(0,1fr); grid-template-areas: "left" "right"; gap: 8px; }
  .pane-divider { display: none; }
}
@media (max-width: 640px) {
  .workspace-page { min-height: calc(100dvh - 62px); }
  .workspace-toolbar { align-items: flex-start; flex-direction: column; gap: 12px; padding: 12px 14px; }
  .workspace-title span { display: none; }
  .pane-grid { padding: 7px; }
}
</style>
