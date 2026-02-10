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
      // Disable error overlay for HMR connection issues
      overlay: false,
      // Reduce protocol errors by using a more stable connection
      protocol: 'ws',
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
