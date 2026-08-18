import { defineConfig, loadEnv } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8000'
  const mediamtxPort = env.VITE_MEDIAMTX_PORT || '8889'
  const mediamtxTarget = `http://${new URL(apiTarget).hostname}:${mediamtxPort}`

  // @vitejs/plugin-basic-ssl's auto-generated cert only covers "localhost" —
  // opening the dashboard via the LAN IP (e.g. https://192.168.10.117:5174,
  // needed for phones/other devices and for the cameras' own network path)
  // hits a hostname-mismatch cert error rather than the generic self-signed
  // warning, and Chrome refuses to register a service worker in that case
  // even after you click through the warning on the page itself — hence
  // "Failed to register a ServiceWorker ... SSL certificate error" on the
  // Push Notifications toggle. certs/dev-cert.pem covers localhost, 127.0.0.1,
  // AND the LAN IP as SANs (see certs/san.cnf), so use it when present;
  // basicSsl() stays as a fallback for anyone who hasn't generated one.
  const certPath = resolve(import.meta.dirname, 'certs/dev-cert.pem')
  const keyPath = resolve(import.meta.dirname, 'certs/dev-key.pem')
  const hasCustomCert = existsSync(certPath) && existsSync(keyPath)

  return {
    plugins: [react(), ...(hasCustomCert ? [] : [basicSsl()])],
    server: {
      https: hasCustomCert
        ? { cert: readFileSync(certPath), key: readFileSync(keyPath) }
        : {},
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
