<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { signInWithPassword, signUp, user } = useAuth()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const redirectTarget = computed(() => {
  const value = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
})

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const passwordRules = [
  { label: 'Tối thiểu 8 ký tự', test: (value: string) => value.length >= 8 },
  { label: 'Có chữ hoa và chữ thường', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Có ít nhất một chữ số', test: (value: string) => /\d/.test(value) },
  { label: 'Có ký tự đặc biệt', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

const isEmailValid = computed(() => emailRegex.test(email.value))
const passwordValidation = computed(() => passwordRules.map(rule => ({ ...rule, passed: rule.test(password.value) })))
const isPasswordValid = computed(() => passwordValidation.value.every(rule => rule.passed))
const passwordsMatch = computed(() => password.value === confirmPassword.value)

const commonsImage = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=760`

const diagnosticPanels = [
  {
    className: 'panel-histology',
    icon: 'mdi-image-multiple-outline',
    label: 'H&E · Tuyến giáp',
    image: commonsImage('Histopathology of nodular hyperplasia of the thyroid.png'),
    delay: '-1.2s',
  },
  {
    className: 'panel-cytology',
    icon: 'mdi-magnify-scan',
    label: 'Vi thể · Độ phóng đại cao',
    image: commonsImage('Hashimoto thyroiditis -- high mag.jpg'),
    delay: '-3.8s',
  },
]

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!isEmailValid.value) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email hợp lệ.'
    return
  }

  if (!password.value) {
    errorMessage.value = 'Vui lòng nhập mật khẩu.'
    return
  }

  if (!isLogin.value && (!isPasswordValid.value || !passwordsMatch.value)) {
    errorMessage.value = !passwordsMatch.value
      ? 'Mật khẩu xác nhận chưa trùng khớp.'
      : 'Mật khẩu chưa đáp ứng đủ các yêu cầu bảo mật.'
    return
  }

  isLoading.value = true

  try {
    if (isLogin.value) {
      await signInWithPassword(email.value, password.value)
      await router.push(redirectTarget.value)
    } else {
      await signUp(email.value, password.value)
      errorMessage.value = 'Tài khoản đã được tạo. Vui lòng kiểm tra email xác nhận trước khi đăng nhập.'
      isLogin.value = true
      password.value = ''
      confirmPassword.value = ''
    }
  } catch (error: any) {
    console.error('Auth error:', error)
    errorMessage.value = isLogin.value
      ? 'Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.'
      : error?.message || 'Không thể tạo tài khoản lúc này.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (user.value) router.push(redirectTarget.value)
})
</script>

<template>
  <div class="login-page">
    <div class="page-grid" aria-hidden="true"></div>

    <main class="auth-shell">
      <section class="diagnostic-scene" aria-label="Không gian kính hiển vi số">
        <div class="scene-heading">
          <span class="scene-kicker">DIGITAL PATHOLOGY WORKSPACE</span>
          <h1>Quan sát. Đối chiếu.<br>Đi đến chẩn đoán.</h1>
          <p>Thư viện mô bệnh học, Atlas vi thể, Thư viện HMMD, tra cứu ICD-O-4 và phân loại WHO trong một hệ thống học tập.</p>
        </div>

        <div class="visual-stage" aria-hidden="true">
          <div class="orbit orbit-outer"></div>
          <div class="orbit orbit-middle"></div>
          <div class="orbit orbit-inner"></div>
          <div class="scan-line"></div>

          <div class="microscope-hub">
            <v-icon icon="mdi-microscope" size="118" />
            <span>GPB / LIVE VIEW</span>
          </div>

          <article
            v-for="panel in diagnosticPanels"
            :key="panel.label"
            class="diagnostic-panel image-panel"
            :class="panel.className"
            :style="{ '--panel-delay': panel.delay }"
          >
            <img :src="panel.image" :alt="panel.label" referrerpolicy="no-referrer">
            <div class="panel-caption">
              <v-icon :icon="panel.icon" size="15" />
              <span>{{ panel.label }}</span>
            </div>
          </article>

          <article class="diagnostic-panel metric-panel panel-metrics">
            <div class="metric-header">
              <v-icon icon="mdi-chart-line" size="18" />
              <span>PHÂN TÍCH HÌNH THÁI</span>
            </div>
            <div class="metric-bars">
              <span style="height: 43%"></span>
              <span style="height: 68%"></span>
              <span style="height: 54%"></span>
              <span style="height: 86%"></span>
              <span style="height: 72%"></span>
              <span style="height: 94%"></span>
            </div>
            <small>Đang đối chiếu đặc điểm vi thể</small>
          </article>

          <article class="diagnostic-panel sequence-panel panel-sequence">
            <v-icon icon="mdi-dna" size="46" />
            <div>
              <strong>DẤU ẤN / MARKERS</strong>
              <span>TTF-1 · PAX8 · GATA3 · p40</span>
            </div>
          </article>
        </div>

        <div class="scene-status">
          <span><i></i> Hệ thống trực tuyến</span>
          <span>WHO · Atlas · HMMD</span>
        </div>
      </section>

      <section class="auth-panel">
        <header class="brand-lockup">
          <div class="brand-mark"><v-icon icon="mdi-microscope" size="30" /></div>
          <div>
            <strong>GPB SYSTEM</strong>
            <span>GIẢI PHẪU BỆNH SỐ</span>
          </div>
        </header>

        <div class="auth-copy">
          <span class="auth-kicker">TÀI KHOẢN CHUYÊN MÔN</span>
          <h2>{{ isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới' }}</h2>
          <p>{{ isLogin ? 'Truy cập không gian học tập và tra cứu tích hợp.' : 'Đăng ký tài khoản để bắt đầu sử dụng hệ thống.' }}</p>
        </div>

        <form class="auth-form" @submit.prevent="handleSubmit">
          <label class="field-label" for="email">Email</label>
          <div class="input-shell">
            <v-icon icon="mdi-email-outline" size="19" />
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="ten@benhvien.vn"
              :disabled="isLoading"
              required
            >
          </div>

          <label class="field-label" for="password">Mật khẩu</label>
          <div class="input-shell">
            <v-icon icon="mdi-lock-outline" size="19" />
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isLogin ? 'current-password' : 'new-password'"
              placeholder="Nhập mật khẩu"
              :disabled="isLoading"
              required
            >
            <button
              type="button"
              class="icon-button"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              @click="showPassword = !showPassword"
            >
              <v-icon :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="19" />
            </button>
          </div>

          <template v-if="!isLogin">
            <label class="field-label" for="confirmPassword">Xác nhận mật khẩu</label>
            <div class="input-shell">
              <v-icon icon="mdi-lock-check-outline" size="19" />
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Nhập lại mật khẩu"
                :disabled="isLoading"
                required
              >
              <button
                type="button"
                class="icon-button"
                :aria-label="showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                :title="showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <v-icon :icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="19" />
              </button>
            </div>

            <div class="password-rules">
              <span v-for="rule in passwordValidation" :key="rule.label" :class="{ passed: rule.passed }">
                <v-icon :icon="rule.passed ? 'mdi-check-circle' : 'mdi-circle-outline'" size="14" />
                {{ rule.label }}
              </span>
            </div>
          </template>

          <p v-if="errorMessage" class="form-message" role="alert">{{ errorMessage }}</p>

          <button class="submit-button" type="submit" :disabled="isLoading">
            <span v-if="isLoading" class="loading-ring" aria-hidden="true"></span>
            <v-icon v-else :icon="isLogin ? 'mdi-login' : 'mdi-account-plus-outline'" size="19" />
            <span>{{ isLoading ? 'Đang xác thực...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản') }}</span>
          </button>
        </form>

        <button class="mode-button" type="button" :disabled="isLoading" @click="toggleMode">
          {{ isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập' }}
        </button>

        <div class="security-note">
          <v-icon icon="mdi-shield-check-outline" size="18" />
          <span>Phiên đăng nhập được bảo vệ bởi Supabase Auth</span>
        </div>
      </section>
    </main>

    <footer class="login-footer">
      <span>PathologyLib · GPB System</span>
      <span>Thư viện mô bệnh học · Atlas · Thư viện HMMD · WHO</span>
    </footer>
  </div>
</template>

<style scoped>
.login-page {
  --cyan: #4fe5f2;
  --cyan-strong: #11bcd1;
  --navy: #04151e;
  --panel: #08232f;
  --line: #176278;
  min-height: 100vh;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 34px 28px 62px;
  color: #eaf9fb;
  background: var(--navy);
  font-family: var(--font-body);
}

.page-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .3;
  background-image:
    linear-gradient(rgba(79, 229, 242, .08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 229, 242, .08) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(90deg, #000 0 58%, transparent 86%);
}

.auth-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  min-height: 710px;
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) minmax(390px, .84fr);
  border: 1px solid #1b6072;
  background: #061b25;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .38);
}

.diagnostic-scene {
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 42px 44px 28px;
  overflow: hidden;
  background: #06212c;
  border-right: 1px solid #1b6072;
}

.scene-heading { position: relative; z-index: 3; max-width: 530px; }
.scene-kicker,
.auth-kicker { color: var(--cyan); font-size: .7rem; font-weight: 800; letter-spacing: 0; }
.scene-heading h1 { margin: 9px 0 12px; color: #fff; font: 750 clamp(2rem, 3.1vw, 3.25rem)/1.06 var(--font-body); letter-spacing: 0; }
.scene-heading p { max-width: 510px; margin: 0; color: #a9c7d0; font-size: .92rem; line-height: 1.65; }

.visual-stage { position: relative; flex: 1; min-height: 430px; margin-top: 8px; }
.orbit { position: absolute; left: 45%; top: 54%; border: 1px solid #17647a; border-radius: 50%; transform: translate(-50%, -50%); }
.orbit-outer { width: 360px; height: 360px; border-style: dashed; animation: orbitSpin 26s linear infinite; }
.orbit-middle { width: 286px; height: 286px; border-color: #258aa0; animation: orbitSpinReverse 18s linear infinite; }
.orbit-inner { width: 204px; height: 204px; border-style: dashed; border-color: #4fe5f2; animation: orbitSpin 12s linear infinite; }
.scan-line { position: absolute; left: 45%; top: calc(54% - 180px); width: 1px; height: 360px; background: #42d8e8; transform-origin: 50% 100%; animation: scanSweep 8s linear infinite; opacity: .55; }

.microscope-hub {
  position: absolute;
  left: 45%;
  top: 54%;
  width: 166px;
  height: 166px;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  color: var(--cyan);
  background: #071a23;
  border: 1px solid #4fe5f2;
  border-radius: 50%;
  box-shadow: 0 0 34px rgba(45, 205, 225, .17);
}
.microscope-hub span { position: absolute; bottom: 18px; color: #a9eff6; font-size: .57rem; font-weight: 800; letter-spacing: 0; }

.diagnostic-panel {
  position: absolute;
  z-index: 2;
  overflow: hidden;
  border: 1px solid #218098;
  background: #071b25;
  box-shadow: 0 12px 28px rgba(0, 0, 0, .28);
  animation: panelFloat 7s ease-in-out infinite;
  animation-delay: var(--panel-delay, 0s);
}
.image-panel { width: 168px; height: 126px; }
.image-panel img { width: 100%; height: 94px; display: block; object-fit: cover; filter: saturate(.86) contrast(1.06); }
.panel-caption { height: 31px; padding: 0 9px; display: flex; align-items: center; gap: 7px; color: #b9eaf0; font-size: .62rem; font-weight: 700; }
.panel-histology { left: 0; top: 38px; --panel-delay: -1s; }
.panel-cytology { right: 4px; bottom: 26px; --panel-delay: -4s; }

.metric-panel { right: 0; top: 18px; width: 174px; height: 118px; padding: 12px; }
.metric-header { display: flex; align-items: center; gap: 7px; color: #76e7f1; font-size: .58rem; font-weight: 800; }
.metric-bars { height: 53px; margin: 9px 0 6px; display: flex; align-items: flex-end; gap: 8px; border-bottom: 1px solid #1a596a; }
.metric-bars span { width: 12px; background: #25bfd2; animation: metricPulse 2.8s ease-in-out infinite alternate; }
.metric-bars span:nth-child(2n) { animation-delay: -.8s; background: #d0a92d; }
.metric-panel small { color: #7fa8b3; font-size: .53rem; }

.sequence-panel { left: 7px; bottom: 20px; width: 190px; min-height: 84px; padding: 13px; display: flex; align-items: center; gap: 11px; color: var(--cyan); }
.sequence-panel div { display: grid; gap: 5px; }
.sequence-panel strong { color: #d9f7fa; font-size: .58rem; letter-spacing: 0; }
.sequence-panel span { color: #7fb8c3; font-size: .56rem; }

.scene-status { position: relative; z-index: 3; display: flex; justify-content: space-between; gap: 20px; color: #729ba6; font-size: .68rem; }
.scene-status span:first-child { color: #b6dbe1; }
.scene-status i { width: 7px; height: 7px; display: inline-block; margin-right: 6px; border-radius: 50%; background: #42d878; box-shadow: 0 0 10px rgba(66, 216, 120, .7); }

.auth-panel {
  min-width: 0;
  padding: 46px 48px 34px;
  display: flex;
  flex-direction: column;
  background: #071923;
}
.brand-lockup { display: flex; align-items: center; gap: 12px; }
.brand-mark { width: 48px; height: 48px; display: grid; place-items: center; color: #04212c; background: var(--cyan); border-radius: 5px; }
.brand-lockup div:last-child { display: grid; gap: 2px; }
.brand-lockup strong { color: #fff; font: 800 1.05rem var(--font-body); letter-spacing: 0; }
.brand-lockup span { color: #82aab4; font-size: .62rem; font-weight: 700; letter-spacing: 0; }

.auth-copy { margin-top: 72px; }
.auth-copy h2 { margin: 9px 0 8px; color: #fff; font: 750 2rem/1.12 var(--font-body); letter-spacing: 0; }
.auth-copy p { margin: 0; color: #87aab3; font-size: .86rem; line-height: 1.55; }

.auth-form { margin-top: 30px; display: grid; }
.field-label { margin: 0 0 7px; color: #c7dce1; font-size: .75rem; font-weight: 700; }
.field-label:not(:first-child) { margin-top: 17px; }
.input-shell { min-height: 48px; padding: 0 13px; display: flex; align-items: center; gap: 10px; color: #6fc9d4; border: 1px solid #285464; background: #06141c; }
.input-shell:focus-within { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(79, 229, 242, .09); }
.input-shell input { min-width: 0; flex: 1; height: 46px; color: #fff; background: transparent; border: 0; outline: 0; font: 500 .9rem var(--font-body); }
.input-shell input::placeholder { color: #5f8089; }
.icon-button { width: 34px; height: 34px; display: grid; place-items: center; color: #7db5bf; background: transparent; border: 0; cursor: pointer; }
.icon-button:hover { color: #fff; }

.password-rules { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.password-rules span { display: flex; align-items: center; gap: 5px; color: #718f97; font-size: .65rem; }
.password-rules span.passed { color: #55d58a; }
.form-message { margin: 14px 0 0; padding: 10px 12px; color: #ffb9bd; background: #351a22; border-left: 3px solid #ef6670; font-size: .75rem; line-height: 1.45; }

.submit-button { min-height: 49px; margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 9px; color: #02202a; background: var(--cyan-strong); border: 1px solid #43d7e5; border-radius: 4px; font: 800 .82rem var(--font-body); text-transform: uppercase; letter-spacing: 0; cursor: pointer; transition: transform .18s ease, background .18s ease; }
.submit-button:hover:not(:disabled) { transform: translateY(-2px); background: #50e4f0; }
.submit-button:disabled { cursor: wait; opacity: .7; }
.loading-ring { width: 18px; height: 18px; border: 2px solid rgba(3, 31, 41, .25); border-top-color: #03232d; border-radius: 50%; animation: orbitSpin .7s linear infinite; }

.mode-button { align-self: center; margin-top: 19px; color: #79cdd7; background: transparent; border: 0; font: 650 .75rem var(--font-body); cursor: pointer; }
.mode-button:hover { color: #fff; }
.security-note { margin-top: auto; padding-top: 32px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #668b95; font-size: .66rem; }

.login-footer { position: absolute; z-index: 2; right: 28px; bottom: 20px; left: 28px; display: flex; justify-content: space-between; color: #547681; font-size: .62rem; letter-spacing: 0; }

@keyframes orbitSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes orbitSpinReverse { to { transform: translate(-50%, -50%) rotate(-360deg); } }
@keyframes scanSweep { to { transform: rotate(360deg); } }
@keyframes panelFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -9px; } }
@keyframes metricPulse { from { scale: 1 .7; transform-origin: bottom; } to { scale: 1 1; transform-origin: bottom; } }

@media (max-width: 980px) {
  .login-page { padding: 24px 18px 58px; overflow: auto; }
  .auth-shell { min-height: 0; grid-template-columns: 1fr; }
  .diagnostic-scene { min-height: 430px; padding: 30px 32px 20px; border-right: 0; border-bottom: 1px solid #1b6072; }
  .scene-heading h1 { font-size: 2.15rem; }
  .scene-heading p { max-width: 560px; }
  .visual-stage { min-height: 270px; }
  .orbit { left: 50%; top: 55%; }
  .orbit-outer { width: 280px; height: 280px; }
  .orbit-middle { width: 224px; height: 224px; }
  .orbit-inner { width: 166px; height: 166px; }
  .scan-line { left: 50%; top: calc(55% - 140px); height: 280px; }
  .microscope-hub { left: 50%; top: 55%; width: 132px; height: 132px; }
  .microscope-hub :deep(.v-icon) { font-size: 88px !important; }
  .image-panel { width: 142px; height: 108px; }
  .image-panel img { height: 77px; }
  .metric-panel { width: 154px; }
  .sequence-panel { width: 170px; }
  .auth-panel { padding: 38px 42px 34px; }
  .auth-copy { margin-top: 42px; }
}

@media (max-width: 620px) {
  .login-page { padding: 0 0 50px; place-items: start stretch; }
  .auth-shell { width: 100%; border-width: 0 0 1px; }
  .diagnostic-scene { min-height: 310px; padding: 24px 20px 12px; }
  .scene-heading h1 { font-size: 1.72rem; }
  .scene-heading p { display: none; }
  .visual-stage { min-height: 205px; margin-top: 2px; }
  .orbit-outer { width: 202px; height: 202px; }
  .orbit-middle { width: 164px; height: 164px; }
  .orbit-inner { width: 124px; height: 124px; }
  .scan-line { top: calc(55% - 101px); height: 202px; }
  .microscope-hub { width: 102px; height: 102px; }
  .microscope-hub :deep(.v-icon) { font-size: 64px !important; }
  .microscope-hub span { display: none; }
  .panel-histology { top: 14px; width: 110px; height: 86px; }
  .panel-histology img { height: 58px; }
  .panel-histology .panel-caption { height: 27px; padding: 0 6px; font-size: .5rem; }
  .panel-cytology, .metric-panel { display: none; }
  .sequence-panel { left: auto; right: 0; bottom: 9px; width: 132px; min-height: 62px; padding: 8px; }
  .sequence-panel :deep(.v-icon) { font-size: 32px !important; }
  .sequence-panel span { display: none; }
  .scene-status { font-size: .57rem; }
  .scene-status span:last-child { display: none; }
  .auth-panel { padding: 30px 22px 28px; }
  .auth-copy { margin-top: 32px; }
  .auth-copy h2 { font-size: 1.65rem; }
  .password-rules { grid-template-columns: 1fr; }
  .login-footer { right: 18px; bottom: 17px; left: 18px; justify-content: center; }
  .login-footer span:last-child { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .orbit, .scan-line, .diagnostic-panel, .metric-bars span, .loading-ring { animation: none !important; }
}
</style>
