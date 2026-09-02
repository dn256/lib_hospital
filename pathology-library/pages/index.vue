<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const { user, profile, signOut } = useAuth()

const displayName = computed(() => profile.value?.display_name || user.value?.email?.split('@')[0] || 'Bác sĩ')

const modules = [
  {
    title: 'Thư viện mô bệnh học',
    subtitle: 'Case library',
    description: 'Tra cứu ca mô bệnh học, chẩn đoán và nội dung báo cáo đã lưu.',
    icon: 'mdi-bookshelf',
    to: '/library',
    color: '#d4af37',
    action: 'Mở thư viện',
  },
  {
    title: 'Atlas GPB',
    subtitle: 'Pathology atlas',
    description: 'Học theo cơ quan, hình thái vi thể, dấu ấn và chẩn đoán song ngữ.',
    icon: 'mdi-microscope',
    to: '/atlas',
    color: '#3dc7c2',
    action: 'Mở Atlas',
  },
  {
    title: 'Thư viện HMMD',
    subtitle: 'IHC search',
    description: 'Định hướng chẩn đoán từ panel dấu ấn dương tính và âm tính.',
    icon: 'mdi-test-tube',
    to: '/hmmd',
    color: '#f08a5d',
    action: 'Tra cứu dấu ấn',
  },
  {
    title: 'Danh mục WHO',
    subtitle: 'WHO Classification',
    description: 'Mở mục lục phân loại WHO và liên kết đúng tới nội dung nguồn.',
    icon: 'mdi-book-open-page-variant',
    to: '/atlas?view=who',
    color: '#7aa7ff',
    action: 'Tra danh mục',
  },
  {
    title: 'Kho ảnh',
    subtitle: 'Source galleries',
    description: 'Tìm ảnh theo cơ quan và mở gallery gốc để đối chiếu.',
    icon: 'mdi-image-multiple-outline',
    to: '/atlas?view=images',
    color: '#d780b6',
    action: 'Mở kho ảnh',
  },
]

