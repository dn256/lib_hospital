<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useCases } from "~/composables/useCases";
import { useCatalogs } from "~/composables/useCatalogs";
import { useAuth } from "~/composables/useAuth";
import { usePermissions } from "~/composables/usePermissions";
import { useVietnameseFilter } from "~/composables/useVietnameseFilter";

definePageMeta({ middleware: "auth" });

const { vietnameseFilter } = useVietnameseFilter();

const router = useRouter();
const route = useRoute();
const embedded = computed(() => route.query.embed === "1");
const { search, count } = useCases();
const { organs, diagnoses, tags, loadAll } = useCatalogs();
const { user, profile, signOut } = useAuth();
const { canAccessAdmin, canCreateCase } = usePermissions();
const supabase = useSupabaseClient();

// Navigation functions
const goToLogin = () => router.push("/login");
const goToNewCase = () => router.push("/cases/new");
const goToAdmin = () => router.push("/admin");
const handleLogout = async () => {
  await signOut();
  router.push("/login");
};

// Search state
const keyword = ref("");
const selectedOrgan = ref<number | null>(null);
const selectedDiagnosis = ref<number | null>(null);
const selectedTag = ref<number | null>(null);
const rows = ref<any[]>([]);
const loading = ref(false);
const showResults = ref(false);

// Stats
const stats = ref({
  totalCases: 500,
  totalOrgans: 20,
  totalDiagnoses: 100,
});

// UI State
const mounted = ref(false);
const activeCategory = ref<number | null>(null);

onMounted(async () => {
  mounted.value = true;
  await loadAll();

  let casesCount = 500;
  try {
    const res = await count({ status: ["published"] });
    if (res !== null) casesCount = res;
  } catch (e) {
    console.error(e);
  }

  stats.value = {
    totalCases: casesCount,
    totalOrgans: organs.value?.length || 20,
    totalDiagnoses: diagnoses.value?.length || 100,
  };
});

let debounceTimer: any = null;

