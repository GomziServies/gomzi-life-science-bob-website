import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Read from the shell or from .env / .env.<mode>, so a machine without a local fg-api can point the proxy at a live one.
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  const API_TARGET = env.VITE_API_PROXY ?? 'http://localhost:80' // fg-api (the Node server that now holds the editor backend)
  const CRM_TARGET = env.VITE_CRM_PROXY ?? API_TARGET

  return {
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Loaded with import() when a video is made: listed so the dev server bundles them at start instead of discovering them
  // mid-session, which reloads the page under a running test.
  optimizeDeps: { include: ['mp4-muxer', 'webm-muxer', 'gifenc'] },
  server: {
    port: 5173,
    // Same-origin in dev so session + CSRF cookies just work.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/media': { target: API_TARGET, changeOrigin: true },
      // The company's files in the S3 bucket (label pictures), read through the dev server so they are same-origin
      '/aws-files': { target: 'https://files.fggroup.in', changeOrigin: true, secure: true, rewrite: (p) => p.replace(/^\/aws-files/, '') },
      // The shop's inquiry/order calls go to the CRM, which is the same fg-api unless VITE_CRM_PROXY says otherwise.
      '/crm': { target: CRM_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/crm/, '') },
      '/admin': { target: API_TARGET, changeOrigin: true },
      '/static': { target: API_TARGET, changeOrigin: true },
      // Real-time co-editing: fg-api upgrades the connection.
      '/ws': { target: API_TARGET, changeOrigin: true, ws: true },
    },
  },
  build: {
    // dist/.vite/manifest.json: the chunk graph that scripts/bundleReport.mjs measures against the budgets.
    manifest: true,
    rollupOptions: {
      // The second page of the app: the presenter view window that "Present with notes" opens (a plain page, no router).
      input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), 'presenter-view': fileURLToPath(new URL('./presenter-view.html', import.meta.url)) },
      output: {
        // The editor's entry module gets a recognisable file name: scripts/bundleReport.mjs finds the chunk by it.
        chunkFileNames: (chunk) => (chunk.moduleIds.some((id) => id.endsWith('/src/editor/index.tsx')) ? 'assets/editor-[hash].js' : 'assets/[name]-[hash].js'),
        // Fabric is the editor's one large dependency (about 300 kB): in its own chunk it is cached across releases
        // of the app and only downloaded together with the editor.
        manualChunks: (id) => (id.includes('/node_modules/fabric/') ? 'fabric' : undefined),
      },
    },
  },
  }
})
