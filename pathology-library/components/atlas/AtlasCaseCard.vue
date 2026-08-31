<script setup lang="ts">
defineProps<{
  item: any
  chapter: any
  imageUrl: string
}>()

defineEmits<{
  select: [item: any]
  imageError: [id: string]
}>()
</script>

<template>
  <article class="atlas-card" tabindex="0" @click="$emit('select', item)" @keydown.enter="$emit('select', item)">
    <div class="image-frame">
      <v-img
        v-if="imageUrl"
        class="atlas-image"
        :src="imageUrl"
        :alt="`${item.diagnosis} / ${item.english}`"
        cover
        height="100%"
        @error="$emit('imageError', item.id)"
      >
        <template #placeholder>
          <div class="image-loading"><v-progress-circular indeterminate color="accent" size="28" /></div>
        </template>
      </v-img>
      <div v-else class="image-placeholder">
        <v-icon size="34">mdi-image-search-outline</v-icon>
        <span>Chưa có ảnh đã xác minh</span>
      </div>
      <span class="organ-badge" :style="{ borderColor: chapter?.color || '#1a365d' }">
        {{ chapter?.name || item.chapter }}
      </span>
      <span v-if="item.custom" class="custom-badge">Tự thêm</span>
    </div>

    <div class="card-body">
      <div class="card-meta">
        <span>{{ item.imageKind || 'Vi thể' }}</span>
        <span v-if="item.icdo?.code && item.icdo.code !== 'Không áp dụng'">ICD-O {{ item.icdo.code }}</span>
      </div>
      <h3>{{ item.diagnosis }}</h3>
      <p class="english-name">{{ item.english || 'Chưa có tên tiếng Anh' }}</p>
      <p class="memory-point">{{ item.memory || item.micro?.[0] || 'Mở hồ sơ để đọc đặc điểm vi thể.' }}</p>

      <div class="marker-row" aria-label="Dấu ấn hóa mô miễn dịch">
        <span v-for="marker in (item.markers || []).slice(0, 3)" :key="marker">{{ marker }}</span>
        <span v-if="(item.markers || []).length > 3">+{{ item.markers.length - 3 }}</span>
      </div>

      <button type="button" class="open-button">
        Xem hồ sơ song ngữ
        <v-icon size="17">mdi-arrow-right</v-icon>
      </button>
    </div>
  </article>
</template>

<style scoped>
.atlas-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d7e0e5;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(19, 52, 72, 0.07);
  cursor: pointer;
  animation: cardReveal 0.42s ease both;
  animation-delay: calc(var(--card-index, 0) * 24ms);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.atlas-card:hover,
.atlas-card:focus-visible {
  outline: none;
  border-color: #b28b18;
  box-shadow: 0 10px 26px rgba(19, 52, 72, 0.14);
  transform: translateY(-2px);
}

.image-frame {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: #e8eef1;
  border-bottom: 1px solid #d7e0e5;
}

.atlas-image :deep(.v-img__img) {
  transition: transform 0.55s ease, filter 0.3s ease;
}

.atlas-card:hover .atlas-image :deep(.v-img__img),
.atlas-card:focus-visible .atlas-image :deep(.v-img__img) {
  transform: scale(1.055);
  filter: saturate(1.06) contrast(1.02);
}

.image-loading,
.image-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 9px;
}

.image-placeholder {
  color: #637783;
  font-size: 0.8rem;
  background: repeating-linear-gradient(135deg, #edf3f5, #edf3f5 9px, #e5edef 9px, #e5edef 18px);
}

.organ-badge,
.custom-badge {
  position: absolute;
  top: 12px;
  padding: 5px 8px;
  color: #18394c;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
}

.organ-badge {
  left: 12px;
}

.custom-badge {
  right: 12px;
  color: #694f00;
  border-color: #d4af37;
}

.card-body {
  padding: 17px;
}

.card-meta {
  min-height: 20px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #667a86;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  color: #132f42;
  font: 700 1.08rem/1.35 var(--font-body);
  letter-spacing: 0;
}

.english-name {
  min-height: 38px;
  margin: 5px 0 10px;
  color: #547080;
  font-size: 0.82rem;
  line-height: 1.45;
}

.memory-point {
  min-height: 64px;
  margin: 0;
  color: #334d5d;
  font-size: 0.82rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.marker-row {
  min-height: 30px;
  margin-top: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.marker-row span {
  padding: 3px 6px;
  color: #205267;
  background: #edf6f7;
  border: 1px solid #c9e0e3;
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 700;
}

.open-button {
  width: 100%;
  min-height: 38px;
  margin-top: 15px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1a4b62;
  background: transparent;
  border: 0;
  border-top: 1px solid #e0e7ea;
  font: 700 0.78rem var(--font-body);
  cursor: pointer;
}

.open-button :deep(.v-icon) {
  transition: transform 0.2s ease;
}

.atlas-card:hover .open-button :deep(.v-icon),
.atlas-card:focus-visible .open-button :deep(.v-icon) {
  transform: translateX(4px);
}

@keyframes cardReveal {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .atlas-card { animation: none; transition: none; }
  .atlas-image :deep(.v-img__img), .open-button :deep(.v-icon) { transition: none; }
}

@media (max-width: 640px) {
  .image-frame {
    height: 205px;
  }
}
</style>