const performSearch = async () => {
  if (
    !keyword.value &&
    !selectedOrgan.value &&
    !selectedDiagnosis.value &&
    !selectedTag.value
  ) {
    rows.value = [];
    showResults.value = false;
    return;
  }

  loading.value = true;
  showResults.value = true;

  try {
    rows.value =
      (await search({
        keyword: keyword.value,
        organIds: selectedOrgan.value ? [selectedOrgan.value] : undefined,
        diagnosisIds: selectedDiagnosis.value
          ? [selectedDiagnosis.value]
          : undefined,
        tagIds: selectedTag.value ? [selectedTag.value] : undefined,
        status: ["published"],
        limit: 50,
        offset: 0,
      })) || [];

    // Fetch missing catalogs to avoid miss data
    if (rows.value.length > 0) {
      const missingOrganIds = [
        ...new Set(rows.value.map((r: any) => r.organ_id).filter(Boolean)),
      ].filter((id) => !organs.value.some((o: any) => o.id === id));

      if (missingOrganIds.length > 0) {
        const { data } = await supabase
          .from("organs")
          .select("id, name")
          .in("id", missingOrganIds as number[]);
        if (data) organs.value.push(...data);
      }

      const missingDiagIds = [
        ...new Set(rows.value.map((r: any) => r.diagnosis_id).filter(Boolean)),
      ].filter((id) => !diagnoses.value.some((d: any) => d.id === id));

      if (missingDiagIds.length > 0) {
        const { data } = await supabase
          .from("diagnoses")
          .select("id, name")
          .in("id", missingDiagIds as number[]);
        if (data) diagnoses.value.push(...data);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const scrollToResults = () => {
  nextTick(() => {
    const el = document.getElementById("results");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const handleQuickSearch = async () => {
  await performSearch();
  scrollToResults();
};

watch([keyword, selectedOrgan, selectedDiagnosis, selectedTag], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performSearch();
  }, 400);
});

const clearFilters = () => {
  keyword.value = "";
  selectedOrgan.value = null;
  selectedDiagnosis.value = null;
  selectedTag.value = null;
  rows.value = [];
  showResults.value = false;
};

const hasActiveFilters = computed(() => {
  return (
    keyword.value ||
    selectedOrgan.value ||
    selectedDiagnosis.value ||
    selectedTag.value
  );
});

const getOrganName = (rowOrId: any) => {
  if (!rowOrId) return "N/A";
  const id = typeof rowOrId === "object" ? rowOrId.organ_id : rowOrId;
  if (typeof rowOrId === "object") {
    if (rowOrId.organ_name) return rowOrId.organ_name;
    if (rowOrId.organ?.name) return rowOrId.organ.name;
    if (rowOrId.organs?.name) return rowOrId.organs.name;
  }
  return organs.value?.find((o: any) => o.id === id)?.name || id || "N/A";
};

const getDiagnosisName = (rowOrId: any) => {
  if (!rowOrId) return "N/A";
  const id = typeof rowOrId === "object" ? rowOrId.diagnosis_id : rowOrId;
  if (typeof rowOrId === "object") {
    if (rowOrId.diagnosis_name) return rowOrId.diagnosis_name;
    if (rowOrId.diagnosis?.name) return rowOrId.diagnosis.name;
    if (rowOrId.diagnoses?.name) return rowOrId.diagnoses.name;
  }
  return diagnoses.value?.find((d: any) => d.id === id)?.name || id || "N/A";
};

// Preview dialog
const previewDialog = ref(false);
const previewCase = ref<any>(null);
const copiedField = ref("");

const openPreview = async (row: any) => {
  previewCase.value = row;
  previewDialog.value = true;
  copiedField.value = "";

  const { data, error } = await supabase
    .from("case_versions")
    .select("note")
    .eq("id", row.version_id)
    .single();
  if (error) throw error;
  previewCase.value.note = data.note;
};

const copyText = async (text: string, field: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedField.value = field;
    setTimeout(() => {
      copiedField.value = "";
    }, 2000);
  } catch (e) {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copiedField.value = field;
    setTimeout(() => {
      copiedField.value = "";
    }, 2000);
  }
};

// Featured categories with rich data
const featuredCategories = [
  {
    icon: "mdi-heart-pulse",
    title: "Tim mạch",
    description: "Bệnh lý tim và mạch máu",
    count: 45,
    color: "#e74c3c",
  },
  {
    icon: "mdi-lungs",
    title: "Hô hấp",
    description: "Phổi và đường hô hấp",
    count: 38,
    color: "#3498db",
  },
  {
    icon: "mdi-stomach",
    title: "Tiêu hóa",
    description: "Dạ dày, ruột, gan, mật",
    count: 67,
    color: "#27ae60",
  },
  {
    icon: "mdi-brain",
    title: "Thần kinh",
    description: "Não và hệ thần kinh",
    count: 29,
    color: "#9b59b6",
  },
  {
    icon: "mdi-bone",
    title: "Cơ xương khớp",
    description: "Xương, khớp và cơ",
    count: 52,
    color: "#f39c12",
  },
  {
    icon: "mdi-water",
    title: "Tiết niệu",
    description: "Thận và đường tiết niệu",
    count: 41,
    color: "#1abc9c",
  },
];

// Recent/Featured specimens
const featuredSpecimens = [
  {
    id: "SP001",
    title: "Carcinoma tế bào vảy phổi",
    organ: "Phổi",
    views: 1250,
  },
  {
    id: "SP002",
    title: "Adenocarcinoma đại tràng",
    organ: "Đại tràng",
    views: 980,
  },
  { id: "SP003", title: "Viêm gan virus B mạn", organ: "Gan", views: 856 },
  { id: "SP004", title: "U lympho Hodgkin", organ: "Hạch", views: 723 },
];

// Quick stats for trust
const trustIndicators = [
  { icon: "mdi-shield-check", label: "Được chuyên gia kiểm duyệt" },
  { icon: "mdi-update", label: "Cập nhật hàng tuần" },
  { icon: "mdi-account-group", label: "5000+ người dùng" },
];
</script>

<template>
  <div class="pathology-library" :class="{ embedded }">
    <!-- Animated Background - CSS based, no WebGL -->
    <AnimatedBackground />

    <!-- Gradient Overlay -->
    <div class="gradient-overlay"></div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sticky Header -->
      <header v-if="!embedded" class="site-header">
        <v-container fluid class="px-6 px-md-12">
          <div class="d-flex align-center justify-space-between">
            <!-- Logo -->
            <div class="d-flex align-center">
              <div class="logo-icon">
                <v-icon color="white" size="22">mdi-microscope</v-icon>
              </div>
              <div class="logo-text ml-3">
                <span class="logo-name">PathologyLib</span>
                <span class="logo-tagline">Thư viện Y học số</span>
              </div>
            </div>

            <!-- Navigation -->
            <nav class="main-nav d-none d-md-flex">
              <NuxtLink to="/" class="nav-item">
                <v-icon size="18" class="mr-2">mdi-home</v-icon>
                Trang chủ
              </NuxtLink>
              <a href="#categories" class="nav-item">
                <v-icon size="18" class="mr-2">mdi-folder-multiple</v-icon>
                Danh mục
              </a>
              <NuxtLink to="/atlas" class="nav-item">
                <v-icon size="18" class="mr-2">mdi-microscope</v-icon>
                Atlas GPB
              </NuxtLink>
              <a href="#" class="nav-item">
                <v-icon size="18" class="mr-2">mdi-information</v-icon>
                Giới thiệu
              </a>
            </nav>

            <!-- Actions -->
            <div class="header-actions d-flex align-center gap-3">
              <v-btn icon variant="text" color="white" class="d-none d-sm-flex">
                <v-icon>mdi-bell-outline</v-icon>
              </v-btn>
              <!-- User is logged in -->
              <template v-if="user">
                <!-- Admin Button (only for authorized users) -->
                <v-btn
                  v-if="canAccessAdmin"
                  color="warning"
                  variant="flat"
                  rounded="pill"
                  class="mr-2 d-none d-md-flex"
                  @click="goToAdmin"
                >
                  <v-icon start size="18">mdi-shield-crown</v-icon>
                  Quản lý
                </v-btn>
                <v-btn
                  v-if="canCreateCase"
                  color="primary"
                  variant="flat"
                  rounded="pill"
                  class="mr-2"
                  @click="goToNewCase"
                >
                  <v-icon start size="18">mdi-plus</v-icon>
                  Tạo mới
                </v-btn>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      color="accent"
                      variant="flat"
                      rounded="pill"
                      v-bind="props"
                    >
                      <v-icon start size="18">mdi-account-circle</v-icon>
                      {{ profile?.display_name || user.email?.split("@")[0] }}
                      <v-icon end size="16">mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <!-- Admin link in menu (for mobile) -->
                    <v-list-item v-if="canAccessAdmin" @click="goToAdmin">
                      <template #prepend>
                        <v-icon size="18" color="warning"
                          >mdi-shield-crown</v-icon
                        >
                      </template>
                      <v-list-item-title>Quản lý thư viện</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="canCreateCase" @click="goToNewCase">
                      <template #prepend>
                        <v-icon size="18">mdi-plus-box</v-icon>
                      </template>
                      <v-list-item-title>Tạo ca bệnh mới</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="handleLogout">
                      <template #prepend>
                        <v-icon size="18" color="error">mdi-logout</v-icon>
                      </template>
                      <v-list-item-title class="text-error"
                        >Đăng xuất</v-list-item-title
                      >
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
              <!-- User is not logged in -->
              <v-btn
                v-else
                color="accent"
                variant="flat"
                rounded="pill"
                class="login-btn"
                @click="goToLogin"
              >
                <v-icon start size="18">mdi-account-circle</v-icon>
                Đăng nhập
              </v-btn>
            </div>
          </div>
        </v-container>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <v-container>
          <v-row align="center" class="hero-row">
            <!-- Left: Content -->
            <v-col cols="12" lg="6" class="hero-content">
              <!-- Trust badges -->
              <div class="trust-badges mb-6 animate-fade-in">
                <div
                  class="trust-badge"
                  v-for="(t, i) in trustIndicators"
                  :key="i"
                >
                  <v-icon size="14" color="accent" class="mr-1">{{
                    t.icon
                  }}</v-icon>
                  <span>{{ t.label }}</span>
                </div>
              </div>

              <h1 class="hero-title animate-slide-up">
                Thư viện<br />
                <span class="highlight">Mô Bệnh Học</span>
              </h1>

              <p class="hero-description animate-slide-up delay-1">
                Khám phá hơn <strong>500+</strong> mẫu bệnh phẩm vi thể được
                phân loại theo hệ thống cơ quan. Công cụ tra cứu chuyên nghiệp
                dành cho bác sĩ, sinh viên Y khoa và nhà nghiên cứu.
              </p>

              <!-- Quick Search -->
              <div class="quick-search animate-slide-up delay-2">
                <v-text-field
                  v-model="keyword"
                  placeholder="Tìm kiếm mẫu bệnh, chẩn đoán, mô tả..."
                  variant="solo"
                  bg-color="white"
                  hide-details
                  rounded="pill"
                  class="search-field"
                  @keyup.enter="handleQuickSearch"
                >
                  <template #prepend-inner>
                    <v-icon color="grey" class="ml-2">mdi-magnify</v-icon>
                  </template>
                  <template #append-inner>
                    <v-btn
                      color="primary"
                      rounded="pill"
                      class="search-btn"
                      size="small"
                      @click="handleQuickSearch"
                    >
                      Tìm kiếm
                    </v-btn>
                  </template>
                </v-text-field>

                <!-- Popular searches -->
                <div class="popular-searches mt-4">
                  <span class="label">Phổ biến:</span>
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="white"
                    class="mx-1"
                    >Ung thư phổi</v-chip
                  >
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="white"
                    class="mx-1"
                    >Viêm gan</v-chip
                  >
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="white"
                    class="mx-1"
                    >U lympho</v-chip
                  >
                </div>
              </div>

              <!-- Stats Row -->
              <div class="stats-row animate-slide-up delay-3">
                <div class="stat-box">
                  <div class="stat-value">{{ stats.totalCases }}+</div>
                  <div class="stat-label">Mẫu bệnh phẩm</div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-box">
                  <div class="stat-value">{{ stats.totalOrgans }}+</div>
                  <div class="stat-label">Hệ cơ quan</div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-box">
                  <div class="stat-value">{{ stats.totalDiagnoses }}+</div>
                  <div class="stat-label">Chẩn đoán</div>
                </div>
              </div>
            </v-col>

            <!-- Right: Featured Cards -->
            <v-col cols="12" lg="6" class="hero-visual d-none d-lg-block">
              <div class="featured-grid">
                <div
                  v-for="(specimen, idx) in featuredSpecimens"
                  :key="specimen.id"
                  class="specimen-card animate-pop"
                  :style="{ animationDelay: `${0.3 + idx * 0.1}s` }"
                >
                  <div class="specimen-icon">
                    <v-icon color="white">mdi-flask</v-icon>
                  </div>
                  <div class="specimen-info">
                    <div class="specimen-title">{{ specimen.title }}</div>
                    <div class="specimen-meta">
                      <v-icon size="12">mdi-folder</v-icon>
                      {{ specimen.organ }}
                      <span class="dot">•</span>
                      <v-icon size="12">mdi-eye</v-icon>
                      {{ specimen.views }}
                    </div>
                  </div>
                  <v-icon size="20" color="white" class="arrow-icon"
                    >mdi-chevron-right</v-icon
                  >
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Categories Section -->
      <section class="categories-section" id="categories">
        <v-container>
          <div class="section-header">
            <div>
              <h2 class="section-title">Khám phá theo Hệ cơ quan</h2>
              <p class="section-subtitle">
                Chọn danh mục để xem các mẫu bệnh phẩm liên quan
              </p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              append-icon="mdi-arrow-right"
              class="d-none d-sm-flex"
            >
              Xem tất cả
            </v-btn>
          </div>

          <v-row class="category-grid">
            <v-col
              v-for="(cat, index) in featuredCategories"
              :key="index"
              cols="6"
              sm="4"
              md="2"
            >
              <div
                class="category-card"
                :class="{ active: activeCategory === index }"
                @mouseenter="activeCategory = index"
                @mouseleave="activeCategory = null"
              >
                <div class="category-icon" :style="{ background: cat.color }">
                  <v-icon color="white" size="28">{{ cat.icon }}</v-icon>
                </div>
                <div class="category-name">{{ cat.title }}</div>
                <div class="category-count">{{ cat.count }} mẫu</div>
                <div class="category-arrow">
                  <v-icon size="20">mdi-arrow-right</v-icon>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Advanced Search Section -->
      <section class="search-section">
        <v-container>
          <v-card class="search-panel" elevation="8">
            <v-card-text class="pa-6 pa-md-8">
              <div class="d-flex align-center mb-6">
                <div class="search-panel-icon">
                  <v-icon color="white" size="24">mdi-filter-variant</v-icon>
                </div>
                <div class="ml-4">
                  <div class="text-h6 font-weight-bold">Tìm kiếm nâng cao</div>
                  <div class="text-caption text-grey">
                    Lọc theo nhiều tiêu chí để tìm chính xác mẫu bệnh phẩm bạn
                    cần
                  </div>
                </div>
              </div>

              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="keyword"
                    label="Từ khóa"
                    placeholder="Nhập từ khóa..."
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-autocomplete
                    v-model="selectedOrgan"
                    :items="organs"
                    item-title="name"
                    item-value="id"
                    label="Cơ quan"
                    prepend-inner-icon="mdi-human"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                    :custom-filter="vietnameseFilter"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-autocomplete
                    v-model="selectedDiagnosis"
                    :items="diagnoses"
                    item-title="name"
                    item-value="id"
                    label="Chẩn đoán"
                    prepend-inner-icon="mdi-bacteria"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                    :custom-filter="vietnameseFilter"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn
                    color="primary"
                    size="large"
                    block
                    rounded="lg"
                    :loading="loading"
                    @click="performSearch"
                  >
                    <v-icon start>mdi-magnify</v-icon>
                    Tìm kiếm
                  </v-btn>
                </v-col>
              </v-row>

              <div v-if="hasActiveFilters" class="mt-4 d-flex align-center">
                <v-chip
                  color="error"
                  variant="tonal"
                  size="small"
                  @click="clearFilters"
                  prepend-icon="mdi-close"
                >
                  Xóa tất cả bộ lọc
                </v-chip>
                <v-chip
                  color="primary"
                  variant="flat"
                  size="small"
                  class="ml-2"
                >
                  {{ rows.length }} kết quả
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-container>
      </section>

      <!-- Results Section -->
      <section v-if="showResults" id="results" class="results-section">
        <v-container>
          <div class="section-header mb-6">
            <h2 class="section-title">Kết quả tìm kiếm</h2>
          </div>

          <v-row v-if="!loading && rows.length > 0">
            <v-col
              v-for="(row, i) in rows"
              :key="row.version_id || row.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card
                class="result-card"
                elevation="2"
                @click="openPreview(row)"
              >
                <div class="result-header">
                  <v-chip size="small" color="teal" variant="tonal">
                    <v-icon start size="14">mdi-human</v-icon>
                    {{ getOrganName(row) }}
                  </v-chip>
                </div>
                <v-card-text class="result-body">
                  <div class="result-diagnosis">
                    {{ getDiagnosisName(row) }}
                  </div>
                  <p class="result-description">
                    {{ row.microscopic_description?.substring(0, 100) }}...
                  </p>
                </v-card-text>
                <v-card-actions class="result-actions">
                  <NuxtLink :to="`/cases/${row.version_id}`" @click.stop>
                    <v-btn
                      variant="text"
                      color="primary"
                      size="small"
                      append-icon="mdi-arrow-right"
                    >
                      Xem chi tiết
                    </v-btn>
                  </NuxtLink>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>

          <div
            v-if="!loading && rows.length === 0"
            class="empty-state text-center py-12"
          >
            <v-icon size="80" color="grey-lighten-2" class="mb-4"
              >mdi-folder-search</v-icon
            >
            <h3 class="text-h6 text-grey">Không tìm thấy kết quả phù hợp</h3>
            <p class="text-body-2 text-grey-darken-1">
              Hãy thử với từ khóa khác hoặc mở rộng bộ lọc
            </p>
          </div>
        </v-container>
      </section>

      <!-- Quick Preview Dialog -->
      <v-dialog v-model="previewDialog" max-width="700" scrollable>
        <v-card v-if="previewCase" class="preview-dialog">
          <v-card-title class="preview-title">
            <div class="d-flex align-center gap-2">
              <span>Xem nhanh</span>
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="previewDialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- Organ & Diagnosis chips -->
            <div class="d-flex flex-wrap gap-2 mb-5 justify-space-between">
              <v-chip color="teal" variant="tonal" size="small">
                <v-icon start size="14">mdi-human</v-icon>
                {{ getOrganName(previewCase) }}
              </v-chip>
              <!-- <v-chip color="deep-purple" variant="tonal" size="small">
                                <v-icon start size="14">mdi-bacteria</v-icon>
                                {{ getDiagnosisName(previewCase) }}
                            </v-chip> -->
            </div>

            <!-- Diagnosis -->
            <div class="preview-section">
              <div class="preview-section-header">
                <div class="preview-label">
                  <v-icon size="16" class="mr-1">mdi-stethoscope</v-icon>
                  Chẩn đoán
                </div>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  :color="copiedField === 'diagnosis' ? 'success' : 'primary'"
                  @click="copyText(getDiagnosisName(previewCase), 'diagnosis')"
                >
                  <v-icon start size="14">
                    {{
                      copiedField === "diagnosis"
                        ? "mdi-check"
                        : "mdi-content-copy"
                    }}
                  </v-icon>
                  {{ copiedField === "diagnosis" ? "Đã copy!" : "Copy" }}
                </v-btn>
              </div>
              <div class="preview-content">
                {{ getDiagnosisName(previewCase) }}
              </div>
            </div>

            <!-- Microscopic Description -->
            <div class="preview-section">
              <div class="preview-section-header">
                <div class="preview-label">
                  <v-icon size="16" class="mr-1">mdi-microscope</v-icon>
                  Mô tả vi thể
                </div>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  :color="copiedField === 'description' ? 'success' : 'primary'"
                  @click="
                    copyText(
                      previewCase.microscopic_description || '',
                      'description',
                    )
                  "
                >
                  <v-icon start size="14">
                    {{
                      copiedField === "description"
                        ? "mdi-check"
                        : "mdi-content-copy"
                    }}
                  </v-icon>
                  {{ copiedField === "description" ? "Đã copy!" : "Copy" }}
                </v-btn>
              </div>
              <div class="preview-content preview-description">
                {{ previewCase.microscopic_description || "Không có mô tả" }}
              </div>
            </div>

            <!-- Note -->
            <div class="preview-section">
              <div class="preview-section-header">
                <div class="preview-label">
                  <v-icon size="16" class="mr-1">mdi-note</v-icon>
                  Ghi chú
                </div>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  :color="copiedField === 'note' ? 'success' : 'primary'"
                  @click="copyText(previewCase.note || '', 'note')"
                >
                  <v-icon start size="14">
                    {{
                      copiedField === "note" ? "mdi-check" : "mdi-content-copy"
                    }}
                  </v-icon>
                  {{ copiedField === "note" ? "Đã copy!" : "Copy" }}
                </v-btn>
              </div>
              <div class="preview-content preview-description">
                {{ previewCase.note || "Không có ghi chú" }}
              </div>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn
              variant="tonal"
              size="small"
              :color="copiedField === 'all' ? 'success' : 'secondary'"
              @click="
                copyText(
                  `${getDiagnosisName(previewCase)}\n${previewCase.microscopic_description || ''}\n${previewCase.note || ''}`,
                  'all',
                )
              "
            >
              <v-icon start size="16">
                {{
                  copiedField === "all" ? "mdi-check-all" : "mdi-content-copy"
                }}
              </v-icon>
              {{ copiedField === "all" ? "Đã copy tất cả!" : "Copy tất cả" }}
            </v-btn>
            <v-spacer />
            <v-btn variant="text" @click="previewDialog = false">Đóng</v-btn>
            <NuxtLink :to="`/cases/${previewCase.version_id}`">
              <v-btn
                color="primary"
                variant="flat"
                @click="previewDialog = false"
              >
                <v-icon start>mdi-arrow-right</v-icon>
                Xem chi tiết
              </v-btn>
            </NuxtLink>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- CTA Section -->
      <section class="cta-section">
        <v-container>
          <v-card class="cta-card" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="8" class="pa-8 pa-md-12">
                <div class="cta-badge mb-4">
                  <v-icon size="16" class="mr-2">mdi-star</v-icon>
                  Dành cho chuyên gia Y tế
                </div>
                <h2 class="cta-title">Đăng ký để truy cập đầy đủ</h2>
                <p class="cta-description">
                  Nhận quyền truy cập không giới hạn vào tất cả mẫu bệnh phẩm,
                  công cụ so sánh tiên tiến và cập nhật hàng tuần.
                </p>
                <div class="cta-actions">
                  <v-btn
                    color="white"
                    variant="flat"
                    rounded="pill"
                    size="large"
                    class="mr-3"
                  >
                    <v-icon start>mdi-account-plus</v-icon>
                    Đăng ký miễn phí
                  </v-btn>
                  <v-btn
                    color="white"
                    variant="outlined"
                    rounded="pill"
                    size="large"
                  >
                    Tìm hiểu thêm
                  </v-btn>
                </div>
              </v-col>
              <v-col cols="12" md="4" class="cta-visual d-none d-md-flex">
                <v-icon size="200" class="cta-icon">mdi-microscope</v-icon>
              </v-col>
            </v-row>
          </v-card>
        </v-container>
      </section>

      <!-- Footer -->
      <footer v-if="!embedded" class="site-footer">
        <v-container>
          <v-row>
            <v-col cols="12" md="4">
              <div class="footer-brand">
                <div class="d-flex align-center mb-4">
                  <div class="footer-logo">
                    <v-icon color="white" size="20">mdi-microscope</v-icon>
                  </div>
                  <span class="footer-name ml-3">PathologyLib</span>
                </div>
                <p class="footer-desc">
                  Thư viện mô bệnh học số hàng đầu Việt Nam. Công cụ tra cứu
                  chuyên nghiệp cho cộng đồng Y học.
                </p>
              </div>
            </v-col>
            <v-col cols="6" md="2">
              <div class="footer-links">
                <div class="footer-title">Khám phá</div>
                <a href="#">Danh mục</a>
                <a href="#">Mẫu mới nhất</a>
                <a href="#">Phổ biến</a>
              </div>
            </v-col>
            <v-col cols="6" md="2">
              <div class="footer-links">
                <div class="footer-title">Hỗ trợ</div>
                <a href="#">Hướng dẫn</a>
                <a href="#">FAQ</a>
                <a href="#">Liên hệ</a>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="footer-links">
                <div class="footer-title">Theo dõi chúng tôi</div>
                <div class="social-links">
                  <v-btn
                    icon
                    variant="tonal"
                    color="white"
                    size="small"
                    class="mr-2"
                  >
                    <v-icon>mdi-facebook</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="tonal"
                    color="white"
                    size="small"
                    class="mr-2"
                  >
                    <v-icon>mdi-youtube</v-icon>
                  </v-btn>
                  <v-btn icon variant="tonal" color="white" size="small">
                    <v-icon>mdi-linkedin</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
          <v-divider class="my-6" color="white" opacity="0.2"></v-divider>
          <div class="footer-bottom text-center">
            <p>© 2025 PathologyLib. Bảo lưu mọi quyền.</p>
          </div>
        </v-container>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ===========================
   BASE & LAYOUT
   =========================== */
.pathology-library {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a365d 100%);
}

.gradient-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(
      circle at 20% 80%,
      rgba(201, 162, 39, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(45, 74, 62, 0.2) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 10;
}

/* ===========================
   HEADER
   =========================== */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 16px 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #c9a227, #d4af37);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-family: "Crimson Pro", serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.logo-tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.5px;
}

.main-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.login-btn {
  font-weight: 600;
}

/* ===========================
   HERO SECTION
   =========================== */
.hero-section {
  padding-top: 140px;
  padding-bottom: 60px;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.pathology-library.embedded .hero-section {
  min-height: 720px;
  padding-top: 38px;
}

.pathology-library.embedded .hero-content {
  padding-top: 8px;
}

.hero-content {
  padding-right: 40px;
}

.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

.hero-title {
  font-family: "Crimson Pro", serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: white;
  line-height: 1.1;
  margin-bottom: 24px;
}

.hero-title .highlight {
  background: linear-gradient(135deg, #c9a227, #f6d365);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  margin-bottom: 32px;
  max-width: 500px;
}

.hero-description strong {
  color: #c9a227;
}

/* Quick Search */
.quick-search {
  max-width: 520px;
  margin-bottom: 40px;
}

.search-field {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.search-field :deep(.v-field) {
  padding-right: 8px;
}

.search-btn {
  padding: 0 20px !important;
}

.popular-searches {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.popular-searches .label {
  margin-right: 8px;
}

/* Stats Row */
.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: fit-content;
}

.stat-box {
  text-align: center;
}

.stat-value {
  font-family: "Crimson Pro", serif;
  font-size: 2rem;
  font-weight: 700;
  color: #c9a227;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* Featured Grid */
.featured-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 40px;
}

.specimen-card {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.specimen-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
}

.specimen-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #c9a227, #d4af37);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.specimen-info {
  flex: 1;
  margin-left: 16px;
}

.specimen-title {
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.specimen-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.specimen-meta .dot {
  opacity: 0.5;
}

.arrow-icon {
  opacity: 0.5;
  transition: all 0.3s ease;
}

.specimen-card:hover .arrow-icon {
  opacity: 1;
  transform: translateX(4px);
}

/* ===========================
   CATEGORIES SECTION
   =========================== */
.categories-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.02);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.section-title {
  font-family: "Crimson Pro", serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}

.category-card {
  text-align: center;
  padding: 28px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.category-card:hover,
.category-card.active {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-8px);
  border-color: rgba(201, 162, 39, 0.5);
}

.category-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.category-card:hover .category-icon {
  transform: scale(1.1);
}

.category-name {
  font-weight: 600;
  color: white;
  font-size: 1rem;
  margin-bottom: 4px;
}

.category-count {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.category-arrow {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
  color: #c9a227;
}

.category-card:hover .category-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ===========================
   SEARCH SECTION
   =========================== */
.search-section {
  padding: 60px 0;
}

.search-panel {
  background: white;
  border-radius: 24px !important;
}

.search-panel-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1a365d, #2d4a3e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===========================
   RESULTS SECTION
   =========================== */
.results-section {
  padding: 40px 0 80px;
}

.result-card {
  background: white;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
}

.result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
}

.result-header {
  padding: 16px 16px 0;
  display: flex;
  justify-content: space-between;
}

.result-description {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
}

/* ===========================
   CTA SECTION
   =========================== */
.cta-section {
  padding: 60px 0 80px;
}

.cta-card {
  background: linear-gradient(135deg, #1a365d, #2d4a3e);
  border-radius: 24px !important;
  overflow: hidden;
}

.cta-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: rgba(201, 162, 39, 0.2);
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #c9a227;
}

.cta-title {
  font-family: "Crimson Pro", serif;
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

.cta-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin-bottom: 24px;
  max-width: 450px;
}

.cta-visual {
  justify-content: center;
  align-items: center;
}

.cta-icon {
  color: rgba(255, 255, 255, 0.1);
}

/* ===========================
   FOOTER
   =========================== */
.site-footer {
  padding: 60px 0 40px;
  background: rgba(0, 0, 0, 0.3);
}

.footer-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #c9a227, #d4af37);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-name {
  font-family: "Crimson Pro", serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.footer-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-title {
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #c9a227;
}

.footer-bottom {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ===========================
   ANIMATIONS
   =========================== */
.animate-fade-in {
  animation: fadeIn 0.8s ease forwards;
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(30px);
  animation: slideUp 0.8s ease forwards;
}

.animate-slide-up.delay-1 {
  animation-delay: 0.15s;
}

.animate-slide-up.delay-2 {
  animation-delay: 0.3s;
}

.animate-slide-up.delay-3 {
  animation-delay: 0.45s;
}

.animate-pop {
  opacity: 0;
  transform: scale(0.95);
  animation: popIn 0.5s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ===========================
   RESPONSIVE
   =========================== */
@media (max-width: 960px) {
  .hero-content {
    padding-right: 0;
    text-align: center;
  }

  .trust-badges {
    justify-content: center;
  }

  .hero-description {
    margin-left: auto;
    margin-right: auto;
  }

  .quick-search {
    margin-left: auto;
    margin-right: auto;
  }

  .stats-row {
    margin: 0 auto;
  }

  .popular-searches {
    text-align: center;
  }
}

/* ===========================
   PREVIEW DIALOG
   =========================== */
.result-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 14px !important;
  overflow: hidden;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
}

.result-header {
  padding: 16px 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-body {
  padding: 12px 20px 16px !important;
}

.result-diagnosis {
  font-family: "Crimson Pro", serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: #1a365d;
  margin-bottom: 10px;
  line-height: 1.4;
}

.result-description {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #4a5568;
  margin: 0;
}

.result-actions {
  padding: 8px 16px 12px;
  justify-content: flex-end;
}

.preview-dialog {
  border-radius: 16px !important;
}

.preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  font-family: "Crimson Pro", serif;
  font-size: 1.2rem;
}

.preview-section {
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.preview-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.preview-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: #1a365d;
}

.preview-content {
  padding: 16px;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #333;
  user-select: text;
}

.preview-description {
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
