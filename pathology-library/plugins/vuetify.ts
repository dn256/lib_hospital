import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        ssr: true,
        components,
        directives,
        theme: {
            defaultTheme: 'pathologyTheme',
            themes: {
                pathologyTheme: {
                    dark: false,
                    colors: {
                        // Medical/Library inspired color palette
                        primary: '#1a365d',      // Deep navy blue - professional, trustworthy
                        secondary: '#2d4a3e',    // Forest green - medical, healing
                        accent: '#c9a227',       // Gold accent - premium, academic
                        background: '#faf8f5',   // Warm off-white - like aged paper
                        surface: '#ffffff',
                        'surface-variant': '#f5f0e8',
                        error: '#b71c1c',
                        warning: '#f57c00',
                        info: '#0288d1',
                        success: '#2e7d32',
                        'on-primary': '#ffffff',
                        'on-secondary': '#ffffff',
                        'on-background': '#1a1a1a',
                        'on-surface': '#1a1a1a',
                    }
                },
                dark: {
                    dark: true,
                    colors: {
                        primary: '#4a7c9b',
                        secondary: '#4a7a6a',
                        accent: '#d4af37',
                        background: '#121212',
                        surface: '#1e1e1e',
                        'surface-variant': '#2d2d2d',
                    }
                }
            }
        },
        defaults: {
            VBtn: {
                rounded: 'lg',
                elevation: 0,
            },
            VCard: {
                rounded: 'lg',
                elevation: 2,
            },
            VTextField: {
                variant: 'outlined',
                density: 'comfortable',
            },
            VSelect: {
                variant: 'outlined',
                density: 'comfortable',
            },
        }
    })

    nuxtApp.vueApp.use(vuetify)
})
