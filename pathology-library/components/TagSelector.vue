<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    modelValue: number[]
    tags: { id: number; name: string }[]
}>()

const emit = defineEmits(['update:modelValue'])

const search = ref('')
const availableTags = computed(() => {
    return props.tags.filter(t =>
        !props.modelValue.includes(t.id) &&
        t.name.toLowerCase().includes(search.value.toLowerCase())
    )
})

const selectedTags = computed(() => {
    return props.tags.filter(t => props.modelValue.includes(t.id))
})

const addTag = (id: number) => {
    emit('update:modelValue', [...props.modelValue, id])
    search.value = ''
}

const removeTag = (id: number) => {
    emit('update:modelValue', props.modelValue.filter(v => v !== id))
}
</script>

<template>
    <div class="tag-selector">
        <div class="selected-tags">
            <span v-for="tag in selectedTags" :key="tag.id" class="tag-chip">
                {{ tag.name }}
                <button @click="removeTag(tag.id)" class="remove-btn" type="button">×</button>
            </span>
        </div>

        <div class="input-wrapper">
            <input v-model="search" placeholder="Nhập để tìm tags..." class="tag-input" />
            <div v-if="search && availableTags.length > 0" class="suggestions">
                <div v-for="tag in availableTags" :key="tag.id" @click="addTag(tag.id)" class="suggestion-item">
                    {{ tag.name }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tag-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 32px;
}

.tag-chip {
    background: #e0e7ff;
    color: #4338ca;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.remove-btn {
    border: none;
    background: transparent;
    color: currentColor;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
}

.input-wrapper {
    position: relative;
}

.tag-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #ddd;
    border-top: none;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
}

.suggestion-item:hover {
    background: #f3f4f6;
}
</style>
