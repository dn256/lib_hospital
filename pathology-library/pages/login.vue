<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { signInWithPassword, signUp, user } = useAuth()

const redirectTarget = computed(() => {
    const value = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    return value.startsWith('/') && !value.startsWith('//') ? value : '/'
})

// Form states
const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Validation states
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmPasswordTouched = ref(false)

// Validation rules
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const passwordRules = {
    minLength: { test: (p: string) => p.length >= 8, label: 'Ít nhất 8 ký tự' },
    hasUppercase: { test: (p: string) => /[A-Z]/.test(p), label: 'Có chữ hoa (A-Z)' },
    hasLowercase: { test: (p: string) => /[a-z]/.test(p), label: 'Có chữ thường (a-z)' },
    hasNumber: { test: (p: string) => /\d/.test(p), label: 'Có số (0-9)' },
    hasSpecial: { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), label: 'Có ký tự đặc biệt (!@#$...)' },
}

// Computed validation states
const isEmailValid = computed(() => emailRegex.test(email.value))
const emailError = computed(() => {
    if (!emailTouched.value || !email.value) return ''
    if (!isEmailValid.value) return 'Email không hợp lệ'
    return ''
})

const passwordValidation = computed(() => {
    return Object.entries(passwordRules).map(([key, rule]) => ({
        key,
        label: rule.label,
        passed: rule.test(password.value)
    }))
})

const isPasswordValid = computed(() =>
    passwordValidation.value.every(rule => rule.passed)
)

const passwordStrength = computed(() => {
    const passed = passwordValidation.value.filter(r => r.passed).length
    if (passed <= 1) return { level: 'weak', label: 'Yếu', color: '#e74c3c', percent: 20 }
    if (passed <= 3) return { level: 'medium', label: 'Trung bình', color: '#f39c12', percent: 50 }
    if (passed <= 4) return { level: 'strong', label: 'Khá', color: '#3498db', percent: 75 }
    return { level: 'excellent', label: 'Mạnh', color: '#27ae60', percent: 100 }
})

const confirmPasswordError = computed(() => {
    if (!confirmPasswordTouched.value || !confirmPassword.value) return ''
    if (password.value !== confirmPassword.value) return 'Mật khẩu không khớp'
    return ''
})

const isFormValid = computed(() => {
    if (isLogin.value) {
        return isEmailValid.value && password.value.length > 0
    }
    return isEmailValid.value && isPasswordValid.value && password.value === confirmPassword.value
})

// Librarian dialogue system
const currentDialogue = ref(0)
const isTyping = ref(false)
const displayedText = ref('')
const librarianMood = ref<'welcome' | 'thinking' | 'happy' | 'concerned'>('welcome')

// Dialogue scripts
const loginDialogues = [
    { text: 'Xin chào! Chào mừng đến với Thư viện Mô bệnh học. Tôi là thủ thư Minh. 📚', mood: 'welcome' as const },
    { text: 'Bạn đã có thẻ thư viện chưa? Nếu có, hãy để tôi kiểm tra thông tin của bạn nhé!', mood: 'happy' as const },
]

const registerDialogues = [
    { text: 'Ồ, bạn là khách mới! Thật tuyệt vời khi bạn quan tâm đến thư viện của chúng tôi. 🌟', mood: 'happy' as const },
    { text: 'Mật khẩu cần có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt nhé! 🔐', mood: 'welcome' as const },
]

const errorDialogues = {
    invalidCredentials: 'Hmm, có vẻ thông tin không đúng. Bạn kiểm tra lại email và mật khẩu giúp tôi nhé? 🔍',
    passwordMismatch: 'Ối, hai mật khẩu không khớp nhau. Bạn nhập lại cẩn thận hơn nhé! ✍️',
    weakPassword: 'Mật khẩu chưa đủ mạnh. Hãy thêm chữ hoa, số và ký tự đặc biệt nhé! 💪',
    invalidEmail: 'Email này có vẻ không hợp lệ. Bạn kiểm tra lại giúp tôi nhé! 📧',
    networkError: 'Có trục trặc với hệ thống. Bạn thử lại sau vài giây nha... 🔧',
    success: 'Tuyệt vời! Cửa thư viện đã mở. Chúc bạn có những giây phút học tập thú vị! 🎉',
}

// Typewriter effect
const typeText = async (text: string) => {
    isTyping.value = true
    displayedText.value = ''

    for (let i = 0; i < text.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30))
        displayedText.value += text[i]
    }

    isTyping.value = false
}

