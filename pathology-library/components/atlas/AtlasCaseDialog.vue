<script setup lang="ts">
defineProps<{
  modelValue: boolean
  item: any | null
  chapter: any | null
  imageUrl: string
  imageSourceUrl: string
  whoUrl: string
  pathologyOutlinesUrl: string
  canEdit: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  manageImage: [item: any]
  deleteCustom: [item: any]
  imageError: [id: string]
}>()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1440"
    :fullscreen="$vuetify.display.smAndDown"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="item" class="case-dialog">
      <button class="dialog-close" type="button" title="Đóng hồ sơ" @click="$emit('update:modelValue', false)">
        <v-icon>mdi-close</v-icon>
      </button>

      <section class="dialog-media">
        <v-img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="`${item.diagnosis} / ${item.english}`"
          contain
          height="100%"
          @error="$emit('imageError', item.id)"
        >
          <template #placeholder>
            <div class="media-loading"><v-progress-circular indeterminate color="accent" /></div>
          </template>
        </v-img>
        <div v-else class="media-placeholder">
          <v-icon size="52">mdi-image-off-outline</v-icon>
          <strong>Chưa có ảnh đã xác minh</strong>
          <span>Chỉ thêm ảnh khi có trang nguồn và chẩn đoán khớp chính xác.</span>
        </div>
        <div class="media-caption">
          <span>{{ item.imageKind || 'Hình ảnh giải phẫu bệnh' }}</span>
          <a v-if="imageSourceUrl" :href="imageSourceUrl" target="_blank" rel="noopener noreferrer">
            Nguồn ảnh <v-icon size="14">mdi-open-in-new</v-icon>
          </a>
        </div>
      </section>

      <section class="dialog-content">
        <div class="case-heading">
          <p>{{ chapter?.name }} · {{ item.classification?.label || 'Atlas giải phẫu bệnh' }}</p>
          <h1>{{ item.diagnosis }}</h1>
          <h2>{{ item.english }}</h2>
          <div class="heading-badges">
            <span v-if="item.icdo?.code">ICD-O {{ item.icdo.code }}</span>
            <span v-if="item.classification?.edition">{{ item.classification.edition }}</span>
            <span v-if="item.custom">Hồ sơ tự thêm</span>
          </div>
        </div>

        <div class="source-actions">
          <a v-if="whoUrl" :href="whoUrl" target="_blank" rel="noopener noreferrer">
            <v-icon size="17">mdi-book-open-page-variant</v-icon>
            WHO/IARC
          </a>
          <a v-if="pathologyOutlinesUrl" :href="pathologyOutlinesUrl" target="_blank" rel="noopener noreferrer">
            <v-icon size="17">mdi-microscope</v-icon>
            PathologyOutlines
          </a>
          <button v-if="canEdit" type="button" @click="$emit('manageImage', item)">
            <v-icon size="17">mdi-image-edit-outline</v-icon>
            Quản lý ảnh
          </button>
          <button v-if="item.custom" type="button" class="danger-action" @click="$emit('deleteCustom', item)">
            <v-icon size="17">mdi-delete-outline</v-icon>
            Xóa hồ sơ
          </button>
        </div>

        <article class="learning-section">
          <header>
            <span class="section-number">01</span>
            <div><h3>Đặc điểm vi thể</h3><p>Microscopic features</p></div>
          </header>
          <div class="bilingual-grid">
            <div><small>TIẾNG VIỆT</small><ul><li v-for="line in item.micro || []" :key="line">{{ line }}</li></ul></div>
            <div><small>ENGLISH</small><ul><li v-for="line in item.learningEn?.micro || []" :key="line">{{ line }}</li></ul></div>
          </div>
        </article>

        <article class="learning-section">
          <header>
            <span class="section-number">02</span>
            <div><h3>Gợi ý báo cáo</h3><p>Reporting checklist</p></div>
          </header>
          <div class="bilingual-grid">
            <div><small>TIẾNG VIỆT</small><ul><li v-for="line in item.report || []" :key="line">{{ line }}</li></ul></div>
            <div><small>ENGLISH</small><ul><li v-for="line in item.learningEn?.report || []" :key="line">{{ line }}</li></ul></div>
          </div>
        </article>

        <div class="memory-grid">
          <article class="memory-panel">
            <v-icon>mdi-lightbulb-on-outline</v-icon>
            <div><small>ĐIỂM GHI NHỚ / MEMORY POINT</small><strong>{{ item.memory }}</strong><p>{{ item.learningEn?.memory }}</p></div>
          </article>
          <article class="memory-panel pitfall">
            <v-icon>mdi-alert-outline</v-icon>
            <div><small>BẪY CHẨN ĐOÁN / PITFALL</small><strong>{{ item.pitfall }}</strong><p>{{ item.learningEn?.pitfall }}</p></div>
          </article>
        </div>

        <article class="marker-panel">
          <header><v-icon>mdi-test-tube</v-icon><h3>HMMD / IHC và xét nghiệm hỗ trợ</h3></header>
          <div><span v-for="marker in item.markers || []" :key="marker">{{ marker }}</span></div>
        </article>

        <article v-if="item.systems?.length" class="classification-panel">
          <h3>Hệ thống phân loại liên quan</h3>
          <a v-for="system in item.systems" :key="system.label" :href="system.url" target="_blank" rel="noopener noreferrer">
            <strong>{{ system.label }}</strong><span>{{ system.note }}</span><v-icon size="15">mdi-open-in-new</v-icon>
          </a>
        </article>

        <p class="medical-disclaimer">
          Hồ sơ phục vụ học tập và đối chiếu. Kết luận chẩn đoán phải dựa trên toàn bộ bệnh phẩm, dữ liệu lâm sàng và tiêu chuẩn hiện hành.
        </p>
      </section>
    </div>
  </v-dialog>
