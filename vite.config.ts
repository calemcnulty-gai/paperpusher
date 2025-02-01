import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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