// Change dialogue
const showDialogue = async (text: string, mood: typeof librarianMood.value) => {
    librarianMood.value = mood
    await typeText(text)
}

// Toggle between login and register
const toggleMode = async () => {
    isLogin.value = !isLogin.value
    errorMessage.value = ''
    currentDialogue.value = 0

    const dialogues = isLogin.value ? loginDialogues : registerDialogues
    await showDialogue(dialogues[0].text, dialogues[0].mood)

    await new Promise(resolve => setTimeout(resolve, 1500))
    if (dialogues[1]) {
        await showDialogue(dialogues[1].text, dialogues[1].mood)
    }
}

// Handle form submission
const handleSubmit = async () => {
    // Mark all fields as touched
    emailTouched.value = true
    passwordTouched.value = true
    if (!isLogin.value) confirmPasswordTouched.value = true

    // Validate email
    if (!email.value || !isEmailValid.value) {
        await showDialogue(errorDialogues.invalidEmail, 'concerned')
        return
    }

    // For registration, validate password strength
    if (!isLogin.value) {
        if (!isPasswordValid.value) {
            await showDialogue(errorDialogues.weakPassword, 'concerned')
            return
        }
        if (password.value !== confirmPassword.value) {
            await showDialogue(errorDialogues.passwordMismatch, 'concerned')
            return
        }
    }

    // For login, just check password is not empty
    if (isLogin.value && !password.value) {
        await showDialogue('Bạn ơi, điền đầy đủ thông tin giúp tôi nhé! 📝', 'concerned')
        return
    }

    isLoading.value = true
    librarianMood.value = 'thinking'

    if (isLogin.value) {
        await showDialogue('Để tôi kiểm tra thẻ của bạn... ⏳', 'thinking')
    } else {
        await showDialogue('Đang đăng ký thẻ thư viện mới cho bạn... ✍️', 'thinking')
    }

    try {
        if (isLogin.value) {
            await signInWithPassword(email.value, password.value)
            await showDialogue(errorDialogues.success, 'happy')
        } else {
            await signUp(email.value, password.value)
            await showDialogue('Tuyệt vời! Thẻ thư viện đã được cấp. Hãy kiểm tra email để xác nhận nhé! 📧', 'happy')
        }

        await new Promise(resolve => setTimeout(resolve, 1500))
        router.push(redirectTarget.value)
    } catch (error: any) {
        console.error('Auth error:', error)
        await showDialogue(errorDialogues.invalidCredentials, 'concerned')
        errorMessage.value = error.message
    } finally {
        isLoading.value = false
    }
}

