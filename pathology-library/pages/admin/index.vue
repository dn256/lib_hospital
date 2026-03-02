<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { usePermissions } from '~/composables/usePermissions'
import { useCases } from '~/composables/useCases'

definePageMeta({
    layout: 'admin',
    middleware: 'auth'
})

const { profile } = useAuth()
const { isAdmin, isEditor } = usePermissions()
const { search, count } = useCases()

// Stats
const stats = ref({
    totalCases: 0,
    draftCases: 0,
    pendingReview: 0,
    publishedCases: 0
})

const recentCases = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
    try {
        // Load stats
        const [drafts, pending, published] = await Promise.all([
            count({ status: ['draft'] }),
            count({ status: ['in_review'] }),
            count({ status: ['published'] })
        ])

        stats.value = {
            totalCases: (drafts || 0) + (pending || 0) + (published || 0),
            draftCases: drafts || 0,
            pendingReview: pending || 0,
            publishedCases: published || 0
        }

        // Recent cases
        recentCases.value = await search({ limit: 5 }) || []
    } catch (e) {
        console.error('Error loading dashboard stats:', e)
    } finally {
        loading.value = false
    }
})

const statCards = [
    { key: 'totalCases', label: 'Tổng số Cases', icon: 'mdi-file-document-multiple', color: '#1a365d' },
    { key: 'draftCases', label: 'Bản nháp', icon: 'mdi-file-edit', color: '#f39c12' },
    { key: 'pendingReview', label: 'Chờ duyệt', icon: 'mdi-clock-outline', color: '#3498db' },
    { key: 'publishedCases', label: 'Đã xuất bản', icon: 'mdi-check-circle', color: '#27ae60' },
]

const quickActions = [
    { title: 'Tạo Case mới', icon: 'mdi-plus-circle', to: '/editor/new', color: 'primary' },
    { title: 'Duyệt Cases', icon: 'mdi-check-decagram', to: '/admin/review', color: 'info' },
    { title: 'Quản lý Danh mục', icon: 'mdi-folder-table', to: '/admin/catalogs', color: 'warning' },
]
</script>

<template>
    <div>
        <!-- Welcome Section -->
        <div class="welcome-section mb-8">
            <h2 class="welcome-title">
                Xin chào, {{ profile?.display_name || 'Admin' }}! 👋
            </h2>
            <p class="welcome-text">
                Đây là tổng quan về hoạt động của thư viện.
                Bạn đang đăng nhập với vai trò <strong>{{ profile?.role || 'user' }}</strong>.
            </p>
        </div>

        <!-- Stats Cards -->
        <v-row class="mb-6">
            <v-col v-for="stat in statCards" :key="stat.key" cols="12" sm="6" md="3">
                <v-card class="stat-card" elevation="0">
                    <div class="stat-icon" :style="{ background: stat.color }">
                        <v-icon color="white" size="24">{{ stat.icon }}</v-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">
                            <template v-if="loading">
                                <v-progress-circular size="20" width="2" indeterminate />
                            </template>
                            <template v-else>
                                {{ stats[stat.key as keyof typeof stats] }}
                            </template>
                        </div>
                        <div class="stat-label">{{ stat.label }}</div>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Quick Actions & Recent Cases -->
        <v-row>
            <!-- Quick Actions -->
            <v-col cols="12" md="4">
                <v-card elevation="0" class="section-card">
                    <v-card-title class="section-title">
                        <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
                        Thao tác nhanh
                    </v-card-title>
                    <v-card-text>
                        <div class="quick-actions">
                            <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to"
                                class="quick-action-item">
                                <v-icon :color="action.color" size="20">{{ action.icon }}</v-icon>
                                <span>{{ action.title }}</span>
                                <v-icon size="16" class="arrow">mdi-chevron-right</v-icon>
                            </NuxtLink>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Recent Cases -->
            <v-col cols="12" md="8">
                <v-card elevation="0" class="section-card">
                    <v-card-title class="section-title d-flex justify-space-between align-center">
                        <div>
                            <v-icon class="mr-2">mdi-history</v-icon>
                            Cases gần đây
                        </div>
                        <NuxtLink to="/admin/cases" class="view-all-link">
                            Xem tất cả
                            <v-icon size="16">mdi-arrow-right</v-icon>
                        </NuxtLink>
                    </v-card-title>
                    <v-card-text>
                        <div v-if="loading" class="text-center py-8">
                            <v-progress-circular indeterminate color="primary" />
                        </div>
                        <div v-else-if="recentCases.length === 0" class="empty-state">
                            <v-icon size="48" color="grey-lighten-2">mdi-file-document-outline</v-icon>
                            <p>Chưa có case nào</p>
                        </div>
                        <div v-else class="recent-cases-list">
                            <div v-for="c in recentCases" :key="c.version_id" class="case-item">
                                <div class="case-info">
                                    <div class="case-title">
                                        {{ c.microscopic_description?.substring(0, 60) }}...
                                    </div>
                                    <div class="case-meta">
                                        <v-chip size="x-small"
                                            :color="c.status === 'published' ? 'success' : c.status === 'in_review' ? 'info' : 'warning'"
                                            variant="tonal">
                                            {{ c.status }}
                                        </v-chip>
                                        <span class="case-date">
                                            {{ new Date(c.updated_at).toLocaleDateString('vi-VN') }}
                                        </span>
                                    </div>
                                </div>
                                <NuxtLink :to="`/editor/${c.version_id}`" class="case-action">
                                    <v-icon size="18">mdi-pencil</v-icon>
                                </NuxtLink>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
.welcome-section {
    padding: 1.5rem;
    background: linear-gradient(135deg, #1a365d, #0f3460);
    border-radius: 16px;
    color: white;
}

.welcome-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.welcome-text {
    font-size: 0.95rem;
    opacity: 0.9;
    margin: 0;
}

.welcome-text strong {
    color: #c9a227;
    text-transform: capitalize;
}

/* Stat Cards */
.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a365d;
    line-height: 1;
}

.stat-label {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.25rem;
}

/* Section Cards */
.section-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    height: 100%;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a365d;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.75rem !important;
}

.view-all-link {
    font-size: 0.85rem;
    color: #3498db;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.view-all-link:hover {
    text-decoration: underline;
}

/* Quick Actions */
.quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.quick-action-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: #f8f9fa;
    border-radius: 10px;
    text-decoration: none;
    color: #1a365d;
    font-weight: 500;
    transition: all 0.2s ease;
}

.quick-action-item:hover {
    background: #e8f4fd;
    transform: translateX(4px);
}

.quick-action-item .arrow {
    margin-left: auto;
    opacity: 0.5;
}

.quick-action-item:hover .arrow {
    opacity: 1;
}

/* Recent Cases */
.recent-cases-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.case-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    background: #f8f9fa;
    border-radius: 10px;
    transition: background 0.2s ease;
}

.case-item:hover {
    background: #f0f0f0;
}

.case-info {
    flex: 1;
    min-width: 0;
}

.case-title {
    font-weight: 500;
    color: #1a365d;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.25rem;
}

.case-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.case-date {
    font-size: 0.75rem;
    color: #888;
}

.case-action {
    padding: 0.5rem;
    color: #666;
    transition: color 0.2s ease;
}

.case-action:hover {
    color: #1a365d;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #888;
}

.empty-state p {
    margin-top: 0.5rem;
}
</style>
