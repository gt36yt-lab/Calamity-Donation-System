import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // stellar-sdk and some of its deps reference the Node `global` object.
    // Vite doesn't shim it by default, so define it as `globalThis`.
    global: 'globalThis',
  },
})