// Initialize dialogues on mount
onMounted(async () => {
    // Check if already logged in
    if (user.value) {
        router.push(redirectTarget.value)
        return
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    await showDialogue(loginDialogues[0].text, loginDialogues[0].mood)

    await new Promise(resolve => setTimeout(resolve, 2000))
    await showDialogue(loginDialogues[1].text, loginDialogues[1].mood)
})

// Computed classes for librarian avatar
const librarianClass = computed(() => ({
    'librarian-avatar': true,
    'mood-welcome': librarianMood.value === 'welcome',
    'mood-thinking': librarianMood.value === 'thinking',
    'mood-happy': librarianMood.value === 'happy',
    'mood-concerned': librarianMood.value === 'concerned',
}))
</script>

<template>
    <div class="login-page">
        <AnimatedBackground />
        <div class="login-scrim"></div>

        <!-- Main container -->
        <div class="login-container">
            <!-- Library desk scene -->
            <div class="library-desk">
                <!-- Librarian section -->
                <div class="librarian-section">
                    <!-- Librarian avatar -->
                    <div :class="librarianClass">
                        <div class="avatar-frame">
                            <div class="librarian-image">
                                <div class="face">
                                    <div class="glasses"></div>
                                    <div class="eyes">
                                        <span class="eye left"
                                            :class="{ 'blink': librarianMood === 'thinking' }"></span>
                                        <span class="eye right"
                                            :class="{ 'blink': librarianMood === 'thinking' }"></span>
                                    </div>
                                    <div class="mouth" :class="librarianMood"></div>
                                </div>
                                <div class="body"></div>
                                <div class="book-stack">
                                    <div class="mini-book"></div>
                                    <div class="mini-book"></div>
                                    <div class="mini-book"></div>
                                </div>
                            </div>
                        </div>
                        <div class="name-badge">
                            <span class="badge-icon">📚</span>
                            <span class="badge-text">Thủ thư Minh</span>
                        </div>
                    </div>

                    <!-- Dialogue bubble -->
                    <div class="dialogue-bubble" :class="{ 'typing': isTyping }">
                        <div class="bubble-content">
                            <p>{{ displayedText }}<span v-if="isTyping" class="cursor">|</span></p>
                        </div>
                        <div class="bubble-tail"></div>
                    </div>
                </div>

                <!-- Desk surface with form -->
                <div class="desk-surface">
                    <div class="desk-items">
                        <div class="desk-lamp"></div>
                        <div class="stamp-pad"></div>
                    </div>

                    <!-- Library card / Form -->
                    <div class="library-card">
                        <div class="card-header">
                            <div class="card-logo">
                                <span class="logo-icon">🔬</span>
                            </div>
                            <h2 class="card-title">
                                {{ isLogin ? 'Thẻ Thư Viện' : 'Đăng Ký Thẻ Mới' }}
                            </h2>
                            <p class="card-subtitle">Thư viện Mô bệnh học</p>
                        </div>

                        <form @submit.prevent="handleSubmit" class="card-form">
                            <!-- Email field -->
                            <div class="form-field" :class="{ 'has-error': emailError }">
                                <label for="email">
                                    <span class="field-icon">✉️</span>
                                    <span>Email</span>
                                </label>
                                <input id="email" v-model="email" type="email" placeholder="your.email@hospital.vn"
                                    required :disabled="isLoading" @blur="emailTouched = true"
                                    :class="{ 'input-error': emailError, 'input-valid': emailTouched && isEmailValid }" />
                                <Transition name="fade">
                                    <span v-if="emailError" class="field-error">{{ emailError }}</span>
                                </Transition>
                            </div>

                            <!-- Password field -->
                            <div class="form-field">
                                <label for="password">
                                    <span class="field-icon">🔐</span>
                                    <span>Mật khẩu</span>
                                </label>
                                <div class="password-input">
                                    <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
                                        placeholder="Nhập mật khẩu..." required :disabled="isLoading"
                                        @blur="passwordTouched = true" />
                                    <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                                        {{ showPassword ? '🙈' : '👁️' }}
                                    </button>
                                </div>

                                <!-- Password strength indicator (only for registration) -->
                                <Transition name="slide-fade">
                                    <div v-if="!isLogin && password" class="password-strength">
                                        <div class="strength-bar">
                                            <div class="strength-fill"
                                                :style="{ width: passwordStrength.percent + '%', background: passwordStrength.color }">
                                            </div>
                                        </div>
                                        <span class="strength-label" :style="{ color: passwordStrength.color }">
                                            {{ passwordStrength.label }}
                                        </span>
                                    </div>
                                </Transition>

                                <!-- Password requirements (only for registration) -->
                                <Transition name="slide-fade">
                                    <div v-if="!isLogin" class="password-requirements">
                                        <div v-for="rule in passwordValidation" :key="rule.key" class="requirement"
                                            :class="{ 'passed': rule.passed }">
                                            <span class="req-icon">{{ rule.passed ? '✅' : '⚪' }}</span>
                                            <span class="req-text">{{ rule.label }}</span>
                                        </div>
                                    </div>
                                </Transition>
                            </div>

                            <!-- Confirm password (register only) -->
                            <Transition name="slide-fade">
                                <div v-if="!isLogin" class="form-field" :class="{ 'has-error': confirmPasswordError }">
                                    <label for="confirmPassword">
                                        <span class="field-icon">🔒</span>
                                        <span>Xác nhận mật khẩu</span>
                                    </label>
                                    <div class="password-input">
                                        <input id="confirmPassword" v-model="confirmPassword"
                                            :type="showConfirmPassword ? 'text' : 'password'"
                                            placeholder="Nhập lại mật khẩu..." required :disabled="isLoading"
                                            @blur="confirmPasswordTouched = true"
                                            :class="{ 'input-error': confirmPasswordError, 'input-valid': confirmPasswordTouched && !confirmPasswordError && confirmPassword }" />
                                        <button type="button" class="toggle-password"
                                            @click="showConfirmPassword = !showConfirmPassword">
                                            {{ showConfirmPassword ? '🙈' : '👁️' }}
                                        </button>
                                    </div>
                                    <Transition name="fade">
                                        <span v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError
                                        }}</span>
                                    </Transition>
                                </div>
                            </Transition>

                            <!-- Submit button -->
                            <button type="submit" class="submit-btn" :disabled="isLoading || (!isLogin && !isFormValid)"
                                :class="{ 'loading': isLoading }">
                                <span v-if="isLoading" class="loading-spinner"></span>
                                <span v-else class="btn-content">
                                    <span class="btn-icon">{{ isLogin ? '🎫' : '✨' }}</span>
                                    <span>{{ isLogin ? 'Quẹt Thẻ Vào' : 'Đăng Ký Thẻ' }}</span>
                                </span>
                            </button>
                        </form>

                        <!-- Toggle mode -->
                        <div class="card-footer">
                            <button type="button" class="toggle-mode-btn" @click="toggleMode" :disabled="isLoading">
                                {{ isLogin ? 'Chưa có thẻ? Đăng ký ngay!' : 'Đã có thẻ? Đăng nhập' }}
                            </button>
                        </div>

                        <!-- Decorative stamp -->
                        <div class="card-stamp" :class="{ 'stamped': !isLogin }">
                            <span>{{ isLogin ? '📖' : '✅' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer credits -->
            <div class="login-footer">
                <p>© 2026 Thư viện Mô bệnh học - Pathology Library</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ===== LOGIN PAGE STYLES ===== */
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.login-scrim {
    position: fixed;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(8, 21, 40, 0.9), rgba(16, 46, 72, 0.72), rgba(7, 24, 42, 0.92));
}

/* ===== ANIMATED BACKGROUND ===== */
.library-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
}

