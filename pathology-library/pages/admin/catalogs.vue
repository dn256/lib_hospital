<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useCatalogs } from '~/composables/useCatalogs'
import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
    layout: 'admin',
    middleware: 'auth'
})

const supabase = useSupabaseClient()
const { organs, diagnoses, tags, loadAll } = useCatalogs()
const { isEditor, canManageCatalogs } = usePermissions()

// Active tab
const activeTab = ref('organs')

// Dialog state
const dialog = ref(false)
const editingItem = ref<any>(null)
const isEditing = computed(() => !!editingItem.value?.id)

// Form data
const form = ref({
    name: '',
    parent_id: null as number | null,
    icdo_code: '',
    is_active: true
})

// Loading states
const loading = ref(false)
const saving = ref(false)

const tabItems = [
    { value: 'organs', label: 'Cơ quan', icon: 'mdi-human' },
    { value: 'diagnoses', label: 'Chẩn đoán', icon: 'mdi-bacteria' },
    { value: 'tags', label: 'Tags', icon: 'mdi-tag-multiple' },
]

onMounted(async () => {
    loading.value = true
    await loadAll()
    loading.value = false
})

const currentItems = computed(() => {
    switch (activeTab.value) {
        case 'organs': return organs.value || []
        case 'diagnoses': return diagnoses.value || []
        case 'tags': return tags.value || []
        default: return []
    }
})

const searchKeyword = ref('')

const filteredItems = computed(() => {
    if (!searchKeyword.value) return currentItems.value
    const kw = searchKeyword.value.toLowerCase()
    return currentItems.value.filter((item: any) =>
        String(item.id).includes(kw) ||
        item.name?.toLowerCase().includes(kw) ||
        item.icdo_code?.toLowerCase().includes(kw)
    )
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(100)
const pageSizeOptions = [100, 300, 500, 1000]

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)))

const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
})

const pageFrom = computed(() => filteredItems.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const pageTo = computed(() => Math.min(currentPage.value * pageSize.value, filteredItems.value.length))

// Reset page when tab or search changes
watch(activeTab, () => {
    searchKeyword.value = ''
    currentPage.value = 1
})
watch(searchKeyword, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })

const tableName = computed(() => activeTab.value)

// Open create dialog
const openCreateDialog = () => {
    editingItem.value = null
    form.value = { name: '', parent_id: null, icdo_code: '', is_active: true }
    dialog.value = true
}

// Open edit dialog
const openEditDialog = (item: any) => {
    editingItem.value = item
    form.value = {
        name: item.name || '',
        parent_id: item.parent_id || null,
        icdo_code: item.icdo_code || '',
        is_active: item.is_active ?? true
    }
    dialog.value = true
}

// Save item
const saveItem = async () => {
    if (!form.value.name.trim()) return

    saving.value = true
    try {
        const data: any = { name: form.value.name.trim() }

        // Add optional fields based on table
        if (activeTab.value === 'organs' || activeTab.value === 'diagnoses') {
            if (form.value.parent_id) data.parent_id = form.value.parent_id
        }
        if (activeTab.value === 'diagnoses' && form.value.icdo_code) {
            data.icdo_code = form.value.icdo_code
        }
        if (activeTab.value === 'organs') {
            data.is_active = form.value.is_active
        }

        if (isEditing.value) {
            // Update
            const { error } = await supabase
                .from(tableName.value)
                .update(data)
                .eq('id', editingItem.value.id)
            if (error) throw error
        } else {
            // Insert
            const { error } = await supabase
                .from(tableName.value)
                .insert(data)
            if (error) throw error
        }

        // Reload data
        await loadAll()
        dialog.value = false
    } catch (e: any) {
        console.error('Error saving:', e)
        alert(e.message || 'Lỗi khi lưu')
    } finally {
        saving.value = false
    }
}

