/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	// @ts-expect-error their types are wrong
	plugins: [react()],
	css: { postcss: { plugins: [] } },
})
