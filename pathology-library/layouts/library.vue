<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { libraryModules } from '~/utils/libraryModules'

const route = useRoute()
const router = useRouter()
const { user, profile, signOut } = useAuth()
const { canAccessAdmin, canCreateCase } = usePermissions()
const mobileMenuOpen = ref(false)
const embedded = computed(() => route.query.embed === '1')
const isWorkspace = computed(() => route.path === '/workspace')
const isLibrary = computed(() => route.path === '/library')
const showSharedBackground = computed(() => !embedded.value && route.path === '/')
const { locale, english, label } = useLibraryLanguage()
const languageKey = 'pathologylib-language'
onMounted(() => {
  try {
    if (localStorage.getItem(languageKey) === 'en') locale.value = 'en'
  } catch {
    // Language selection remains available for the current page.
  }
})
const changeLanguage = () => {
  locale.value = english.value ? 'vi' : 'en'
  try {
    localStorage.setItem(languageKey, locale.value)
  } catch {
    // Browser storage may be disabled.
  }
}

const navItems = computed(() => [
  { title: label('Tra cứu', 'Search'), icon: 'mdi-magnify', to: '/search' },
  ...libraryModules.slice(0, 4).map(module => ({
    title: label(module.vi, module.en),
    icon: module.icon,
    to: module.path,
  })),
  { title: label('Đa nhiệm', 'Workspace'), icon: 'mdi-view-split-vertical', to: '/workspace' },
])
const references = computed(() => libraryModules.slice(4).map(module => ({
  title: label(module.vi, module.en),
  icon: module.icon,
  to: module.path,
})))
const mobileItems = computed(() => [
  { title: label('Trang chủ', 'Home'), icon: 'mdi-home-outline', to: '/' },
  ...navItems.value,
  ...references.value,
])

const displayName = computed(() => profile.value?.display_name || user.value?.email?.split('@')[0] || 'Người học')
const isActive = (to: string) => {
  const [path, query] = to.split('?')
  if (route.path !== path) return false
  if (!query) return path === '/atlas' ? !route.query.view || route.query.view === 'atlas' : true
  return new URLSearchParams(query).get('view') === route.query.view
}

const handleLogout = async () => {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <div class="library-shell" :class="{ embedded, 'workspace-shell': isWorkspace }">
    <AnimatedBackground v-if="showSharedBackground" />
    <div v-if="showSharedBackground" class="shell-background-overlay" />
    <header v-if="!embedded" class="library-header">
      <NuxtLink to="/" class="brand" aria-label="Về trang chủ PathologyLib">
        <span class="brand-mark"><v-icon size="23">mdi-microscope</v-icon></span>
        <span class="brand-copy">
          <strong>PathologyLib</strong>
          <small>{{ label('Thư viện mô bệnh học', 'Pathology Library') }}</small>
        </span>
      </NuxtLink>

      <nav class="desktop-nav" aria-label="Điều hướng chính">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="header-link"
          :class="{ active: isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <v-icon size="17">{{ item.icon }}</v-icon>
          <span>{{ item.title }}</span>
        </NuxtLink>
        <v-menu>
          <template #activator="{ props }">
            <button v-bind="props" class="header-link reference-button" :class="{ active: references.some(item => isActive(item.to)) }">
              {{ label('Tài liệu', 'References') }} <v-icon size="15">mdi-chevron-down</v-icon>
            </button>
          </template>
          <v-list density="compact">
            <v-list-item v-for="item in references" :key="item.to" :to="item.to" :title="item.title" :prepend-icon="item.icon" />
          </v-list>
        </v-menu>
      </nav>

      <div class="header-actions">
        <v-btn
          v-if="canCreateCase && isLibrary"
          to="/cases/new"
          class="create-case-button"
          color="accent"
          variant="flat"
          size="small"
          prepend-icon="mdi-plus"
          aria-label="Tạo ca bệnh mới"
          title="Tạo ca bệnh mới"
        >
          <span class="create-case-label">Tạo ca</span>
        </v-btn>
        <v-btn
          v-if="canAccessAdmin"
          to="/admin"
          icon="mdi-shield-crown"
          variant="text"
          color="warning"
          size="small"
          title="Quản trị thư viện"
        />
        <v-btn variant="text" size="small" class="language-button" :aria-label="english ? 'Chuyển sang tiếng Việt' : 'Switch to English'" @click="changeLanguage">
          {{ english ? 'VI' : 'EN' }}
        </v-btn>
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="account-button">
              <v-avatar size="30" color="accent" class="mr-2">
                <span class="account-initial">{{ displayName.charAt(0).toUpperCase() }}</span>
              </v-avatar>
              <span class="account-name">{{ displayName }}</span>
              <v-icon end size="16">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="210">
            <v-list-item
              v-if="canCreateCase && isLibrary"
              to="/cases/new"
              prepend-icon="mdi-plus-circle"
              title="Tạo ca bệnh mới"
            />
            <v-list-item v-if="canAccessAdmin" to="/admin" prepend-icon="mdi-shield-crown" title="Quản trị" />
            <v-list-item prepend-icon="mdi-logout" :title="label('Đăng xuất', 'Sign out')" @click="handleLogout" />
          </v-list>
        </v-menu>
        <v-btn
          class="mobile-menu-button"
          icon="mdi-menu"
          variant="text"
          color="white"
          size="small"
          :title="label('Mở điều hướng', 'Open navigation')"
          :aria-label="label('Mở điều hướng', 'Open navigation')"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        />
      </div>

      <nav v-if="mobileMenuOpen" @keydown.esc="mobileMenuOpen = false" class="mobile-nav" aria-label="Điều hướng di động">
        <NuxtLink
          v-if="canCreateCase && isLibrary"
          to="/cases/new"
          class="mobile-link mobile-create-link"
          @click="mobileMenuOpen = false"
        >
          <v-icon size="18">mdi-plus-circle</v-icon>
          Tạo ca bệnh mới
        </NuxtLink>
        <NuxtLink
          v-for="item in mobileItems"
          :key="item.to"
          :to="item.to"
          class="mobile-link"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="mobileMenuOpen = false"
        >
          <v-icon size="18">{{ item.icon }}</v-icon>
          {{ item.title }}
        </NuxtLink>
      </nav>
    </header>

    <main class="library-main">
      <slot />
    </main>

    <footer v-if="!embedded && !isWorkspace" class="library-footer">
      <span>PathologyLib · {{ label('Không gian học tập GPB', 'Pathology learning workspace') }}</span>
      <span>{{ label('Chỉ dùng cho học tập, không thay thế chẩn đoán chuyên khoa.', 'For learning. Clinical diagnosis requires specialist review.') }}</span>
    </footer>
  </div>
</template>

<style scoped>
.library-shell {
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  overflow: clip;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a365d 100%);
  color: #172338;
}

