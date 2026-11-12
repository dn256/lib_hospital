<script setup lang="ts">
import { libraryModules, type LibraryModuleId } from '~/utils/libraryModules'

definePageMeta({ layout: 'library', middleware: 'auth' })

const { label } = useLibraryLanguage()

const summaries: Record<LibraryModuleId, [string, string]> = {
  library: ['Tìm ca đã công bố, mô tả vi thể và nội dung báo cáo.', 'Find published cases, microscopic findings and report text.'],
  atlas: ['Đối chiếu hình thái vi thể theo cơ quan và mẫu tổn thương.', 'Compare microscopic features by organ and lesion pattern.'],
  hmmd: ['Tra cứu dấu ấn, kiểu bắt màu và panel hóa mô miễn dịch.', 'Look up markers, staining patterns and IHC panels.'],
  icdo: ['Đối chiếu mã vị trí, hình thái và hành vi từ bảng IARC.', 'Look up topography, morphology and behaviour codes from IARC.'],
  who: ['Tra mục lục phân loại u và mở chương gốc của WHO.', 'Browse tumour classification and open original WHO chapters.'],
  images: ['Tìm ảnh theo cơ quan và mở bộ ảnh tại nguồn.', 'Find images by organ and open the original collections.'],
}
</script>

<template>
  <div class="hub-page">
    <div class="hub-content">
      <section class="hub-intro">
        <div>
          <h1>{{ label('Thư viện giải phẫu bệnh', 'Pathology Library') }}</h1>
          <p>{{ label('Tra cứu ca bệnh, đối chiếu hình thái và mở tài liệu gốc trong PathologyLib.', 'Find cases, compare morphology and consult original references in PathologyLib.') }}</p>
        </div>
        <div class="hub-actions">
          <v-btn to="/search" color="accent" variant="flat" prepend-icon="mdi-magnify">{{ label('Tra cứu liên thông', 'Search across libraries') }}</v-btn>
          <v-btn to="/workspace" color="white" variant="outlined" prepend-icon="mdi-view-split-vertical">{{ label('Bàn làm việc đôi', 'Dual workspace') }}</v-btn>
        </div>
      </section>

      <section class="module-section" aria-labelledby="module-heading">
        <h2 id="module-heading">{{ label('Thư viện và công cụ', 'Libraries and tools') }}</h2>
        <div class="module-grid">
          <NuxtLink v-for="module in libraryModules" :key="module.id" :to="module.path" class="module-card">
            <span class="module-icon"><v-icon size="25">{{ module.icon }}</v-icon></span>
            <span class="module-copy">
              <strong>{{ label(module.vi, module.en) }}</strong>
              <span>{{ label(...summaries[module.id]) }}</span>
            </span>
            <v-icon size="18" class="module-arrow">mdi-arrow-right</v-icon>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hub-page { min-height: calc(100dvh - 122px); color: #fff; }
.hub-content { width: min(1280px, calc(100% - 48px)); margin-inline: auto; padding: clamp(28px, 5vw, 62px) 0; }
.hub-intro { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.hub-intro h1 { margin: 0; font: 700 clamp(2rem, 4vw, 3rem)/1.12 var(--font-heading); }
.hub-intro p { margin: 12px 0 0; color: #d5e2e9; }
.hub-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.hub-actions :deep(.v-btn) { text-transform: none; letter-spacing: 0; font-weight: 700; }
.module-section { margin-top: 35px; }
.module-section h2 { margin: 0 0 12px; font-size: 1.55rem; }
.module-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 335px), 1fr)); gap: 12px; }
.module-card { min-width: 0; min-height: 112px; padding: 16px; display: grid; grid-template-columns: 44px minmax(0, 1fr) 18px; align-items: center; gap: 12px; color: #fff; background: #14384d; border: 1px solid #39596b; border-radius: 8px; }
.module-card:hover, .module-card:focus-visible { color: #fff; background: #1a485b; border-color: #78c2ba; }
.module-icon { width: 44px; height: 44px; display: grid; place-items: center; color: #123349; background: #d6b74e; border-radius: 7px; }
.module-copy { display: grid; gap: 4px; }
.module-copy strong { font: 700 1.2rem var(--font-heading); }
.module-copy > span { color: #d5e2e9; font-size: .84rem; line-height: 1.45; }
.module-arrow { color: #b4ced8; }
@media (max-width: 640px) { .hub-content { width: calc(100% - 28px); } }
</style>
