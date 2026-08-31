<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Scroll state
const isPaused = ref(false)
const scrollY = ref(0)
const pauseThreshold = 100 // Pause after scrolling 100px

const seededValue = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280
const particles = Array.from({ length: 20 }, (_, index) => {
    const number = index + 1
    return {
        number,
        style: {
            left: `${seededValue(number * 3) * 100}%`,
            top: `${seededValue(number * 5) * 100}%`,
            animationDelay: `${number * 0.5}s`,
            animationDuration: `${10 + seededValue(number * 7) * 15}s`,
            width: `${3 + seededValue(number * 11) * 4}px`,
            height: `${3 + seededValue(number * 13) * 4}px`,
        },
    }
})

const handleScroll = () => {
    if (typeof window !== 'undefined') {
        scrollY.value = window.scrollY
        isPaused.value = scrollY.value > pauseThreshold
    }
}

onMounted(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // Check initial state
    }
})

onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll)
    }
})
</script>

<template>
    <div class="animated-background" :class="{ paused: isPaused }">
        <!-- Floating DNA Strands using CSS -->
        <div class="dna-container">
            <div class="dna-strand strand-1">
                <div class="helix" v-for="i in 12" :key="'h1-' + i" :style="`--i: ${i}`">
                    <div class="nucleotide left"></div>
                    <div class="bridge"></div>
                    <div class="nucleotide right"></div>
                </div>
            </div>
            <div class="dna-strand strand-2">
                <div class="helix" v-for="i in 12" :key="'h2-' + i" :style="`--i: ${i}`">
                    <div class="nucleotide left"></div>
                    <div class="bridge"></div>
                    <div class="nucleotide right"></div>
                </div>
            </div>
            <div class="dna-strand strand-3">
                <div class="helix" v-for="i in 12" :key="'h3-' + i" :style="`--i: ${i}`">
                    <div class="nucleotide left"></div>
                    <div class="bridge"></div>
                    <div class="nucleotide right"></div>
                </div>
            </div>
            <div class="dna-strand strand-4">
                <div class="helix" v-for="i in 12" :key="'h4-' + i" :style="`--i: ${i}`">
                    <div class="nucleotide left"></div>
                    <div class="bridge"></div>
                    <div class="nucleotide right"></div>
                </div>
            </div>
        </div>

        <!-- Floating particles -->
        <div class="particles">
            <div
                v-for="particle in particles"
                :key="particle.number"
                class="particle"
                :style="particle.style"
            ></div>
        </div>

        <!-- Microscope cells -->
        <div class="cells">
            <div class="cell cell-1"></div>
            <div class="cell cell-2"></div>
            <div class="cell cell-3"></div>
        </div>
    </div>
</template>

<style scoped>
.animated-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    transition: opacity 0.5s ease;
}

/* When paused, reduce opacity and stop animations */
.animated-background.paused {
    opacity: 0.3;
}

.animated-background.paused .dna-strand,
.animated-background.paused .helix,
.animated-background.paused .particle,
.animated-background.paused .cell {
    animation-play-state: paused;
}

/* =====================
   DNA STRANDS
   ===================== */
.dna-container {
    position: absolute;
    inset: 0;
}

.dna-strand {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: dnaFloat 20s ease-in-out infinite;
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: opacity 0.5s ease;
}

.strand-1 {
    top: 10%;
    right: 10%;
    transform: rotate(-15deg) scale(0.8);
    animation-delay: 0s;
}

.strand-2 {
    top: 40%;
    left: 5%;
    transform: rotate(20deg) scale(0.6);
    animation-delay: -5s;
    opacity: 0.7;
}

.strand-3 {
    bottom: 15%;
    right: 15%;
    transform: rotate(-25deg) scale(0.5);
    animation-delay: -10s;
    opacity: 0.5;
}

.strand-4 {
    top: 60%;
    left: 60%;
    transform: rotate(10deg) scale(0.4);
    animation-delay: -15s;
    opacity: 0.4;
}

.helix {
    display: flex;
    align-items: center;
    gap: 4px;
    animation: helixSpin 6s linear infinite;
    animation-delay: calc(var(--i) * -0.3s);
    transition: transform 0.5s ease;
}

.nucleotide {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: 0 0 20px currentColor;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.nucleotide.left {
    background: linear-gradient(135deg, #00e5ff, #00acc1);
    color: #00e5ff;
}

.nucleotide.right {
    background: linear-gradient(135deg, #ffc400, #ff9800);
    color: #ffc400;
}

.bridge {
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg,
            rgba(0, 229, 255, 0.6),
            rgba(129, 212, 250, 0.4),
            rgba(255, 196, 0, 0.6));
    border-radius: 2px;
    transition: opacity 0.3s ease;
}

/* Paused state - reduce glow */
.animated-background.paused .nucleotide {
    box-shadow: 0 0 8px currentColor;
}

/* =====================
   FLOATING PARTICLES
   ===================== */
.particles {
    position: absolute;
    inset: 0;
}

.particle {
    position: absolute;
    background: radial-gradient(circle, rgba(201, 162, 39, 0.6), transparent);
    border-radius: 50%;
    animation: particleFloat linear infinite;
    transition: opacity 0.5s ease;
}

/* =====================
   MICROSCOPE CELLS
   ===================== */
.cells {
    position: absolute;
    inset: 0;
}

.cell {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(129, 212, 250, 0.15);
    animation: cellPulse 8s ease-in-out infinite;
    transition: opacity 0.5s ease;
}

.cell-1 {
    width: 300px;
    height: 300px;
    top: -50px;
    right: -100px;
    animation-delay: 0s;
}

.cell-2 {
    width: 200px;
    height: 200px;
    bottom: 20%;
    left: -50px;
    animation-delay: -3s;
}

.cell-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    right: 20%;
    animation-delay: -5s;
    border-color: rgba(255, 196, 0, 0.1);
}

/* =====================
   ANIMATIONS
   ===================== */
@keyframes dnaFloat {

    0%,
    100% {
        transform: translateY(0) rotate(-15deg);
    }

    50% {
        transform: translateY(-20px) rotate(-10deg);
    }
}

@keyframes helixSpin {
    0% {
        transform: rotateY(0deg) translateX(0);
    }

    25% {
        transform: rotateY(90deg) translateX(10px);
    }

    50% {
        transform: rotateY(180deg) translateX(0);
    }

    75% {
        transform: rotateY(270deg) translateX(-10px);
    }

    100% {
        transform: rotateY(360deg) translateX(0);
    }
}

@keyframes particleFloat {
    0% {
        transform: translateY(100vh) rotate(0deg);
        opacity: 0;
    }

    10% {
        opacity: 0.8;
    }

    90% {
        opacity: 0.8;
    }

    100% {
        transform: translateY(-100vh) rotate(360deg);
        opacity: 0;
    }
}

@keyframes cellPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.3;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.5;
    }
}
</style>
