<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
    layout: 'admin',
    middleware: 'auth'
})

const supabase = useSupabaseClient()
const { isAdmin, canManageUsers } = usePermissions()

interface User {
    user_id: string
    email: string | null
    display_name: string | null
    role: string
    created_at: string
    updated_at: string
}

// Data
const users = ref<User[]>([])
const loading = ref(true)
const searchKeyword = ref('')

// Dialog
const editDialog = ref(false)
const editingUser = ref<User | null>(null)
const selectedRole = ref('viewer')
const saving = ref(false)

const roleOptions = [
    { title: 'Viewer - Chỉ xem', value: 'viewer' },
    { title: 'Reviewer - Duyệt bài', value: 'reviewer' },
    { title: 'Editor - Biên tập', value: 'editor' },
    { title: 'Admin - Quản trị', value: 'admin' },
]

const roleColors: Record<string, string> = {
    admin: 'error',
    editor: 'primary',
    reviewer: 'info',
    viewer: 'grey'
}

const loadUsers = async () => {
    loading.value = true
    try {
        // Load profiles with auth user email (via RPC or join)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get emails from auth.users via admin query (might need service role)
        // For now, we'll just show profile data
        users.value = data?.map((p: any) => ({
            ...p,
            email: null // Email not available without admin API
        })) || []
    } catch (e) {
        console.error('Error loading users:', e)
    } finally {
        loading.value = false
    }
}

const filteredUsers = computed(() => {
    if (!searchKeyword.value) return users.value
    const keyword = searchKeyword.value.toLowerCase()
    return users.value.filter(u =>
        u.display_name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.role?.toLowerCase().includes(keyword)
    )
})

onMounted(async () => {
    if (!canManageUsers.value) {
        navigateTo('/admin')
        return
    }
    await loadUsers()
})

// Open edit role dialog
const openEditDialog = (user: User) => {
    editingUser.value = user
    selectedRole.value = user.role || 'viewer'
    editDialog.value = true
}

// Update user role
const updateRole = async () => {
    if (!editingUser.value) return

    saving.value = true
    try {
        const { error } = await supabase.rpc('set_user_role', {
            target_user_id: editingUser.value.user_id,
            new_role: selectedRole.value
        })

        if (error) throw error

        // Update local state
        const index = users.value.findIndex(u => u.user_id === editingUser.value!.user_id)
        if (index !== -1) {
            users.value[index].role = selectedRole.value
        }

        editDialog.value = false
    } catch (e: any) {
        console.error('Error updating role:', e)
        alert(e.message || 'Lỗi khi cập nhật')
    } finally {
        saving.value = false
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
</script>

<template>
    <div>
        <!-- Permission check -->
        <template v-if="!canManageUsers">
            <v-alert type="warning" variant="tonal">
                Bạn không có quyền truy cập trang này.
            </v-alert>
        </template>

        <template v-else>
            <!-- Header -->
            <div class="page-header mb-6">
                <div>
                    <h2 class="page-title">Quản lý Người dùng</h2>
                    <p class="page-subtitle">Xem danh sách và phân quyền người dùng</p>
                </div>
            </div>

            <!-- Search & Stats -->
            <v-row class="mb-6">
                <v-col cols="12" md="6">
                    <v-text-field v-model="searchKeyword" label="Tìm kiếm người dùng"
                        placeholder="Nhập tên hoặc role..." prepend-inner-icon="mdi-magnify" variant="outlined"
                        density="comfortable" hide-details clearable />
                </v-col>
                <v-col cols="12" md="6" class="d-flex align-center gap-4">
                    <v-chip variant="tonal" color="primary">
                        <v-icon start>mdi-account-group</v-icon>
                        {{ users.length }} người dùng
                    </v-chip>
                    <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="loadUsers" :loading="loading">
                        Làm mới
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Users Table -->
            <v-card elevation="0" class="table-card">
                <v-card-text class="pa-0">
                    <div v-if="loading" class="text-center py-12">
                        <v-progress-circular indeterminate color="primary" />
                    </div>

                    <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
                        <v-icon size="64" color="grey-lighten-2">mdi-account-search</v-icon>
                        <p class="mt-4 text-grey">Không tìm thấy người dùng</p>
                    </div>

                    <v-table v-else hover>
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Role</th>
                                <th>Ngày tạo</th>
                                <th>Cập nhật</th>
                                <th class="text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in filteredUsers" :key="user.user_id">
                                <td>
                                    <div class="user-cell">
                                        <v-avatar size="36" color="primary" variant="tonal">
                                            <span class="text-body-2">
                                                {{ user.display_name?.charAt(0)?.toUpperCase() || 'U' }}
                                            </span>
                                        </v-avatar>
                                        <div class="user-info">
                                            <span class="user-name">
                                                {{ user.display_name || 'Unnamed User' }}
                                            </span>
                                            <span class="user-id">
                                                {{ user.user_id.substring(0, 8) }}...
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <v-chip :color="roleColors[user.role] || 'grey'" size="small" variant="tonal">
                                        {{ user.role || 'viewer' }}
                                    </v-chip>
                                </td>
                                <td>{{ formatDate(user.created_at) }}</td>
                                <td>{{ formatDate(user.updated_at) }}</td>
                                <td class="text-right">
                                    <v-btn variant="tonal" size="small" color="primary" @click="openEditDialog(user)">
                                        <v-icon start size="16">mdi-shield-edit</v-icon>
                                        Đổi Role
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>
        </template>

        <!-- Edit Role Dialog -->
        <v-dialog v-model="editDialog" max-width="400">
            <v-card>
                <v-card-title class="dialog-title">
                    Thay đổi quyền
                </v-card-title>
                <v-card-text>
                    <div v-if="editingUser" class="user-preview mb-4">
                        <v-avatar size="48" color="primary" variant="tonal">
                            <span class="text-h6">
                                {{ editingUser.display_name?.charAt(0)?.toUpperCase() || 'U' }}
                            </span>
                        </v-avatar>
                        <div>
                            <div class="font-weight-bold">{{ editingUser.display_name }}</div>
                            <div class="text-grey text-caption">
                                Hiện tại: {{ editingUser.role }}
                            </div>
                        </div>
                    </div>

                    <v-autocomplete v-model="selectedRole" :items="roleOptions" item-title="title" item-value="value"
                        label="Chọn quyền mới" variant="outlined" density="comfortable" />

                    <v-alert v-if="selectedRole === 'admin'" type="warning" variant="tonal" density="compact"
                        class="mt-4">
                        <strong>Cảnh báo:</strong> Admin có toàn quyền quản lý hệ thống!
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="editDialog = false">Hủy</v-btn>
                    <v-btn color="primary" variant="flat" :loading="saving" @click="updateRole">
                        Cập nhật
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

.table-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 500;
    color: #1a365d;
}

.user-id {
    font-size: 0.75rem;
    color: #888;
    font-family: monospace;
}

.dialog-title {
    font-family: 'Crimson Pro', serif;
    border-bottom: 1px solid #e5e7eb;
}

.user-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 10px;
}

.gap-4 {
    gap: 1rem;
}
</style>