</template>

<style scoped>
.case-dialog {
  position: relative;
  height: min(900px, calc(100vh - 42px));
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(420px, 46%) 1fr;
  background: #fff;
  border: 1px solid #cfd9de;
  border-radius: 7px;
  box-shadow: 0 24px 80px rgba(8, 30, 44, 0.3);
}

.dialog-close {
  position: absolute;
  top: 13px;
  right: 15px;
  z-index: 5;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #17384b;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #d1dce1;
  border-radius: 50%;
  cursor: pointer;
}

.dialog-media {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #101c24;
}

.media-loading,
.media-placeholder {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
}

.media-placeholder {
  padding: 34px;
  gap: 10px;
  color: #c8d5dc;
  text-align: center;
  background: repeating-linear-gradient(135deg, #14242d, #14242d 14px, #192b35 14px, #192b35 28px);
}

.media-placeholder span {
  max-width: 390px;
  color: #91a7b3;
  font-size: 0.82rem;
}

.media-caption {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  min-height: 46px;
  padding: 10px 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  color: #dbe5ea;
  background: rgba(10, 25, 34, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 0.76rem;
}

.media-caption a {
  color: #f0cb58;
}

.dialog-content {
  min-width: 0;
  overflow-y: auto;
  padding: 34px 38px 40px;
  background: #fbfcfc;
}

.case-heading {
  padding-right: 44px;
}

.case-heading > p {
  margin: 0 0 9px;
  color: #19786f;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.case-heading h1 {
  margin: 0;
  color: #132f42;
  font: 700 clamp(1.55rem, 2.4vw, 2.25rem)/1.2 var(--font-body);
  letter-spacing: 0;
}

.case-heading h2 {
  margin: 8px 0 0;
  color: #5d7481;
  font: 500 1rem/1.45 var(--font-body);
  letter-spacing: 0;
}

.heading-badges,
.source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.heading-badges {
  margin-top: 15px;
}

.heading-badges span {
  padding: 5px 8px;
  color: #234b5e;
  background: #edf4f6;
  border: 1px solid #cbdde2;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 800;
}

.source-actions {
  margin: 22px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #dbe4e8;
}

.source-actions a,
.source-actions button {
  min-height: 38px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #17465c;
  background: #fff;
  border: 1px solid #bcd2db;
  border-radius: 4px;
  font: 700 0.75rem var(--font-body);
  cursor: pointer;
}

.source-actions .danger-action {
  color: #9f2e32;
  border-color: #e3b9ba;
}

.learning-section {
  margin-top: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d9e2e6;
  border-radius: 5px;
}

.learning-section > header {
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: #edf4f6;
  border-bottom: 1px solid #d9e2e6;
}

.section-number {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #1d7180;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
}

.learning-section h3,
.marker-panel h3,
.classification-panel h3 {
  margin: 0;
  color: #17364a;
  font: 700 0.98rem var(--font-body);
}

.learning-section header p {
  margin: 2px 0 0;
  color: #6b7e88;
  font-size: 0.7rem;
}

.bilingual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bilingual-grid > div {
  min-width: 0;
  padding: 15px 18px 16px;
}

.bilingual-grid > div + div {
  background: #f6fafb;
  border-left: 1px solid #d9e2e6;
}

.bilingual-grid small,
.memory-panel small {
  color: #16877e;
  font-size: 0.64rem;
  font-weight: 900;
}

.bilingual-grid ul {
  margin: 10px 0 0;
  padding-left: 19px;
  color: #304b5b;
  font-size: 0.82rem;
  line-height: 1.6;
}

.bilingual-grid li + li {
  margin-top: 6px;
}

.memory-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.memory-panel {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  color: #705400;
  background: #fff9e8;
  border: 1px solid #ead28a;
  border-radius: 5px;
}

.memory-panel.pitfall {
  color: #8c3639;
  background: #fff2f2;
  border-color: #e3b8ba;
}

.memory-panel strong,
.memory-panel p {
  display: block;
  margin-top: 7px;
  font-size: 0.78rem;
  line-height: 1.5;
}

.memory-panel p {
  margin-bottom: 0;
  color: #667781;
}

.marker-panel,
.classification-panel {
  margin-top: 18px;
  padding: 16px;
  background: #fff;
  border: 1px solid #d9e2e6;
  border-radius: 5px;
}

.marker-panel header {
  display: flex;
  gap: 9px;
  color: #1d7180;
}

.marker-panel > div {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.marker-panel span {
  padding: 5px 8px;
  color: #1b5668;
  background: #eaf5f6;
  border: 1px solid #bfdae0;
  border-radius: 3px;
  font-size: 0.72rem;
  font-weight: 700;
}

.classification-panel a {
  margin-top: 10px;
  padding: 11px 12px;
  display: grid;
  grid-template-columns: minmax(150px, 0.35fr) 1fr auto;
  align-items: start;
  gap: 12px;
  color: #244b5e;
  background: #f3f7f8;
  border: 1px solid #dae5e8;
  border-radius: 4px;
}

.classification-panel a span {
  color: #647984;
  font-size: 0.74rem;
  line-height: 1.45;
}

.medical-disclaimer {
  margin: 20px 0 0;
  padding: 12px;
  color: #667983;
  background: #eef3f5;
  border-left: 3px solid #7d929c;
  font-size: 0.72rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .case-dialog {
    height: 100vh;
    display: block;
    overflow-y: auto;
    border: 0;
    border-radius: 0;
  }

  .dialog-media {
    height: min(58vh, 520px);
  }

  .dialog-content {
    overflow: visible;
    padding: 25px 20px 35px;
  }
}

@media (max-width: 640px) {
  .bilingual-grid,
  .memory-grid {
    grid-template-columns: 1fr;
  }

  .bilingual-grid > div + div {
    border-top: 1px solid #d9e2e6;
    border-left: 0;
  }

  .classification-panel a {
    grid-template-columns: 1fr auto;
  }

  .classification-panel a span {
    grid-column: 1 / -1;
  }
}
</style>
