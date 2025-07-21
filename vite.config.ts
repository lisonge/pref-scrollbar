import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['http://*/*', 'https://*/*'],
        'run-at': 'document-start',
      },
    }),
  ],
  esbuild: {
    legalComments: 'none',
  },
});