.bookshelf-pattern {
    position: absolute;
    inset: 0;
    background-image:
        repeating-linear-gradient(90deg,
            transparent,
            transparent 80px,
            rgba(139, 90, 43, 0.1) 80px,
            rgba(139, 90, 43, 0.1) 82px),
        repeating-linear-gradient(0deg,
            transparent,
            transparent 120px,
            rgba(139, 90, 43, 0.15) 120px,
            rgba(139, 90, 43, 0.15) 125px);
    opacity: 0.5;
}

.floating-books {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.book {
    position: absolute;
    font-size: 2rem;
    opacity: 0.3;
    animation: floatBook 20s infinite ease-in-out;
}

.book-1 {
    top: 10%;
    left: 5%;
    animation-delay: 0s;
}

.book-2 {
    top: 60%;
    left: 10%;
    animation-delay: -4s;
}

.book-3 {
    top: 30%;
    right: 8%;
    animation-delay: -8s;
}

.book-4 {
    top: 75%;
    right: 15%;
    animation-delay: -12s;
}

.book-5 {
    top: 45%;
    left: 3%;
    animation-delay: -16s;
}

@keyframes floatBook {

    0%,
    100% {
        transform: translateY(0) rotate(0deg);
    }

    25% {
        transform: translateY(-20px) rotate(5deg);
    }

    50% {
        transform: translateY(-10px) rotate(-3deg);
    }

    75% {
        transform: translateY(-25px) rotate(3deg);
    }
}

.light-rays {
    position: absolute;
    top: -50%;
    left: 50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg at 50% 50%,
            transparent 0deg,
            rgba(201, 162, 39, 0.03) 10deg,
            transparent 20deg,
            rgba(201, 162, 39, 0.02) 40deg,
            transparent 50deg);
    animation: rotateRays 60s linear infinite;
}

@keyframes rotateRays {
    from {
        transform: translate(-50%, 0) rotate(0deg);
    }

    to {
        transform: translate(-50%, 0) rotate(360deg);
    }
}

/* ===== MAIN CONTAINER ===== */
.login-container {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 900px;
    padding: 2rem;
}

/* ===== LIBRARY DESK SCENE ===== */
.library-desk {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: linear-gradient(145deg, rgba(26, 54, 93, 0.8), rgba(15, 52, 96, 0.9));
    border-radius: 24px;
    padding: 2rem;
    box-shadow:
        0 25px 80px rgba(0, 0, 0, 0.5),
        0 0 60px rgba(201, 162, 39, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(201, 162, 39, 0.2);
}

/* ===== LIBRARIAN SECTION ===== */
.librarian-section {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
}

/* Librarian Avatar */
.librarian-avatar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}

