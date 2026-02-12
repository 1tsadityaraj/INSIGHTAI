import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: {
      // Configure HMR to handle connection failures gracefully
      clientPort: 5173,
      // Show overlay only for real errors, not connection issues
      overlay: {
        errors: true,
        warnings: false,
      },
      // Reduce protocol errors by using a more stable connection
      protocol: 'ws',
      // Add timeout to prevent hanging connections
      timeout: 30000,
    },
    // Prevent MIME type errors
    fs: {
      strict: false,
    },
  },
  // Suppress worker-related build warnings
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'EVAL' || warning.message?.includes('worker')) {
          return
        }
        warn(warning)
      },
    },
  },
  // Optimize for development
  optimizeDeps: {
    exclude: [],
  },
})
