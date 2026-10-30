import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
export default defineConfig({
  base:'./',
  plugins:[react()],
  server:{host:'0.0.0.0',allowedHosts:['.e2b.app'],watch:{ignored:['**/.venv/**','**/content/source/**']}}, preview:{host:'0.0.0.0',allowedHosts:['.e2b.app']},
  build:{rollupOptions:{input:{book:resolve(import.meta.dirname,'index.html'),machine:resolve(import.meta.dirname,'machine-prototype.html')}}}
})