const handleLogout = async () => {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <div class="hub-page">
    <AnimatedBackground />
    <div class="hub-overlay" />

    <div class="hub-layer">
      <header class="hub-header">
        <NuxtLink to="/" class="hub-brand" aria-label="Trang chủ PathologyLib">
          <span class="brand-mark"><v-icon size="24">mdi-microscope</v-icon></span>
          <span><strong>PathologyLib</strong><small>Trung tâm học tập giải phẫu bệnh</small></span>
        </NuxtLink>

        <div class="header-actions">
          <v-btn to="/workspace" color="accent" variant="flat" prepend-icon="mdi-view-split-vertical" class="multitask-button">
            Đa nhiệm
          </v-btn>
          <div class="account-chip">
            <v-avatar size="30" color="primary"><span>{{ displayName.charAt(0).toUpperCase() }}</span></v-avatar>
            <span>{{ displayName }}</span>
          </div>
          <v-btn icon="mdi-logout" variant="text" color="white" size="small" title="Đăng xuất" @click="handleLogout" />
        </div>
      </header>

      <main class="hub-main">
        <section class="hub-intro">
          <div>
            <p class="eyebrow"><span /> Workspace cá nhân</p>
            <h1>Chọn công cụ cần sử dụng</h1>
            <p>Một tài khoản, một trung tâm truy cập cho toàn bộ thư viện học tập và tra cứu giải phẫu bệnh.</p>
          </div>
          <NuxtLink to="/workspace" class="split-quick-link">
            <v-icon size="22">mdi-view-split-vertical</v-icon>
            <span><strong>Mở Thư viện + Atlas</strong><small>Hiển thị đồng thời trên một màn hình</small></span>
            <v-icon size="18">mdi-arrow-right</v-icon>
          </NuxtLink>
        </section>

        <section class="module-section" aria-labelledby="module-heading">
          <div class="section-heading">
            <div><p>CÁC MÔ-ĐUN</p><h2 id="module-heading">Không gian làm việc</h2></div>
            <span>5 công cụ đã kết nối</span>
          </div>

          <div class="module-grid">
            <NuxtLink
              v-for="(module, index) in modules"
              :key="module.to"
              :to="module.to"
              class="module-card"
              :style="{ '--module-color': module.color, '--module-index': index }"
            >
              <span class="module-icon"><v-icon size="27">{{ module.icon }}</v-icon></span>
              <span class="module-copy">
                <small>{{ module.subtitle }}</small>
                <strong>{{ module.title }}</strong>
                <span>{{ module.description }}</span>
              </span>
              <span class="module-action">{{ module.action }} <v-icon size="17">mdi-arrow-right</v-icon></span>
            </NuxtLink>
          </div>
        </section>

        <section class="multitask-panel">
          <div class="multitask-copy">
            <p>CHẾ ĐỘ ĐA NHIỆM</p>
            <h2>Đối chiếu ca bệnh và Atlas mà không phải chuyển tab</h2>
            <span>Hai vùng làm việc độc lập, có thể đổi sang HMMD, WHO hoặc kho ảnh bất cứ lúc nào.</span>
            <v-btn to="/workspace" color="accent" variant="flat" append-icon="mdi-arrow-right">Mở bàn làm việc đôi</v-btn>
          </div>
          <div class="split-preview" aria-hidden="true">
            <div><span><v-icon size="16">mdi-bookshelf</v-icon> Thư viện mô bệnh học</span><i /><i /><i /></div>
            <div><span><v-icon size="16">mdi-microscope</v-icon> Atlas GPB</span><b /><b /><b /></div>
          </div>
        </section>
      </main>

      <footer class="hub-footer">
        <span>PathologyLib · Không gian học tập cá nhân</span>
        <span>Chỉ dùng cho học tập, không thay thế chẩn đoán chuyên khoa.</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.hub-page { min-height: 100vh; position: relative; overflow: hidden; color: #fff; background: #0f2035; }
.hub-overlay { position: fixed; inset: 0; z-index: 2; pointer-events: none; background: linear-gradient(115deg, rgba(7,22,39,.94), rgba(15,41,62,.8) 52%, rgba(8,28,45,.92)); }
.hub-layer { position: relative; z-index: 10; min-height: 100vh; }
.hub-header { min-height: 74px; padding: 0 max(24px, calc((100vw - 1500px) / 2)); display: flex; align-items: center; justify-content: space-between; gap: 24px; background: rgba(8,25,40,.78); border-bottom: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(16px); }
.hub-brand { display: inline-flex; align-items: center; gap: 11px; color: #fff; }.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; color: #102f43; background: #d4af37; border-radius: 7px; }.hub-brand > span:last-child { display: flex; flex-direction: column; }.hub-brand strong { font-size: 1rem; }.hub-brand small { margin-top: 3px; color: #9eb4c1; font-size: .68rem; }
.header-actions { display: flex; align-items: center; gap: 9px; }.multitask-button { text-transform: none; font-weight: 800; }.account-chip { min-height: 40px; padding: 4px 10px 4px 4px; display: flex; align-items: center; gap: 8px; color: #e7eff3; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 7px; font-size: .78rem; font-weight: 700; }.account-chip :deep(.v-avatar) { color: #102f43; font-weight: 900; }
.hub-main { width: min(1500px, calc(100% - 48px)); margin: 0 auto; padding: 46px 0 52px; }
.hub-intro { display: grid; grid-template-columns: minmax(0,1fr) minmax(330px,450px); align-items: end; gap: 36px; }.eyebrow, .section-heading p, .multitask-copy > p { margin: 0 0 8px; color: #f0cb58; font-size: .7rem; font-weight: 900; text-transform: uppercase; }.eyebrow { display: flex; align-items: center; gap: 9px; }.eyebrow span { width: 8px; height: 8px; background: #47d7cf; border-radius: 50%; box-shadow: 0 0 0 6px rgba(71,215,207,.12); animation: pulse 2.2s ease-in-out infinite; }
.hub-intro h1 { margin: 0; font: 700 2.55rem/1.12 var(--font-heading); }.hub-intro > div > p:last-child { max-width: 720px; margin: 12px 0 0; color: #b9cad4; font-size: .9rem; }
.split-quick-link { min-height: 70px; padding: 13px 16px; display: grid; grid-template-columns: 32px minmax(0,1fr) 20px; align-items: center; gap: 10px; color: #fff; background: rgba(61,199,194,.1); border: 1px solid rgba(83,224,216,.38); border-radius: 8px; transition: background-color .2s ease, transform .2s ease, border-color .2s ease; }.split-quick-link:hover { color: #fff; background: rgba(61,199,194,.18); border-color: #65e4dd; transform: translateY(-2px); }.split-quick-link > span { display: flex; flex-direction: column; }.split-quick-link strong { font-size: .82rem; }.split-quick-link small { margin-top: 4px; color: #9fc6c6; font-size: .68rem; }
.module-section { margin-top: 44px; }.section-heading { margin-bottom: 15px; display: flex; align-items: end; justify-content: space-between; gap: 20px; }.section-heading h2 { margin: 0; font: 700 1.55rem var(--font-heading); }.section-heading > span { color: #8fa8b6; font-size: .72rem; }
.module-grid { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 14px; }.module-card { --span: 2; grid-column: span var(--span); min-height: 220px; padding: 20px; display: flex; flex-direction: column; color: #fff; background: rgba(16,47,67,.78); border: 1px solid rgba(255,255,255,.13); border-radius: 8px; box-shadow: 0 18px 40px rgba(3,15,26,.2); backdrop-filter: blur(12px); animation: cardIn .5s ease both; animation-delay: calc(var(--module-index) * 60ms); transition: background-color .22s ease, border-color .22s ease, transform .22s ease, box-shadow .22s ease; }.module-card:nth-child(1), .module-card:nth-child(2) { --span: 3; }.module-card:hover { color: #fff; background: rgba(21,61,81,.94); border-color: color-mix(in srgb, var(--module-color) 70%, white); transform: translateY(-5px); box-shadow: 0 24px 54px rgba(2,14,24,.34); }
.module-icon { width: 48px; height: 48px; display: grid; place-items: center; color: #10283b; background: var(--module-color); border-radius: 7px; }.module-copy { min-width: 0; margin-top: 18px; display: flex; flex-direction: column; }.module-copy small { color: var(--module-color); font-size: .63rem; font-weight: 900; text-transform: uppercase; }.module-copy strong { margin-top: 4px; font: 700 1.22rem var(--font-heading); }.module-copy > span { margin-top: 8px; color: #aebfca; font-size: .75rem; line-height: 1.55; }.module-action { margin-top: auto; padding-top: 15px; display: flex; align-items: center; justify-content: space-between; color: #e7eff3; border-top: 1px solid rgba(255,255,255,.1); font-size: .72rem; font-weight: 800; }.module-action :deep(.v-icon) { transition: transform .2s ease; }.module-card:hover .module-action :deep(.v-icon) { transform: translateX(4px); }
.multitask-panel { min-height: 260px; margin-top: 18px; padding: 28px; display: grid; grid-template-columns: minmax(300px,.8fr) minmax(420px,1.2fr); align-items: center; gap: 40px; background: rgba(9,31,48,.78); border: 1px solid rgba(255,255,255,.13); border-radius: 8px; backdrop-filter: blur(14px); }.multitask-copy h2 { max-width: 600px; margin: 0; font: 700 1.65rem/1.25 var(--font-heading); }.multitask-copy > span { display: block; margin: 10px 0 18px; color: #aabdc8; font-size: .76rem; }.multitask-copy :deep(.v-btn) { text-transform: none; font-weight: 800; }
.split-preview { height: 205px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; padding: 9px; background: #091b2a; border: 1px solid rgba(255,255,255,.14); border-radius: 7px; box-shadow: 0 20px 36px rgba(2,14,24,.32); }.split-preview > div { padding: 12px; display: flex; flex-direction: column; gap: 9px; overflow: hidden; background: #f2f6f7; border-radius: 5px; }.split-preview span { display: flex; align-items: center; gap: 6px; color: #17384b; font-size: .68rem; font-weight: 900; }.split-preview i { height: 35px; display: block; background: linear-gradient(90deg,#dce7ea 35%,#eef3f5 35%); border-radius: 3px; }.split-preview b { height: 46px; display: block; background: linear-gradient(90deg,#d97aa0,#e9b0c7 44%,#dce7ea 44%); border-radius: 3px; opacity: .82; }
.hub-footer { min-height: 52px; padding: 14px max(24px, calc((100vw - 1500px) / 2)); display: flex; justify-content: space-between; gap: 20px; color: #8fa8b6; background: rgba(5,19,31,.78); border-top: 1px solid rgba(255,255,255,.09); font-size: .7rem; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 5px rgba(71,215,207,.12); } 50% { box-shadow: 0 0 0 10px rgba(71,215,207,0); } }
@keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 980px) { .hub-intro, .multitask-panel { grid-template-columns: 1fr; }.module-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }.module-card, .module-card:nth-child(1), .module-card:nth-child(2) { grid-column: span 1; }.multitask-panel { gap: 24px; }.split-preview { min-height: 190px; } }
@media (max-width: 640px) { .hub-header { min-height: 64px; padding: 0 14px; }.hub-brand small, .account-chip, .multitask-button { display: none; }.hub-main { width: calc(100% - 28px); padding: 30px 0; }.hub-intro h1 { font-size: 2rem; }.hub-intro { gap: 20px; }.module-section { margin-top: 30px; }.module-grid { grid-template-columns: 1fr; }.module-card { min-height: 205px; }.multitask-panel { padding: 18px; }.split-preview { height: 175px; }.hub-footer { padding: 14px; flex-direction: column; gap: 4px; } }
@media (prefers-reduced-motion: reduce) { .eyebrow span, .module-card { animation: none; }.module-card, .split-quick-link { transition: none; } }
</style>
