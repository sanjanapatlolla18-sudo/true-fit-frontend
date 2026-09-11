import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Pinned: the backend allow-list is per-origin, so a silent fallback to the
  // next free port would break CORS. Fail loudly instead.
  server: {
    port: 5173,
    strictPort: true,
  },
})