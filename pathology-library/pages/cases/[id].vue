<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSupabaseClient } from "~/composables/useSupabaseClient";
import { useCatalogs } from "~/composables/useCatalogs";
import { useCases } from "~/composables/useCases";
import { useVietnameseFilter } from "~/composables/useVietnameseFilter";
import { usePermissions } from "~/composables/usePermissions";

const { vietnameseFilter } = useVietnameseFilter();

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const supabase = useSupabaseClient();
const { submitForReview, deleteCase } = useCases();
const { organs, diagnoses, tags, loadAll, addDiagnosis } = useCatalogs();
const { isAdmin, canCreateCase } = usePermissions();

const caseDetail = ref<any>(null);
const selectedTagIds = ref<number[]>([]);

const loading = ref(true);
const isEditing = ref(route.query.edit === "true");
const saving = ref(false);

const organName = computed(() => {
  if (!caseDetail.value?.organ_id) return "N/A";
  // Prioritize the joined data
  if (caseDetail.value?.organ?.name) return caseDetail.value.organ.name;
  if (caseDetail.value?.organs?.name) return caseDetail.value.organs.name;
  // Fallback to catalogs
  return (
    organs.value?.find((o: any) => o.id === caseDetail.value.organ_id)?.name ||
    caseDetail.value.organ_id
  );
});

const diagnosisName = computed(() => {
  if (!caseDetail.value?.diagnosis_id) return "N/A";
  // Prioritize the joined data
  if (caseDetail.value?.diagnosis?.name) return caseDetail.value.diagnosis.name;
  if (caseDetail.value?.diagnoses?.name) return caseDetail.value.diagnoses.name;
  // Fallback to catalogs
  return (
    diagnoses.value?.find((d: any) => d.id === caseDetail.value.diagnosis_id)
      ?.name || caseDetail.value.diagnosis_id
  );
});

