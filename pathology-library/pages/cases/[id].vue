<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { useCatalogs } from '~/composables/useCatalogs'

const route = useRoute()
const id = route.params.id as string
const supabase = useSupabaseClient()
const { organs, diagnoses, loadAll } = useCatalogs()

const caseDetail = ref<any>(null)
const loading = ref(true)

const organName = computed(() => {
    if (!caseDetail.value?.organ_id) return 'N/A'
    return organs.value.find((o: any) => o.id === caseDetail.value.organ_id)?.name || caseDetail.value.organ_id
})

const diagnosisName = computed(() => {
    if (!caseDetail.value?.diagnosis_id) return 'N/A'
    return diagnoses.value.find((d: any) => d.id === caseDetail.value.diagnosis_id)?.name || caseDetail.value.diagnosis_id
})

onMounted(async () => {
    try {
        // Load catalogs for name lookup
        await loadAll()

        // Query detail
        // Note: Assuming 'case_versions' is exposed. If specific RPC 'get_case_version_detail' helps, use it.
        const { data, error } = await supabase
            .from('case_versions')
            .select('*')
            .eq('version_id', id) // Check if param is version_id or id. Using 'id' from route, assuming it maps to PK or version_id column.
            .maybeSingle()

        // Fallback: try 'id' column if 'version_id' doesn't exist or no data
        if (!data) {
            const { data: data2, error: error2 } = await supabase
                .from('case_versions')
                .select('*')
                .eq('id', id)
                .single()
            if (error2) throw error2
            caseDetail.value = data2
        } else {
            caseDetail.value = data
        }

    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="container">
        <div v-if="loading" class="loading">Đang tải...</div>
        <div v-else-if="!caseDetail" class="error">Không tìm thấy ca bệnh</div>
        <div v-else class="detail-card">
            <NuxtLink to="/" class="back-link">← Quay lại danh sách</NuxtLink>

            <div class="header">
                <h1 class="title">{{ diagnosisName }}</h1>
                <span class="status-badge">{{ caseDetail.status }}</span>
            </div>

            <div class="meta-grid">
                <div class="meta-item">
                    <span class="label">Cơ quan:</span>
                    <span class="value">{{ organName }}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Ngày cập nhật:</span>
                    <span class="value">{{ new Date(caseDetail.updated_at).toLocaleDateString() }}</span>
                </div>
            </div>

            <div class="section">
                <h2>Mô tả vi thể</h2>
                <div class="content description-box">
                    {{ caseDetail.microscopic_description }}
                </div>
            </div>

            <div class="section" v-if="caseDetail.note">
                <h2>Ghi chú</h2>
                <div class="content">
                    {{ caseDetail.note }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: sans-serif;
    color: #333;
}

.back-link {
    display: inline-block;
    margin-bottom: 20px;
    color: #666;
    text-decoration: none;
    font-size: 14px;
}

.back-link:hover {
    color: #000;
}

.detail-card {
    background: #fff;
    border-radius: 8px;
    /* box-shadow: 0 4px 20px rgba(0,0,0,0.05); */
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 20px;
}

.title {
    margin: 0;
    font-size: 28px;
    color: #1a1a1a;
}

.status-badge {
    background: #eef2ff;
    color: #4f46e5;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    background: #f9fafb;
    padding: 20px;
    border-radius: 6px;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 600;
}

.value {
    font-size: 16px;
    font-weight: 500;
}

.section {
    margin-bottom: 30px;
}

.section h2 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #111;
    border-left: 4px solid #4f46e5;
    padding-left: 10px;
}

.content {
    line-height: 1.6;
    font-size: 16px;
    white-space: pre-wrap;
}

.description-box {
    background: #fff;
    border: 1px solid #e5e7eb;
    padding: 20px;
    border-radius: 6px;
}

.loading,
.error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: #666;
}
</style>
