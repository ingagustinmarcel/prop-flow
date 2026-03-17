import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        proxy: {
            // Proxy /api/ipc to Argly
            '/api/ipc': {
                target: 'https://api.argly.com.ar',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core - changes rarely, long cache TTL
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Charts - heavy library, separate chunk
                    'vendor-charts': ['recharts'],
                    // Supabase - separate chunk
                    'vendor-supabase': ['@supabase/supabase-js'],
                    // Date utilities - separate chunk
                    'vendor-dates': ['date-fns'],
                    // PDF generation - only used in receipts, lazily included
                    'vendor-pdf': ['jspdf'],
                    // i18n - separate chunk
                    'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                }
            }
        },
        // Warn when a chunk exceeds 500kb
        chunkSizeWarningLimit: 500,
    }
})

