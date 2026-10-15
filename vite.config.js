import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: './', plugins: [react()] })   // relative paths: works on any static host or subpath
