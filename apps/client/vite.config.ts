import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            // ----------------------------------------------------------------------
            // CRITICAL SECURITY HEADERS FOR WEBCONTAINERS
            // ----------------------------------------------------------------------
            // Required for SharedArrayBuffer support in the browser.
            // Without these, navigator.serviceWorker and WebAssembly will fail.
            // ----------------------------------------------------------------------
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },
});