onMounted(async () => {
  await loadAll();
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Find the case version
    const { data, error } = await supabase
      .from("case_versions")
      .select("*, organ:organs(id, name), diagnosis:diagnoses(id, name)")
      .eq("version_id", id)
      .maybeSingle();

    let dbId = id;
    if (!data) {
      const { data: data2, error: error2 } = await supabase
        .from("case_versions")
        .select("*, organ:organs(id, name), diagnosis:diagnoses(id, name)")
        .eq("id", id)
        .single();
      if (error2) throw error2;
      caseDetail.value = { ...data2 };
      dbId = data2.id;
    } else {
      caseDetail.value = { ...data };
      dbId = data.id;
    }

    // Add to catalogs if missing (so that v-autocomplete can show the name)
    if (caseDetail.value.organ_id) {
      const organData = caseDetail.value.organ || caseDetail.value.organs;
      if (
        organData &&
        !organs.value.some((o: any) => o.id === caseDetail.value.organ_id)
      ) {
        organs.value.push({
          id: caseDetail.value.organ_id,
          name: organData.name,
        });
      }
    }

    if (caseDetail.value.diagnosis_id) {
      const diagData = caseDetail.value.diagnosis || caseDetail.value.diagnoses;
      if (
        diagData &&
        !diagnoses.value.some(
          (d: any) => d.id === caseDetail.value.diagnosis_id,
        )
      ) {
        diagnoses.value.push({
          id: caseDetail.value.diagnosis_id,
          name: diagData.name,
        });
      }
    }

    // Fetch tags
    const { data: tagData } = await supabase
      .from("case_version_tags")
      .select("tag_id")
      .eq("version_id", dbId);

    if (tagData) {
      selectedTagIds.value = tagData.map((t: any) => t.tag_id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const onSave = async () => {
  saving.value = true;
  try {
    let finalDiagnosisId = caseDetail.value.diagnosis_id;
    if (typeof finalDiagnosisId === "object" && finalDiagnosisId !== null) {
      finalDiagnosisId = (finalDiagnosisId as any).id;
      caseDetail.value.diagnosis_id = finalDiagnosisId;
    } else if (
      typeof finalDiagnosisId === "string" &&
      finalDiagnosisId.trim() !== ""
    ) {
      const existing = diagnoses.value.find(
        (d: any) => d.name.toLowerCase() === finalDiagnosisId.toLowerCase(),
      );
      if (existing) {
        finalDiagnosisId = existing.id;
      } else {
        finalDiagnosisId = await addDiagnosis(finalDiagnosisId.trim());
      }
      caseDetail.value.diagnosis_id = finalDiagnosisId;
    }

    const dbId = caseDetail.value.id;
    // Update version
    const { error } = await supabase
      .from("case_versions")
      .update({
        organ_id: caseDetail.value.organ_id,
        diagnosis_id: finalDiagnosisId,
        microscopic_description: caseDetail.value.microscopic_description,
        note: caseDetail.value.note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dbId);

    if (error) throw error;

    // Update tags
    const { error: delError } = await supabase
      .from("case_version_tags")
      .delete()
      .eq("version_id", dbId);
    if (delError) throw delError;

    if (selectedTagIds.value.length > 0) {
      const tagRows = selectedTagIds.value.map((tid) => ({
        version_id: dbId,
        tag_id: tid,
      }));
      const { error: insError } = await supabase
        .from("case_version_tags")
        .insert(tagRows);
      if (insError) throw insError;
    }
  } catch (e: any) {
    throw new Error(e.message || "Lỗi khi lưu");
  } finally {
    saving.value = false;
  }
};

const handleSave = async () => {
  try {
    await onSave();
    alert("Đã lưu nháp");
    isEditing.value = false;
  } catch (e: any) {
    alert(e.message);
  }
};

const handleSubmitReview = async () => {
  if (
    !confirm(
      "Gửi duyệt phiên bản này? Bạn sẽ không thể chỉnh sửa cho đến khi được duyệt hoặc yêu cầu sửa đổi.",
    )
  )
    return;
  try {
    await onSave(); // Ensure latest changes are saved
    await submitForReview(caseDetail.value.id);
    alert("Đã gửi duyệt thành công!");
    router.push("/");
  } catch (e: any) {
    alert("Lỗi gửi duyệt: " + e.message);
  }
};

const handlePublishNow = async () => {
  if (
    !confirm(
      "Xuất bản ngay phiên bản này? Case sẽ hiển thị công khai cho người dùng.",
    )
  )
    return;
  try {
    await onSave(); // Save latest changes first

    const { error } = await supabase
      .from("case_versions")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseDetail.value.id);

    if (error) throw error;
    alert("Đã xuất bản thành công!");
    isEditing.value = false;
    caseDetail.value.status = "published";
  } catch (e: any) {
    alert("Lỗi xuất bản: " + e.message);
  }
};

const handleDelete = async () => {
  if (
    !confirm(
      "Bạn có chắc muốn xóa case này?\nHành động này không thể hoàn tác!",
    )
  )
    return;
  try {
    await deleteCase(caseDetail.value.case_id);
    alert("Đã xóa case thành công!");
    router.push("/");
  } catch (e: any) {
    alert("Lỗi khi xóa: " + e.message);
  }
};

const toggleEdit = () => {
  if (isEditing.value) {
    if (confirm("Hủy bỏ các thay đổi?")) {
      isEditing.value = false;
      loadData(); // reload discard changes
    }
  } else {
    isEditing.value = true;
  }
};
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else-if="!caseDetail" class="error">Không tìm thấy ca bệnh</div>
    <div v-else class="detail-card">
      <div class="actions-header">
        <NuxtLink to="/" class="back-link">← Quay lại danh sách</NuxtLink>
        <div v-if="isAdmin || canCreateCase" class="edit-actions">
          <button v-if="!isEditing" @click="toggleEdit" class="btn btn-edit">
            Chỉnh sửa
          </button>
          <button v-else @click="toggleEdit" class="btn btn-cancel">Hủy</button>
        </div>
      </div>

      <template v-if="!isEditing">
        <!-- DETAIL VIEW -->
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
            <span class="value">{{
              new Date(caseDetail.updated_at).toLocaleDateString()
            }}</span>
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
      </template>
      <template v-else>
        <!-- EDIT VIEW -->
        <h1 class="page-title">
          Biên tập: {{ caseDetail.id?.substring(0, 8) }}...
        </h1>
        <div class="status-bar">
          Trạng thái hiện tại: <strong>{{ caseDetail.status }}</strong>
        </div>

        <div class="form-layout">
          <div class="main-column">
            <div class="form-group">
              <label>Mô tả vi thể</label>
              <textarea
                v-model="caseDetail.microscopic_description"
                rows="15"
                class="input-control"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Ghi chú</label>
              <textarea
                v-model="caseDetail.note"
                rows="3"
                class="input-control"
              ></textarea>
            </div>
          </div>

          <div class="side-column">
            <div class="panel">
              <div class="form-group">
                <label>Cơ quan</label>
                <v-autocomplete
                  v-model="caseDetail.organ_id"
                  :items="organs"
                  item-title="name"
                  item-value="id"
                  placeholder="Chọn cơ quan"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  :custom-filter="vietnameseFilter"
                />
              </div>

              <div class="form-group">
                <label>Chẩn đoán</label>
                <v-combobox
                  v-model="caseDetail.diagnosis_id"
                  :items="diagnoses"
                  item-title="name"
                  item-value="id"
                  placeholder="Chọn hoặc nhập một chẩn đoán mới"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  :custom-filter="vietnameseFilter"
                />
              </div>

              <div class="form-group">
                <label>Tags</label>
                <TagSelector v-model="selectedTagIds" :tags="tags" />
              </div>
            </div>

            <div class="actions">
              <button
                @click="handleSave"
                :disabled="saving"
                class="btn btn-save"
              >
                {{ saving ? "Đang lưu..." : "Lưu Nháp" }}
              </button>
              <button
                @click="handleSubmitReview"
                :disabled="saving"
                class="btn btn-submit"
              >
                Gửi Duyệt
              </button>
              <button
                v-if="isAdmin"
                @click="handlePublishNow"
                :disabled="saving"
                class="btn btn-publish"
              >
                🚀 Xuất bản ngay
              </button>
              <button
                v-if="isAdmin"
                @click="handleDelete"
                :disabled="saving"
                class="btn btn-delete"
              >
                🗑 Xóa case
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Mix of styles from both components */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: sans-serif;
  color: #333;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-link {
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

/* Edit View styles */
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

@media (max-width: 768px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
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

.btn-edit {
  background: #10b981;
  color: white;
  padding: 8px 16px;
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
  padding: 8px 16px;
  color: #333;
}

.btn-delete {
  background: #dc2626;
  color: white;
}

.btn-delete:hover {
  background: #b91c1c;
}
</style>
