<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

const { init } = useAuth()
onMounted(() => init())
</script>

<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<style>
/* Global styles - Library/Medical theme */
:root {
  --font-heading: 'Crimson Pro', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: transparent;
  /* Made transparent for 3D background */
  color: #1a1a1a;
  line-height: 1.6;
}

.v-application,
.v-main,
.v-application__wrap {
  background-color: transparent !important;
  background: transparent !important;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f0e8;
}

::-webkit-scrollbar-thumb {
  background: #c9a227;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a88720;
}

/* Selection color */
::selection {
  background: rgba(201, 162, 39, 0.3);
  color: #1a365d;
}

/* Link styles */
a {
  color: #1a365d;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #c9a227;
}

/* Smooth transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
