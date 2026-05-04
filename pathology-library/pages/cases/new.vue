<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVietnameseFilter } from '~/composables/useVietnameseFilter'

const { vietnameseFilter } = useVietnameseFilter()

const { createCase } = useCases()
const { organs, diagnoses, loadAll, addDiagnosis } = useCatalogs()
const { isAdmin } = usePermissions()
const router = useRouter()
const supabase = useSupabaseClient()

const publishImmediately = ref(false)
const form = ref({
    organId: undefined as number | undefined,
    diagnosisId: undefined as number | string | undefined,
    description: '',
    note: ''
})
const loading = ref(false)

onMounted(() => {
    loadAll().catch(console.error)
})

const onSubmit = async () => {
    if (!form.value.organId || !form.value.diagnosisId || !form.value.description) {
        alert('Vui lòng điền đủ thông tin bắt buộc')
        return
    }

    loading.value = true
    try {
        let finalDiagnosisId = form.value.diagnosisId
        if (typeof finalDiagnosisId === 'object' && finalDiagnosisId !== null) {
            finalDiagnosisId = (finalDiagnosisId as any).id
        } else if (typeof finalDiagnosisId === 'string' && finalDiagnosisId.trim() !== '') {
            const existing = diagnoses.value.find((d: any) => d.name.toLowerCase() === (finalDiagnosisId as string).trim().toLowerCase())
            if (existing) {
                finalDiagnosisId = existing.id
            } else {
                finalDiagnosisId = await addDiagnosis((finalDiagnosisId as string).trim())
            }
        }

        await createCase({
            organId: form.value.organId,
            diagnosisId: finalDiagnosisId as number,
            description: form.value.description,
            note: form.value.note,
            publishImmediately: publishImmediately.value && isAdmin.value
        })

        const msg = publishImmediately.value && isAdmin.value
            ? 'Đã tạo và xuất bản thành công!'
            : 'Tạo ca bệnh mới thành công!'
        alert(msg)

        // Reset form for next creation
        form.value = {
            organId: undefined,
            diagnosisId: undefined,
            description: '',
            note: ''
        }
        publishImmediately.value = false

    } catch (e: any) {
        console.error(e)
        alert(e.message || 'Lỗi khi tạo')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="container">
        <h1 class="page-title">Tạo Ca Bệnh Mới</h1>
        <form @submit.prevent="onSubmit" class="form">
            <div class="form-group">
                <label class="label">Cơ quan <span class="req">*</span></label>
                <v-autocomplete v-model="form.organId" :items="organs" item-title="name" item-value="id"
                    placeholder="-- Chọn Cơ quan --" variant="outlined" density="comfortable" hide-details clearable
                    :custom-filter="vietnameseFilter" />
            </div>

            <div class="form-group">
                <label class="label">Chẩn đoán <span class="req">*</span></label>
                <v-combobox v-model="form.diagnosisId" :items="diagnoses" item-title="name" item-value="id"
                    placeholder="Chọn hoặc nhập một chẩn đoán mới" variant="outlined" density="comfortable" hide-details clearable
                    :custom-filter="vietnameseFilter" />
            </div>

            <div class="form-group">
                <label class="label">Mô tả vi thể <span class="req">*</span></label>
                <textarea v-model="form.description" rows="10" required class="input-control"></textarea>
            </div>

            <div class="form-group">
                <label class="label">Ghi chú</label>
                <textarea v-model="form.note" rows="3" class="input-control"></textarea>
            </div>

            <!-- Admin: Publish immediately option -->
            <div v-if="isAdmin" class="form-group publish-option">
                <label class="checkbox-label">
                    <input type="checkbox" v-model="publishImmediately" />
                    <span class="checkbox-text">Xuất bản ngay</span>
                    <span class="checkbox-hint">(Bỏ qua chế độ duyệt, xuất bản trực tiếp)</span>
                </label>
            </div>

            <div class="actions">
                <button type="button" @click="router.back()" class="btn-cancel">Hủy</button>
                <button type="submit" :disabled="loading" class="btn-submit"
                    :class="{ 'btn-publish': publishImmediately }">
                    {{ loading ? 'Đang lưu...' : (publishImmediately ? '🚀 Tạo & Xuất bản' : 'Tạo mới') }}
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.container {
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
    font-family: sans-serif;
}

.page-title {
    margin-bottom: 30px;
    color: #111;
}

.form {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.form-group {
    margin-bottom: 20px;
}

.label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
}

.req {
    color: #dc2626;
}

.input-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 16px;
}

.input-control:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
}

.btn-submit {
    background: #4f46e5;
    color: white;
    padding: 10px 24px;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-cancel {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 10px 24px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
}

/* Publish immediately option */
.publish-option {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 16px;
    margin-top: 10px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin: 0;
}

.checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #16a34a;
    cursor: pointer;
}

.checkbox-text {
    font-weight: 600;
    color: #15803d;
    font-size: 15px;
}

.checkbox-hint {
    font-size: 13px;
    color: #6b7280;
}

.btn-publish {
    background: #16a34a !important;
}

.btn-publish:hover {
    background: #15803d !important;
}
</style>
