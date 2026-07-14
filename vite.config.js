import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiBase = env.VITE_API_URL || 'http://localhost:3000/api';
    const proxyTarget = apiBase.replace(/\/api\/?$/, '');

    return {
        base: '/',
        build: {
            outDir: 'dist',
            rollupOptions: {
                output: {
                    manualChunks: {
                        vue: ['vue', 'vue-router'],
                    },
                },
            },
        },
        plugins: [vue()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@plugins': path.resolve(__dirname, './src/plugins'),
                '@sass': path.resolve(__dirname, './src/assets/sass'),
                '@mixins': path.resolve(__dirname, './src/mixins'),
            },
        },
        optimizeDeps: {
            include: ['axios'],
        },
        server: {
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/uploads': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
