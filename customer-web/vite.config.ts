import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // Root path for Amplify deployment

  // Performance optimizations
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          amplify: ['aws-amplify'],
          state: ['zustand'],
          motion: ['framer-motion'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify with esbuild (faster than terser)
    minify: 'esbuild',
    // Generate source maps for production debugging
    sourcemap: false,
    // Chunk size warning at 300KB
    chunkSizeWarningLimit: 300,
  },

  // Dev server
  server: {
    port: 5173,
    // Proxy API requests in development
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // Preview server (for testing prod builds locally)
  preview: {
    port: 4173,
  },
})
