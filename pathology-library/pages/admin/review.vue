<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useCases } from '~/composables/useCases'
import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
    layout: 'admin',
    middleware: 'auth'
})

const { search } = useCases()
const supabase = useSupabaseClient()
const { isEditor, isReviewer, isAdmin } = usePermissions()

// Tabs for different review states
const activeTab = ref<'in_review' | 'draft'>('in_review')

// Data
const cases = ref<any[]>([])
const loading = ref(true)

// Review dialog
const reviewDialog = ref(false)
const selectedCase = ref<any>(null)
const reviewAction = ref<'publish' | 'submit_review' | 'reject'>('publish')
const reviewComment = ref('')
const submitting = ref(false)

// Tab configurations
const tabConfigs = [
    {
        value: 'in_review',
        label: 'Chờ duyệt',
        icon: 'mdi-clock-outline',
        color: 'info',
        description: 'Các case đã gửi và đang chờ phê duyệt'
    },
    {
        value: 'draft',
        label: 'Bản nháp',
        icon: 'mdi-file-edit-outline',
        color: 'warning',
        description: 'Các case đang ở trạng thái bản nháp'
    },
]

onMounted(async () => {
    await loadCases()
})

// Watch tab changes
watch(activeTab, () => {
    loadCases()
})

const loadCases = async () => {
    loading.value = true
    try {
        cases.value = await search({ status: [activeTab.value], limit: 50 }) || []
    } catch (e) {
        console.error('Error loading cases:', e)
    } finally {
        loading.value = false
    }
}

const currentTabConfig = computed(() =>
    tabConfigs.find(t => t.value === activeTab.value)
)

// Get status display info
const getStatusInfo = (status: string) => {
    switch (status) {
        case 'draft': return { label: 'Bản nháp', color: 'warning' }
        case 'in_review': return { label: 'Chờ duyệt', color: 'info' }
        case 'published': return { label: 'Đã xuất bản', color: 'success' }
        default: return { label: status, color: 'grey' }
    }
}

// Open review dialog with different actions based on current status
const openReviewDialog = (caseData: any, action: 'publish' | 'submit_review' | 'reject') => {
    selectedCase.value = caseData
    reviewAction.value = action
    reviewComment.value = ''
    reviewDialog.value = true
}

const getDialogConfig = computed(() => {
    switch (reviewAction.value) {
        case 'publish':
            return {
                title: 'Xuất bản Case',
                icon: 'mdi-check-circle',
                color: 'success',
                buttonText: 'Xuất bản ngay',
                alert: 'Case sẽ được <strong>xuất bản</strong> và hiển thị công khai cho người dùng.',
                alertType: 'success' as const
            }
        case 'submit_review':
            return {
                title: 'Gửi để Duyệt',
                icon: 'mdi-send-clock',
                color: 'info',
                buttonText: 'Gửi duyệt',
                alert: 'Case sẽ được chuyển sang trạng thái <strong>Chờ duyệt</strong>.',
                alertType: 'info' as const
            }
        case 'reject':
            return {
                title: 'Trả lại Case',
                icon: 'mdi-undo',
                color: 'warning',
                buttonText: 'Trả lại',
                alert: 'Case sẽ chuyển về <strong>Bản nháp</strong> để tác giả chỉnh sửa.',
                alertType: 'warning' as const
            }
    }
})

