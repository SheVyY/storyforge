import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'solid-js': ['solid-js'],
          'router': ['@solidjs/router'],
          'storage': ['dexie'],
        }
      },
      external: ['react', 'react-dom']
    }
  },
  resolve: {
    alias: {
      'react': 'solid-js',
      'react-dom': 'solid-js'
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  optimizeDeps: {
    exclude: ['@webllm/web-llm']
  }
})
