import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Content-Security-Policy': `
        default-src 'self' https://*.supabase.co https://*.openai.com;
        connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.openai.com;
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https://* http://*;
        font-src 'self' data:;
      `.replace(/\s+/g, ' ').trim()
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env.SITE_URL': JSON.stringify(process.env.SITE_URL),
    'process.env.REDIRECT_URL': JSON.stringify(process.env.REDIRECT_URL),
    'process.env.TEST': JSON.stringify('TEST')
  }
}))