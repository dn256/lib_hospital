<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCases } from '~/composables/useCases'
import { useCatalogs } from '~/composables/useCatalogs'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
    layout: 'admin',
    middleware: 'auth'
})

const { search } = useCases()
const { organs, diagnoses, loadAll } = useCatalogs()
const { isEditor } = usePermissions()

// Filter & Search
const searchKeyword = ref('')
const selectedStatus = ref<string | null>(null)
const selectedOrgan = ref<number | null>(null)

// Data
const cases = ref<any[]>([])
const loading = ref(true)

const statusOptions = [
    { title: 'Tất cả', value: null },
    { title: 'Bản nháp', value: 'draft' },
    { title: 'Chờ duyệt', value: 'in_review' },
    { title: 'Đã xuất bản', value: 'published' },
    { title: 'Đã lưu trữ', value: 'archived' },
]

const loadCases = async () => {
    loading.value = true
    try {
        const statusFilter = selectedStatus.value ? [selectedStatus.value as any] : ['published', 'draft', 'in_review', 'archived']
        cases.value = await search({
            keyword: searchKeyword.value,
            organIds: selectedOrgan.value ? [selectedOrgan.value] : undefined,
            status: statusFilter,
            limit: 100
        }) || []
    } catch (e) {
        console.error('Error loading cases:', e)
    } finally {
        loading.value = false
    }
}

const filteredCases = computed(() => cases.value)

onMounted(async () => {
    await loadAll()
    await loadCases()
})

const getStatusColor = (status: string) => {
    switch (status) {
        case 'published': return 'success'
        case 'in_review': return 'info'
        case 'draft': return 'warning'
        case 'archived': return 'grey'
        default: return 'default'
    }
}

const getStatusText = (status: string) => {
    switch (status) {
        case 'published': return 'Đã xuất bản'
        case 'in_review': return 'Chờ duyệt'
        case 'draft': return 'Bản nháp'
        case 'archived': return 'Đã lưu trữ'
        default: return status
    }
}

// Watch filters
let debounceTimer: any = null
const handleFilterChange = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        loadCases()
    }, 400)
}
</script>

<template>
    <div>
        <!-- Header -->
        <div class="page-header mb-6">
            <div>
                <h2 class="page-title">Quản lý Cases</h2>
                <p class="page-subtitle">Xem và quản lý tất cả các case trong hệ thống</p>
            </div>
            <NuxtLink v-if="isEditor" to="/editor/new">
                <v-btn color="primary" prepend-icon="mdi-plus">
                    Tạo Case mới
                </v-btn>
            </NuxtLink>
        </div>

        <!-- Filters -->
        <v-card elevation="0" class="filter-card mb-6">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="searchKeyword" label="Tìm kiếm" placeholder="Nhập từ khóa..."
                            prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details
                            clearable @update:model-value="handleFilterChange" />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value"
                            label="Trạng thái" variant="outlined" density="comfortable" hide-details
                            @update:model-value="handleFilterChange" />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-select v-model="selectedOrgan" :items="organs" item-title="name" item-value="id"
                            label="Cơ quan" variant="outlined" density="comfortable" hide-details clearable
                            @update:model-value="handleFilterChange" />
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                        <v-btn variant="tonal" color="primary" @click="loadCases" :loading="loading" block>
                            <v-icon start>mdi-refresh</v-icon>
                            Làm mới
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Cases Table -->
        <v-card elevation="0" class="table-card">
            <v-card-text class="pa-0">
                <div v-if="loading" class="text-center py-12">
                    <v-progress-circular indeterminate color="primary" size="48" />
                    <p class="mt-4 text-grey">Đang tải dữ liệu...</p>
                </div>

                <div v-else-if="filteredCases.length === 0" class="empty-state py-12 text-center">
                    <v-icon size="64" color="grey-lighten-2">mdi-file-search-outline</v-icon>
                    <h3 class="mt-4 text-grey">Không tìm thấy case nào</h3>
                    <p class="text-grey-darken-1">Thử thay đổi bộ lọc hoặc tạo case mới</p>
                </div>

                <v-table v-else hover>
                    <thead>
                        <tr>
                            <th>Case ID</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                            <th class="text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in filteredCases" :key="c.version_id">
                            <td>
                                <code class="case-id">{{ c.case_id?.substring(0, 8) }}</code>
                            </td>
                            <td class="description-cell">
                                {{ c.microscopic_description?.substring(0, 80) }}...
                            </td>
                            <td>
                                <v-chip :color="getStatusColor(c.status)" size="small" variant="tonal">
                                    {{ getStatusText(c.status) }}
                                </v-chip>
                            </td>
                            <td>
                                {{ new Date(c.updated_at).toLocaleDateString('vi-VN') }}
                            </td>
                            <td class="text-right">
                                <NuxtLink :to="`/cases/${c.version_id}`">
                                    <v-btn icon variant="text" size="small" color="info">
                                        <v-icon>mdi-eye</v-icon>
                                        <v-tooltip activator="parent">Xem</v-tooltip>
                                    </v-btn>
                                </NuxtLink>
                                <NuxtLink v-if="isEditor" :to="`/editor/${c.version_id}`">
                                    <v-btn icon variant="text" size="small" color="primary">
                                        <v-icon>mdi-pencil</v-icon>
                                        <v-tooltip activator="parent">Sửa</v-tooltip>
                                    </v-btn>
                                </NuxtLink>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
}

.page-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a365d;
    margin: 0;
}

.page-subtitle {
    font-size: 0.9rem;
    color: #666;
    margin: 0.25rem 0 0;
}

.filter-card,
.table-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.case-id {
    background: #f0f4f8;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #1a365d;
}

.description-cell {
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.empty-state h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.25rem;
}
</style>
