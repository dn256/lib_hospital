<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'library', middleware: 'auth' })

const moduleOptions = [
  { value: 'library', title: 'Thư viện mô bệnh học', icon: 'mdi-bookshelf', path: '/library' },
  { value: 'atlas', title: 'Atlas GPB', icon: 'mdi-microscope', path: '/atlas' },
  { value: 'hmmd', title: 'Thư viện HMMD', icon: 'mdi-test-tube', path: '/hmmd' },
  { value: 'icdo', title: 'Tra cứu ICD-O', icon: 'mdi-code-tags', path: '/icdo' },
  { value: 'who', title: 'Danh mục WHO', icon: 'mdi-book-open-page-variant', path: '/atlas?view=who' },
  { value: 'images', title: 'Kho ảnh', icon: 'mdi-image-multiple-outline', path: '/atlas?view=images' },
]

const leftModule = ref('library')
const rightModule = ref('atlas')
const focusMode = ref<'both' | 'left' | 'right'>('both')
const leftVersion = ref(0)
const rightVersion = ref(0)

const moduleFor = (value: string) => moduleOptions.find((item) => item.value === value) || moduleOptions[0]
const embeddedUrl = (value: string, version: number) => {
  const item = moduleFor(value)
  const separator = item.path.includes('?') ? '&' : '?'
  return `${item.path}${separator}embed=1&pane=${version}`
}
const leftUrl = computed(() => embeddedUrl(leftModule.value, leftVersion.value))
const rightUrl = computed(() => embeddedUrl(rightModule.value, rightVersion.value))
const fullUrl = (value: string) => moduleFor(value).path

const swapPanes = () => {
  const current = leftModule.value
  leftModule.value = rightModule.value
  rightModule.value = current
  focusMode.value = 'both'
}
</script>

<template>
  <div class="workspace-page">
    <header class="workspace-toolbar">
      <div class="workspace-title">
        <p>CHẾ ĐỘ ĐA NHIỆM</p>
        <h1>Bàn làm việc đôi</h1>
        <span>Mở hai công cụ và đối chiếu trên cùng một màn hình.</span>
      </div>
      <div class="view-actions">
        <v-btn-toggle v-model="focusMode" mandatory density="compact" color="primary" variant="outlined">
          <v-btn value="left" icon="mdi-dock-left" title="Chỉ hiện vùng trái" />
          <v-btn value="both" icon="mdi-view-split-vertical" title="Hiện hai vùng" />
          <v-btn value="right" icon="mdi-dock-right" title="Chỉ hiện vùng phải" />
        </v-btn-toggle>
        <v-btn icon="mdi-swap-horizontal" variant="outlined" size="small" title="Đổi vị trí hai vùng" @click="swapPanes" />
      </div>
    </header>

    <main class="pane-grid" :class="`focus-${focusMode}`">
      <section v-show="focusMode !== 'right'" class="workspace-pane left-pane">
        <div class="pane-toolbar">
          <v-select v-model="leftModule" :items="moduleOptions" item-title="title" item-value="value" density="compact" hide-details variant="outlined">
            <template #prepend-inner><v-icon size="18">{{ moduleFor(leftModule).icon }}</v-icon></template>
          </v-select>
          <v-btn :to="fullUrl(leftModule)" icon="mdi-open-in-new" variant="text" size="small" title="Mở toàn màn hình" />
          <v-btn icon="mdi-refresh" variant="text" size="small" title="Tải lại vùng trái" @click="leftVersion++" />
        </div>
        <iframe :key="leftUrl" :src="leftUrl" :title="moduleFor(leftModule).title" />
      </section>

      <section v-show="focusMode !== 'left'" class="workspace-pane right-pane">
        <div class="pane-toolbar">
          <v-select v-model="rightModule" :items="moduleOptions" item-title="title" item-value="value" density="compact" hide-details variant="outlined">
            <template #prepend-inner><v-icon size="18">{{ moduleFor(rightModule).icon }}</v-icon></template>
          </v-select>
          <v-btn :to="fullUrl(rightModule)" icon="mdi-open-in-new" variant="text" size="small" title="Mở toàn màn hình" />
          <v-btn icon="mdi-refresh" variant="text" size="small" title="Tải lại vùng phải" @click="rightVersion++" />
        </div>
        <iframe :key="rightUrl" :src="rightUrl" :title="moduleFor(rightModule).title" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.workspace-page { min-height: calc(100vh - 68px); display: flex; flex-direction: column; background: #e9eff2; }
.workspace-toolbar { min-height: 88px; padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; gap: 24px; background: #fff; border-bottom: 1px solid #d2dde2; }.workspace-title p { margin: 0; color: #16877e; font-size: .64rem; font-weight: 900; }.workspace-title h1 { margin: 2px 0 0; color: #15384b; font: 700 1.45rem var(--font-heading); }.workspace-title span { color: #718691; font-size: .7rem; }.view-actions { display: flex; align-items: center; gap: 8px; }
.pane-grid { flex: 1; min-height: 0; padding: 10px; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }.pane-grid.focus-left, .pane-grid.focus-right { grid-template-columns: minmax(0,1fr); }
.workspace-page,
.pane-grid,
.workspace-pane { min-width: 0; }
.workspace-pane { min-height: 650px; overflow: hidden; background: #fff; border: 1px solid #cbd8de; border-radius: 8px; box-shadow: 0 10px 24px rgba(18,50,67,.09); }.pane-toolbar { min-height: 51px; padding: 6px 8px 6px 12px; display: grid; grid-template-columns: minmax(180px,280px) 36px 36px; align-items: center; gap: 4px; background: #f8fafb; border-bottom: 1px solid #d8e2e6; }.pane-toolbar :deep(.v-field) { background: #fff; }.workspace-pane iframe { width: 100%; height: calc(100vh - 218px); min-height: 590px; display: block; border: 0; background: #fff; }
@media (max-width: 900px) { .pane-grid { grid-template-columns: 1fr; }.workspace-pane iframe { height: 720px; }.workspace-toolbar { align-items: flex-start; flex-direction: column; }.view-actions { width: 100%; justify-content: space-between; } }
@media (max-width: 640px) { .workspace-page { min-height: calc(100vh - 62px); }.workspace-toolbar { padding: 12px 14px; }.workspace-title span { display: none; }.pane-grid { padding: 7px; gap: 7px; }.workspace-pane { min-height: 570px; }.workspace-pane iframe { height: 620px; min-height: 540px; }.pane-toolbar { grid-template-columns: minmax(150px,1fr) 34px 34px; } }
</style>
