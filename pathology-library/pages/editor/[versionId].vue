<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCases } from '~/composables/useCases'
import { useCatalogs } from '~/composables/useCatalogs'
import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { useVietnameseFilter } from '~/composables/useVietnameseFilter'

const { vietnameseFilter } = useVietnameseFilter()

const route = useRoute()
const versionId = route.params.versionId as string
const supabase = useSupabaseClient()
const { submitForReview, deleteCase } = useCases()
const { organs, diagnoses, tags, loadAll } = useCatalogs()
const { isAdmin } = usePermissions()
const router = useRouter()

const form = ref<any>({})
const selectedTagIds = ref<number[]>([])
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
    await loadAll()
    await loadData()
})

const loadData = async () => {
    loading.value = true
    try {
        // Fetch version
        const { data, error } = await supabase.from('case_versions').select('*').eq('id', versionId).single()
        if (error) throw error
        form.value = { ...data }

        // Fetch tags
        const { data: tagData } = await supabase
            .from('case_version_tags')
            .select('tag_id')
            .eq('version_id', versionId)

        if (tagData) {
            selectedTagIds.value = tagData.map((t: any) => t.tag_id)
        }
    } catch (e: any) {
        console.error(e)
        alert('Không tải được dữ liệu: ' + e.message)
    } finally {
        loading.value = false
    }
}

const onSave = async () => {
    saving.value = true
    try {
        // Update version
        const { error } = await supabase.from('case_versions').update({
            organ_id: form.value.organ_id,
            diagnosis_id: form.value.diagnosis_id,
            microscopic_description: form.value.microscopic_description,
            note: form.value.note,
            updated_at: new Date().toISOString()
        }).eq('id', versionId)

        if (error) throw error

        // Update tags
        // Simplest strategy: delete all and re-insert. 
        // Real-world optimization: diff changes.
        const { error: delError } = await supabase.from('case_version_tags').delete().eq('version_id', versionId)
        if (delError) throw delError

        if (selectedTagIds.value.length > 0) {
            const tagRows = selectedTagIds.value.map(tid => ({ version_id: versionId, tag_id: tid }))
            const { error: insError } = await supabase.from('case_version_tags').insert(tagRows)
            if (insError) throw insError
        }

    } catch (e: any) {
        throw new Error(e.message || 'Lỗi khi lưu')
    } finally {
        saving.value = false
    }
}

const handleSave = async () => {
    try {
        await onSave()
        alert('Đã lưu nháp')
    } catch (e: any) {
        alert(e.message)
    }
}

const handleSubmitReview = async () => {
    if (!confirm('Gửi duyệt phiên bản này? Bạn sẽ không thể chỉnh sửa cho đến khi được duyệt hoặc yêu cầu sửa đổi.')) return
    try {
        await onSave() // Ensure latest changes are saved
        await submitForReview(versionId)
        alert('Đã gửi duyệt thành công!')
        router.push('/')
    } catch (e: any) {
        alert('Lỗi gửi duyệt: ' + e.message)
    }
}

const handlePublishNow = async () => {
    if (!confirm('Xuất bản ngay phiên bản này? Case sẽ hiển thị công khai cho người dùng.')) return
    try {
        await onSave() // Save latest changes first

        const { error } = await supabase
            .from('case_versions')
            .update({
                status: 'published',
                updated_at: new Date().toISOString()
            })
            .eq('id', versionId)

        if (error) throw error
        alert('Đã xuất bản thành công!')
        router.push('/')
    } catch (e: any) {
        alert('Lỗi xuất bản: ' + e.message)
    }
}

const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa case này?\nHành động này không thể hoàn tác!')) return
    try {
        await deleteCase(form.value.case_id)
        alert('Đã xóa case thành công!')
        router.push('/admin/cases')
    } catch (e: any) {
        alert('Lỗi khi xóa: ' + e.message)
    }
}
</script>

<template>
    <div class="container">
        <div v-if="loading">Đang tải...</div>
        <div v-else>
            <h1 class="page-title">Biên tập: {{ form.id?.substring(0, 8) }}...</h1>
            <div class="status-bar">
                Trạng thái hiện tại: <strong>{{ form.status }}</strong>
            </div>

            <div class="form-layout">
                <div class="main-column">
                    <div class="form-group">
                        <label>Mô tả vi thể</label>
                        <textarea v-model="form.microscopic_description" rows="15" class="input-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Ghi chú</label>
                        <textarea v-model="form.note" rows="3" class="input-control"></textarea>
                    </div>
                </div>

                <div class="side-column">
                    <div class="panel">
                        <div class="form-group">
                            <label>Cơ quan</label>
                            <v-autocomplete v-model="form.organ_id" :items="organs" item-title="name" item-value="id"
                                placeholder="Chọn cơ quan" variant="outlined" density="comfortable" hide-details
                                clearable :custom-filter="vietnameseFilter" />
                        </div>

                        <div class="form-group">
                            <label>Chẩn đoán</label>
                            <v-autocomplete v-model="form.diagnosis_id" :items="diagnoses" item-title="name"
                                item-value="id" placeholder="Chọn chẩn đoán" variant="outlined" density="comfortable"
                                hide-details clearable :custom-filter="vietnameseFilter" />
                        </div>

                        <div class="form-group">
                            <label>Tags</label>
                            <!-- TagSelector Component -->
                            <TagSelector v-model="selectedTagIds" :tags="tags" />
                        </div>
                    </div>

                    <div class="actions">
                        <button @click="handleSave" :disabled="saving" class="btn btn-save">
                            {{ saving ? 'Đang lưu...' : 'Lưu Nháp' }}
                        </button>
                        <button @click="handleSubmitReview" :disabled="saving" class="btn btn-submit">
                            Gửi Duyệt
                        </button>
                        <button v-if="isAdmin" @click="handlePublishNow" :disabled="saving" class="btn btn-publish">
                            🚀 Xuất bản ngay
                        </button>
                        <button v-if="isAdmin" @click="handleDelete" :disabled="saving" class="btn btn-delete">
                            🗑 Xóa case
                        </button>
                        <button @click="router.back()" class="btn btn-cancel">Thoát</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
}

.page-title {
    margin-bottom: 10px;
}

.status-bar {
    margin-bottom: 20px;
    background: #e0f2fe;
    color: #0369a1;
    padding: 8px 16px;
    border-radius: 4px;
}

.form-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
}

.input-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 15px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #4b5563;
}

.panel {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 20px;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.btn {
    padding: 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
}

.btn-save {
    background: #10b981;
    color: white;
}

.btn-submit {
    background: #4f46e5;
    color: white;
}

.btn-publish {
    background: #16a34a;
    color: white;
}

.btn-publish:hover {
    background: #15803d;
}

.btn-cancel {
    background: white;
    border: 1px solid #ccc;
}

.btn-delete {
    background: #dc2626;
    color: white;
}

.btn-delete:hover {
    background: #b91c1c;
}
</style>