// Delete item
const deleteItem = async (item: any) => {
    if (!confirm(`Bạn có chắc muốn xóa "${item.name}"?`)) return

    try {
        const { error } = await supabase
            .from(tableName.value)
            .delete()
            .eq('id', item.id)
        if (error) throw error
        await loadAll()
    } catch (e: any) {
        console.error('Error deleting:', e)
        alert(e.message || 'Lỗi khi xóa')
    }
}

// Get parent options for select
const parentOptions = computed(() => {
    const items = activeTab.value === 'organs' ? organs.value : diagnoses.value
    return items?.filter(i => i.id !== editingItem.value?.id) || []
})

const dialogTitle = computed(() => {
    const tabLabel = tabItems.find(t => t.value === activeTab.value)?.label || 'Item'
    return isEditing.value ? `Sửa ${tabLabel}` : `Thêm ${tabLabel}`
})
</script>

<template>
    <div>
        <!-- Header -->
        <div class="page-header mb-6">
            <div>
                <h2 class="page-title">Quản lý Danh mục</h2>
                <p class="page-subtitle">Thêm, sửa, xóa các danh mục: Cơ quan, Chẩn đoán, Tags</p>
            </div>
        </div>

        <!-- Tabs -->
        <v-card elevation="0" class="main-card">
            <v-tabs v-model="activeTab" color="primary" class="border-b">
                <v-tab v-for="tab in tabItems" :key="tab.value" :value="tab.value">
                    <v-icon start size="18">{{ tab.icon }}</v-icon>
                    {{ tab.label }}
                    <v-chip size="x-small" class="ml-2" variant="tonal">
                        {{ tab.value === 'organs' ? organs?.length : tab.value === 'diagnoses' ? diagnoses?.length :
                            tags?.length }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-card-text>
                <!-- Toolbar -->
                <div class="toolbar mb-4">
                    <v-text-field v-model="searchKeyword" placeholder="Tìm theo tên, ID..."
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                        class="search-input" />
                    <v-btn v-if="canManageCatalogs" color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
                        Thêm mới
                    </v-btn>
                    <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="loadAll" :loading="loading">
                        Làm mới
                    </v-btn>
                </div>

                <!-- Content -->
                <div v-if="loading" class="text-center py-12">
                    <v-progress-circular indeterminate color="primary" />
                </div>

                <v-table v-else hover>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên</th>
                            <th v-if="activeTab === 'diagnoses'">ICD-O Code</th>
                            <th v-if="activeTab !== 'tags'">Parent</th>
                            <th v-if="activeTab === 'organs'">Active</th>
                            <th class="text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in paginatedItems" :key="item.id">
                            <td>
                                <code class="item-id">{{ item.id }}</code>
                            </td>
                            <td>{{ item.name }}</td>
                            <td v-if="activeTab === 'diagnoses'">
                                <code v-if="item.icdo_code">{{ item.icdo_code }}</code>
                                <span v-else class="text-grey">-</span>
                            </td>
                            <td v-if="activeTab !== 'tags'">
                                <span v-if="item.parent_id">{{ item.parent_id }}</span>
                                <span v-else class="text-grey">-</span>
                            </td>
                            <td v-if="activeTab === 'organs'">
                                <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" variant="tonal">
                                    {{ item.is_active ? 'Active' : 'Inactive' }}
                                </v-chip>
                            </td>
                            <td class="text-right">
                                <v-btn v-if="canManageCatalogs" icon variant="text" size="small" color="primary"
                                    @click="openEditDialog(item)">
                                    <v-icon>mdi-pencil</v-icon>
                                    <v-tooltip activator="parent">Sửa</v-tooltip>
                                </v-btn>
                                <v-btn v-if="canManageCatalogs" icon variant="text" size="small" color="error"
                                    @click="deleteItem(item)">
                                    <v-icon>mdi-delete</v-icon>
                                    <v-tooltip activator="parent">Xóa</v-tooltip>
                                </v-btn>
                            </td>
                        </tr>
                        <tr v-if="filteredItems.length === 0">
                            <td :colspan="activeTab === 'tags' ? 3 : activeTab === 'diagnoses' ? 5 : 5"
                                class="text-center py-8 text-grey">
                                Chưa có dữ liệu
                            </td>
                        </tr>
                    </tbody>
                </v-table>

                <!-- Pagination Bar -->
                <div class="pagination-bar" v-if="filteredItems.length > 0">
                    <div class="pagination-info">
                        Hiển thị <strong>{{ pageFrom }}–{{ pageTo }}</strong> / <strong>{{ filteredItems.length }}</strong> bản ghi
                    </div>
                    <div class="pagination-controls">
                        <v-btn icon variant="text" size="small" :disabled="currentPage === 1"
                            @click="currentPage = 1">
                            <v-icon>mdi-page-first</v-icon>
                            <v-tooltip activator="parent">Trang đầu</v-tooltip>
                        </v-btn>
                        <v-btn icon variant="text" size="small" :disabled="currentPage === 1"
                            @click="currentPage--">
                            <v-icon>mdi-chevron-left</v-icon>
                        </v-btn>
                        <span class="page-indicator">Trang {{ currentPage }} / {{ totalPages }}</span>
                        <v-btn icon variant="text" size="small" :disabled="currentPage === totalPages"
                            @click="currentPage++">
                            <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                        <v-btn icon variant="text" size="small" :disabled="currentPage === totalPages"
                            @click="currentPage = totalPages">
                            <v-icon>mdi-page-last</v-icon>
                            <v-tooltip activator="parent">Trang cuối</v-tooltip>
                        </v-btn>
                    </div>
                    <div class="pagination-size">
                        <span class="size-label">Số dòng/trang:</span>
                        <v-btn-toggle v-model="pageSize" mandatory density="compact" variant="outlined" color="primary">
                            <v-btn v-for="opt in pageSizeOptions" :key="opt" :value="opt" size="small">
                                {{ opt }}
                            </v-btn>
                        </v-btn-toggle>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Edit/Create Dialog -->
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title class="dialog-title">
                    {{ dialogTitle }}
                </v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="saveItem">
                        <v-text-field v-model="form.name" label="Tên *" variant="outlined" density="comfortable"
                            autofocus :rules="[v => !!v || 'Tên là bắt buộc']" />

                        <v-autocomplete v-if="activeTab !== 'tags'" v-model="form.parent_id" :items="parentOptions"
                            item-title="name" item-value="id" label="Parent (tùy chọn)" variant="outlined"
                            density="comfortable" clearable />

                        <v-text-field v-if="activeTab === 'diagnoses'" v-model="form.icdo_code" label="ICD-O Code"
                            variant="outlined" density="comfortable" placeholder="VD: 8010/3" />

                        <v-switch v-if="activeTab === 'organs'" v-model="form.is_active" label="Đang hoạt động"
                            color="success" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="dialog = false">Hủy</v-btn>
                    <v-btn color="primary" variant="flat" :loading="saving" @click="saveItem">
                        {{ isEditing ? 'Cập nhật' : 'Thêm' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.main-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.border-b {
    border-bottom: 1px solid #e5e7eb;
}

.toolbar {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.search-input {
    max-width: 300px;
}

.item-id {
    background: #f0f4f8;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.dialog-title {
    font-family: 'Crimson Pro', serif;
    border-bottom: 1px solid #e5e7eb;
}

/* Pagination */
.pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    background: #f8f9fa;
    border-radius: 0 0 12px 12px;
}

.pagination-info {
    font-size: 0.85rem;
    color: #555;
    min-width: 160px;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.page-indicator {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1a365d;
    min-width: 100px;
    text-align: center;
}

.pagination-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.size-label {
    font-size: 0.85rem;
    color: #555;
    white-space: nowrap;
}
</style>