.shell-background-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(8, 24, 42, .84), rgba(21, 52, 78, .68) 54%, rgba(10, 31, 49, .86));
}

.library-header {
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 68px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  background: #102f43;
  border-bottom: 3px solid #c9a227;
  box-shadow: 0 5px 18px rgba(17, 38, 54, 0.16);
}

.brand,
.header-link,
.mobile-link {
  text-decoration: none;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  width: fit-content;
}

.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #102f43;
  background: #d4af37;
  border-radius: 6px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-copy strong {
  color: #fff;
  font: 700 1.05rem var(--font-body);
}

.brand-copy small {
  margin-top: 4px;
  color: #b9cad4;
  font-size: 0.72rem;
}

.desktop-nav {
  display: flex;
  align-items: stretch;
  justify-content: center;
  height: 68px;
}

.header-link {
  position: relative;
  min-width: 0;
  padding: 0 8px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #c6d4dc;
  font-size: 0.78rem;
  font-weight: 600;
}

.header-link::after {
  content: '';
  position: absolute;
  right: 15px;
  bottom: 0;
  left: 15px;
  height: 3px;
  background: transparent;
}

.header-link:hover,
.header-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.header-link.active::after {
  background: #d4af37;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.create-case-button {
  min-width: 92px;
  color: #102f43;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}

.reference-button { border: 0; background: none; }
.language-button { color: #fff; min-width: 34px; }
.account-button {
  color: #fff;
  text-transform: none;
}

.account-initial {
  color: #102f43;
  font-weight: 800;
}

.account-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu-button,
.mobile-nav {
  display: none;
}

.library-main {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 122px);
}

.library-shell.embedded .library-main { min-height: 100dvh; }
.library-shell.workspace-shell .library-main { min-height: calc(100dvh - 68px); }

.library-footer {
  position: relative;
  z-index: 2;
  min-height: 54px;
  padding: 15px 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  color: #d3dee4;
  background: #102f43;
  font-size: 0.78rem;
}

@media (max-width: 1150px) {
  .library-header {
    grid-template-columns: auto 1fr auto;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .create-case-button {
    min-width: 36px;
    width: 36px;
    padding: 0;
  }

  .create-case-label {
    display: none;
  }

  .mobile-nav {
    position: absolute;
    top: 68px;
    right: 14px;
    width: min(280px, calc(100vw - 28px));
    padding: 8px;
    display: grid;
    gap: 3px;
    background: #fff;
    border: 1px solid #d7e0e5;
    border-radius: 6px;
    box-shadow: 0 14px 38px rgba(17, 38, 54, 0.22);
  }

  .mobile-link {
    padding: 11px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #17364a;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .mobile-link:hover {
    background: #eef4f6;
  }

  .mobile-link[aria-current='page'] { background: #e2f0ee; }

  .mobile-create-link {
    color: #102f43;
    background: #f4d769;
    font-weight: 800;
  }

  .mobile-create-link:hover {
    background: #eac64c;
  }
}

@media (max-width: 640px) {
  .library-header {
    min-height: 62px;
    padding: 0 14px;
  }

  .brand-copy small,
  .account-name {
    display: none;
  }

  .mobile-nav {
    top: 62px;
  }

  .library-footer {
    padding: 14px;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
