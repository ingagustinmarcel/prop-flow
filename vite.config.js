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
    }
})
