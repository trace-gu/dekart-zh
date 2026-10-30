import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      {
        // Keep unit tests on the same Kepler Chinese overrides as the app build.
        find: /^@kepler\.gl\/localization$/,
        replacement: path.resolve('src/client/i18n/keplerLocalization.js')
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      // Optimized CommonJS entries already provide Vite's default-export interop.
      interopDefault: false,
      optimizer: {
        web: {
          enabled: true,
          // Bundle Kepler's CommonJS/ESM graph while preserving Node-only loaders.
          include: [
            '@kepler.gl/layers', '@kepler.gl/reducers',
            'dekart-proto/dekart_pb', 'dekart-proto/dekart_pb_service'
          ],
          exclude: ['apache-arrow', 'thrift', 'parquet-wasm', 'h3-js']
        }
      }
    },
    setupFiles: './src/setupTests.js' // Optional: Use your existing setupTests.js
  }
})
