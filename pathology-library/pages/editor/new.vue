<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const { createCase } = useCases()
const { organs, diagnoses, loadAll } = useCatalogs()
const router = useRouter()
const supabase = useSupabaseClient()

const form = ref({
    organId: undefined as number | undefined,
    diagnosisId: undefined as number | undefined,
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
        const result = await createCase({
            organId: form.value.organId,
            diagnosisId: form.value.diagnosisId,
            description: form.value.description,
            note: form.value.note
        })

        // result should be case_id as per useCases wrapper of create_case_v1
        const caseId = result

        // Find the version ID to redirect to editor
        const { data, error } = await supabase
            .from('case_versions')
            .select('id') // using 'id' as version_id
            .eq('case_id', caseId)
            // .eq('status', 'draft') // usually v1 is draft initially
            .maybeSingle()

        if (data?.id) {
            router.push(`/editor/${data.id}`)
        } else {
            // Fallback
            alert('Tạo thành công nhưng không tìm thấy version. Vui lòng kiểm tra danh sách.')
            router.push('/')
        }

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
                <select v-model="form.organId" required class="input-control">
                    <option :value="undefined">-- Chọn Cơ quan --</option>
                    <option v-for="o in organs" :key="o.id" :value="o.id">{{ o.name }}</option>
                </select>
            </div>

            <div class="form-group">
                <label class="label">Chẩn đoán <span class="req">*</span></label>
                <select v-model="form.diagnosisId" required class="input-control">
                    <option :value="undefined">-- Chọn Chẩn đoán --</option>
                    <option v-for="d in diagnoses" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
            </div>

            <div class="form-group">
                <label class="label">Mô tả vi thể <span class="req">*</span></label>
                <textarea v-model="form.description" rows="10" required class="input-control"></textarea>
            </div>

            <div class="form-group">
                <label class="label">Ghi chú</label>
                <textarea v-model="form.note" rows="3" class="input-control"></textarea>
            </div>

            <div class="actions">
                <button type="button" @click="router.back()" class="btn-cancel">Hủy</button>
                <button type="submit" :disabled="loading" class="btn-submit">
                    {{ loading ? 'Đang lưu...' : 'Tạo mới' }}
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
</style>
