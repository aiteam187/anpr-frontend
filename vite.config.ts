import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8000'
  const mediamtxPort = env.VITE_MEDIAMTX_PORT || '8889'
  const mediamtxTarget = `http://${new URL(apiTarget).hostname}:${mediamtxPort}`

  return {
    plugins: [react(), basicSsl()],
    server: {
      https: {},
      proxy: {
        // Service worker + push endpoints must be same-origin as the page for
        // the browser to allow registering it — proxying keeps the browser's
        // perceived origin as this dev server while forwarding to the real API.
        '/sw.js': { target: apiTarget, changeOrigin: true },
        '/push': { target: apiTarget, changeOrigin: true },
        // The backend and the camera media server (MediaMTX) are plain HTTP —
        // since this dev server is HTTPS-only (required for push), any direct
        // browser request to them is mixed content and gets blocked/fails TLS.
        // Proxying keeps every browser-side request same-origin HTTPS; the
        // proxy itself talks plain HTTP to the real servers server-side,
        // which isn't subject to the browser's mixed-content policy.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/static': { target: apiTarget, changeOrigin: true },
        '/whep': {
          target: mediamtxTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/whep/, ''),
        },
      },
    },
  }
})