.avatar-frame {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(145deg, #c9a227, #a88720);
    padding: 4px;
    box-shadow:
        0 8px 25px rgba(201, 162, 39, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.3);
    animation: gentlePulse 3s ease-in-out infinite;
}

@keyframes gentlePulse {

    0%,
    100% {
        box-shadow: 0 8px 25px rgba(201, 162, 39, 0.4);
    }

    50% {
        box-shadow: 0 8px 35px rgba(201, 162, 39, 0.6);
    }
}

.librarian-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.face {
    position: relative;
    width: 60%;
    height: 50%;
}

.glasses {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 35%;
    border: 2px solid #333;
    border-radius: 30%;
    background: rgba(255, 255, 255, 0.2);
}

.glasses::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translateX(-50%);
    width: 15%;
    height: 2px;
    background: #333;
}

.eyes {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.eye {
    width: 8px;
    height: 8px;
    background: #333;
    border-radius: 50%;
    animation: blink 4s infinite;
}

.eye.blink {
    animation: thinkBlink 1s infinite;
}

@keyframes blink {

    0%,
    95%,
    100% {
        transform: scaleY(1);
    }

    97% {
        transform: scaleY(0.1);
    }
}

@keyframes thinkBlink {

    0%,
    50%,
    100% {
        transform: scaleY(1);
    }

    25%,
    75% {
        transform: scaleY(0.1);
    }
}

.mouth {
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 8px;
    background: #c9756b;
    border-radius: 0 0 10px 10px;
    transition: all 0.3s ease;
}

.mouth.welcome {
    border-radius: 0 0 10px 10px;
    height: 8px;
}

.mouth.thinking {
    border-radius: 50%;
    width: 10px;
    height: 10px;
}

.mouth.happy {
    border-radius: 0 0 15px 15px;
    height: 12px;
    width: 25px;
    background: linear-gradient(180deg, #fff 30%, #c9756b 30%);
}

.mouth.concerned {
    border-radius: 10px 10px 0 0;
    height: 6px;
}

.body {
    position: absolute;
    bottom: 0;
    width: 70%;
    height: 30%;
    background: linear-gradient(180deg, #2d5a7b, #1a365d);
    border-radius: 40% 40% 0 0;
}

.book-stack {
    position: absolute;
    bottom: 5px;
    right: 5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mini-book {
    width: 15px;
    height: 4px;
    border-radius: 1px;
}

.mini-book:nth-child(1) {
    background: #e74c3c;
}

.mini-book:nth-child(2) {
    background: #3498db;
}

.mini-book:nth-child(3) {
    background: #2ecc71;
}

.name-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(145deg, #1a365d, #0f3460);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    border: 1px solid rgba(201, 162, 39, 0.3);
}

.badge-icon {
    font-size: 0.9rem;
}

.badge-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #c9a227;
    font-family: var(--font-heading);
}

/* Dialogue Bubble */
.dialogue-bubble {
    flex: 1;
    background: linear-gradient(145deg, #fff, #f8f6f0);
    border-radius: 20px;
    padding: 1.25rem 1.5rem;
    position: relative;
    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(201, 162, 39, 0.2);
    min-height: 80px;
}

.bubble-content p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    color: #1a365d;
    font-family: var(--font-body);
}

.cursor {
    display: inline-block;
    animation: cursorBlink 0.8s infinite;
    color: #c9a227;
    font-weight: bold;
}

@keyframes cursorBlink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}

.bubble-tail {
    position: absolute;
    left: -10px;
    top: 30px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 15px solid #fff;
    filter: drop-shadow(-3px 0 2px rgba(0, 0, 0, 0.1));
}

/* ===== DESK SURFACE ===== */
.desk-surface {
    position: relative;
    background: linear-gradient(180deg, #8b5a2b 0%, #6d4521 100%);
    border-radius: 16px;
    padding: 2rem;
    box-shadow:
        0 15px 40px rgba(0, 0, 0, 0.3),
        inset 0 2px 4px rgba(255, 255, 255, 0.1);
}

.desk-items {
    position: absolute;
    top: -15px;
    right: 30px;
    display: flex;
    gap: 1rem;
}

.desk-lamp {
    width: 30px;
    height: 40px;
    background: linear-gradient(180deg, #ffd700 0%, #ffb700 100%);
    clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.stamp-pad {
    width: 40px;
    height: 25px;
    background: linear-gradient(145deg, #c9a227, #a88720);
    border-radius: 4px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* ===== LIBRARY CARD ===== */
.library-card {
    background: linear-gradient(145deg, #fffef9, #f5f0e8);
    border-radius: 16px;
    padding: 2rem;
    position: relative;
    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(201, 162, 39, 0.3);
    overflow: hidden;
}

.library-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #c9a227, #ffd700, #c9a227);
}

.card-header {
    text-align: center;
    margin-bottom: 1.5rem;
}

.card-logo {
    width: 60px;
    height: 60px;
    margin: 0 auto 0.75rem;
    background: linear-gradient(145deg, #1a365d, #0f3460);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 8px 20px rgba(26, 54, 93, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.logo-icon {
    font-size: 1.75rem;
}

.card-title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    color: #1a365d;
    margin: 0 0 0.25rem;
}

.card-subtitle {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
}

/* Form Fields */
.card-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: #1a365d;
}

.field-icon {
    font-size: 1rem;
}

.form-field input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e0dcd4;
    border-radius: 10px;
    font-size: 1rem;
    font-family: var(--font-body);
    background: #fff;
    color: #1a365d;
    transition: all 0.3s ease;
}

.form-field input:focus {
    outline: none;
    border-color: #c9a227;
    box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.15);
}

.form-field input::placeholder {
    color: #999;
}

.password-input {
    position: relative;
    display: flex;
    align-items: center;
}

.password-input input {
    padding-right: 3rem;
}

.toggle-password {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.toggle-password:hover {
    opacity: 1;
}

/* Submit Button */
.submit-btn {
    margin-top: 0.5rem;
    padding: 1rem 2rem;
    background: linear-gradient(145deg, #c9a227, #a88720);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow:
        0 8px 20px rgba(201, 162, 39, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
        0 12px 30px rgba(201, 162, 39, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.submit-btn:active:not(:disabled) {
    transform: translateY(0);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.btn-icon {
    font-size: 1.25rem;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Card Footer */
.card-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid #e0dcd4;
}

.toggle-mode-btn {
    background: none;
    border: none;
    color: #1a365d;
    font-size: 0.95rem;
    font-family: var(--font-body);
    cursor: pointer;
    transition: color 0.2s ease;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 4px;
}

.toggle-mode-btn:hover {
    color: #c9a227;
    text-decoration-color: #c9a227;
}

/* Card Stamp */
.card-stamp {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    opacity: 0.2;
    transform: rotate(15deg);
    transition: all 0.5s ease;
}

.card-stamp.stamped {
    opacity: 0.8;
    animation: stampEffect 0.5s ease;
}

@keyframes stampEffect {
    0% {
        transform: rotate(15deg) scale(2);
        opacity: 0;
    }

    50% {
        transform: rotate(15deg) scale(0.9);
    }

    100% {
        transform: rotate(15deg) scale(1);
        opacity: 0.8;
    }
}

/* ===== VALIDATION STYLES ===== */
.form-field.has-error input {
    border-color: #e74c3c;
}

.input-error {
    border-color: #e74c3c !important;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15) !important;
}

.input-valid {
    border-color: #27ae60 !important;
}

.field-error {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #e74c3c;
    font-weight: 500;
}

/* Password Strength Indicator */
.password-strength {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.strength-bar {
    flex: 1;
    height: 6px;
    background: #e0dcd4;
    border-radius: 3px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    border-radius: 3px;
    transition: all 0.3s ease;
}

.strength-label {
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 70px;
    text-align: right;
}

/* Password Requirements */
.password-requirements {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(26, 54, 93, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(26, 54, 93, 0.1);
}

.requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #666;
    transition: all 0.2s ease;
}

.requirement.passed {
    color: #27ae60;
}

.requirement.passed .req-text {
    text-decoration: line-through;
    opacity: 0.7;
}

.req-icon {
    font-size: 0.7rem;
}

.req-text {
    line-height: 1.3;
}

/* Fade transition for errors */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* ===== FOOTER ===== */
.login-footer {
    text-align: center;
    margin-top: 2rem;
    opacity: 0.6;
}

.login-footer p {
    color: #f5f0e8;
    font-size: 0.85rem;
    margin: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .login-container {
        padding: 1rem;
    }

    .library-desk {
        padding: 1.5rem;
    }

    .librarian-section {
        flex-direction: column;
        align-items: center;
    }

    .dialogue-bubble {
        margin-left: 0;
    }

    .bubble-tail {
        display: none;
    }

    .avatar-frame {
        width: 80px;
        height: 80px;
    }

    .card-title {
        font-size: 1.25rem;
    }

    .desk-items {
        display: none;
    }
}
</style>
