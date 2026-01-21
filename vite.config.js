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
            // Proxy /api/ipc to the real INDEC API for local development
            // This mimics the Vercel Serverless Function behavior locally
            '/api/ipc': {
                target: 'https://apis.datos.gob.ar',
                changeOrigin: true,
                rewrite: () => '/series/api/series?ids=148.3_INIVELGEN_D_A_0_26&limit=12&format=json',
                secure: false
            }
        }
    }
})