const submitReview = async () => {
    if (!selectedCase.value) return

    submitting.value = true
    try {
        let newStatus: string
        switch (reviewAction.value) {
            case 'publish':
                newStatus = 'published'
                break
            case 'submit_review':
                newStatus = 'in_review'
                break
            case 'reject':
                newStatus = 'draft'
                break
        }

        // Update case status
        const { error } = await supabase
            .from('case_versions')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('case_id', selectedCase.value.case_id)

        if (error) throw error

        // Remove from list
        cases.value = cases.value.filter(
            c => c.version_id !== selectedCase.value.version_id
        )

        reviewDialog.value = false
    } catch (e: any) {
        console.error('Error submitting review:', e)
        alert(e.message || 'Lỗi khi thực hiện thao tác')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div>
        <!-- Header -->
        <div class="page-header mb-6">
            <div>
                <h2 class="page-title">Duyệt & Xuất bản Cases</h2>
                <p class="page-subtitle">Quản lý, duyệt và xuất bản các case trong hệ thống</p>
            </div>
            <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="loadCases" :loading="loading">
                Làm mới
            </v-btn>
        </div>

        <!-- Tabs -->
        <v-card elevation="0" class="tabs-card mb-6">
            <v-tabs v-model="activeTab" color="primary" grow>
                <v-tab v-for="tab in tabConfigs" :key="tab.value" :value="tab.value">
                    <v-icon start size="18">{{ tab.icon }}</v-icon>
                    {{ tab.label }}
                    <v-chip size="x-small" :color="tab.value === activeTab ? tab.color : 'grey'" variant="tonal"
                        class="ml-2">
                        {{ tab.value === activeTab ? cases.length : '...' }}
                    </v-chip>
                </v-tab>
            </v-tabs>
        </v-card>

        <!-- Tab description -->
        <v-alert v-if="currentTabConfig" :color="currentTabConfig.color" variant="tonal" density="compact" class="mb-6">
            <v-icon start>{{ currentTabConfig.icon }}</v-icon>
            {{ currentTabConfig.description }}
        </v-alert>

        <!-- Content -->
        <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="mt-4 text-grey">Đang tải dữ liệu...</p>
        </div>

        <div v-else-if="cases.length === 0" class="empty-state">
            <v-icon size="80" color="success">mdi-check-circle-outline</v-icon>
            <h3>Không có case nào {{ activeTab === 'in_review' ? 'cần duyệt' : 'trong bản nháp' }}!</h3>
            <p>{{ activeTab === 'in_review' ? 'Tất cả các case đã được xử lý.' : 'Không có bản nháp nào cần xem xét.' }}
            </p>
        </div>

        <div v-else class="cases-grid">
            <v-card v-for="c in cases" :key="c.version_id" elevation="0" class="case-card">
                <v-card-text>
                    <!-- Case Header -->
                    <div class="case-header">
                        <v-chip :color="getStatusInfo(c.status).color" size="small" variant="tonal">
                            {{ getStatusInfo(c.status).label }}
                        </v-chip>
                        <span class="case-date">
                            {{ new Date(c.updated_at).toLocaleDateString('vi-VN') }}
                        </span>
                    </div>

                    <!-- Case ID -->
                    <div class="case-id-row">
                        <code>{{ c.case_id?.substring(0, 12) }}</code>
                    </div>

                    <!-- Description -->
                    <div class="case-description">
                        <h4>Mô tả vi thể:</h4>
                        <p>{{ c.microscopic_description?.substring(0, 200) || 'Không có mô tả' }}...</p>
                    </div>

                    <!-- Clinical Info -->
                    <div v-if="c.clinical_history" class="case-clinical">
                        <h4>Lâm sàng:</h4>
                        <p>{{ c.clinical_history?.substring(0, 100) }}...</p>
                    </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="case-actions">
                    <NuxtLink :to="`/cases/${c.version_id}`">
                        <v-btn variant="text" color="primary" size="small">
                            <v-icon start size="18">mdi-eye</v-icon>
                            Xem chi tiết
                        </v-btn>
                    </NuxtLink>
                    <v-spacer />

                    <!-- Actions for in_review status -->
                    <template v-if="c.status === 'in_review'">
                        <v-btn variant="tonal" color="warning" size="small" @click="openReviewDialog(c, 'reject')">
                            <v-icon start size="18">mdi-undo</v-icon>
                            Trả lại
                        </v-btn>
                        <v-btn variant="flat" color="success" size="small" @click="openReviewDialog(c, 'publish')">
                            <v-icon start size="18">mdi-check</v-icon>
                            Duyệt
                        </v-btn>
                    </template>

                    <!-- Actions for draft status -->
                    <template v-else-if="c.status === 'draft'">
                        <NuxtLink :to="`/editor/${c.version_id}`">
                            <v-btn variant="tonal" color="primary" size="small">
                                <v-icon start size="18">mdi-pencil</v-icon>
                                Sửa
                            </v-btn>
                        </NuxtLink>
                        <v-btn variant="tonal" color="info" size="small" @click="openReviewDialog(c, 'submit_review')">
                            <v-icon start size="18">mdi-send-clock</v-icon>
                            Gửi duyệt
                        </v-btn>
                        <v-btn v-if="isAdmin" variant="flat" color="success" size="small"
                            @click="openReviewDialog(c, 'publish')">
                            <v-icon start size="18">mdi-check-all</v-icon>
                            Xuất bản
                        </v-btn>
                    </template>
                </v-card-actions>
            </v-card>
        </div>

        <!-- Review Dialog -->
        <v-dialog v-model="reviewDialog" max-width="500">
            <v-card>
                <v-card-title class="dialog-title" :style="{ color: `var(--v-theme-${getDialogConfig.color})` }">
                    <v-icon start>{{ getDialogConfig.icon }}</v-icon>
                    {{ getDialogConfig.title }}
                </v-card-title>
                <v-card-text>
                    <div v-if="selectedCase" class="review-preview mb-4">
                        <div class="preview-label">Case ID:</div>
                        <code>{{ selectedCase.case_id?.substring(0, 16) }}</code>
                    </div>

                    <v-textarea v-model="reviewComment"
                        :label="reviewAction === 'reject' ? 'Lý do trả lại *' : 'Ghi chú (tùy chọn)'"
                        :placeholder="reviewAction === 'reject' ? 'Mô tả những gì cần sửa...' : 'Thêm ghi chú nếu cần...'"
                        variant="outlined" rows="3" />

                    <v-alert :type="getDialogConfig.alertType" variant="tonal" density="compact">
                        <span v-html="getDialogConfig.alert"></span>
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="reviewDialog = false">Hủy</v-btn>
                    <v-btn :color="getDialogConfig.color" variant="flat" :loading="submitting" @click="submitReview">
                        {{ getDialogConfig.buttonText }}
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

.tabs-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
}

.empty-state h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5rem;
    color: #27ae60;
    margin: 1rem 0 0.5rem;
}

.empty-state p {
    color: #666;
}

/* Cases Grid */
.cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
}

.case-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: box-shadow 0.2s ease;
}

.case-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.case-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.case-date {
    font-size: 0.8rem;
    color: #888;
}

.case-id-row {
    margin-bottom: 1rem;
}

.case-id-row code {
    background: #f0f4f8;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.case-description,
.case-clinical {
    margin-bottom: 1rem;
}

.case-description h4,
.case-clinical h4 {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1a365d;
    margin-bottom: 0.25rem;
}

.case-description p,
.case-clinical p {
    font-size: 0.9rem;
    color: #444;
    line-height: 1.5;
    margin: 0;
}

.case-actions {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Dialog */
.dialog-title {
    font-family: 'Crimson Pro', serif;
    border-bottom: 1px solid #e5e7eb;
}

.review-preview {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.preview-label {
    font-weight: 600;
    color: #1a365d;
}

@media (max-width: 768px) {
    .cases-grid {
        grid-template-columns: 1fr;
    }
}
</style>
