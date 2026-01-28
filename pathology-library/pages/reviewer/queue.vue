<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCases } from '~/composables/useCases'

const { search, approvePublish, archive } = useCases()

const rows = ref<any[]>([])
const loading = ref(false)

const loadQueue = async () => {
    loading.value = true
    try {
        const result = await search({
            status: ['in_review'],
            limit: 100,
            offset: 0
        })
        rows.value = result || []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => loadQueue())

const onApprove = async (versionId: string) => {
    if (!window.confirm('Xác nhận xuất bản phiên bản này?')) return
    try {
        await approvePublish(versionId)
        window.alert('Đã xuất bản thành công!')
        loadQueue()
    } catch (e: any) {
        window.alert('Lỗi: ' + e.message)
    }
}

const onArchive = async (versionId: string) => {
    const reason = window.prompt('Nhập lý do từ chối/lưu trữ:')
    if (!reason) return
    try {
        await archive(versionId, reason)
        window.alert('Đã chuyển vào lưu trữ')
        loadQueue()
    } catch (e: any) {
        window.alert('Lỗi: ' + e.message)
    }
}
</script>

<template>
    <div class="container">
        <div class="header">
            <h1>Hàng đợi duyệt bài</h1>
            <button @click="loadQueue" class="btn-refresh">Tải lại</button>
        </div>

        <div v-if="loading">Đang tải...</div>

        <table v-else class="table">
            <thead>
                <tr>
                    <th>Case ID</th>
                    <th>Nội dung tóm tắt</th>
                    <th>Ngày cập nhật</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="r in rows" :key="r.version_id">
                    <td>
                        <NuxtLink :to="`/cases/${r.version_id}`" target="_blank">{{ r.case_id }}</NuxtLink>
                        <div class="version-tag">v{{ r.version }}</div>
                    </td>
                    <td>{{ r.microscopic_description?.substring(0, 100) }}...</td>
                    <td>{{ new Date(r.updated_at).toLocaleDateString() }}</td>
                    <td class="actions">
                        <button @click="onApprove(r.version_id)" class="btn btn-approve">Duyệt & Xuất bản</button>
                        <button @click="onArchive(r.version_id)" class="btn btn-reject">Từ chối</button>
                        <NuxtLink :to="`/editor/${r.version_id}`" class="btn btn-edit">Sửa</NuxtLink>
                    </td>
                </tr>
                <tr v-if="rows.length === 0">
                    <td colspan="4" class="no-data">Hiện không có bài nào chờ duyệt.</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.btn-refresh {
    padding: 8px 16px;
    cursor: pointer;
}

.table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #ddd;
}

.table th,
.table td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
}

.table th {
    background-color: #f3f4f6;
}

.actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    text-decoration: none;
    color: white;
}

.btn-approve {
    background-color: #059669;
}

.btn-reject {
    background-color: #dc2626;
}

.btn-edit {
    background-color: #4b5563;
}

.version-tag {
    font-size: 11px;
    background: #e5e7eb;
    display: inline-block;
    padding: 2px 4px;
    border-radius: 3px;
    margin-top: 4px;
}

.no-data {
    text-align: center;
    color: #666;
    padding: 20px;
}
</style>
