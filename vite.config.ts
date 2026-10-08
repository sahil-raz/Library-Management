import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function suppressDisconnectReload(): Plugin {
  return {
    name: 'suppress-disconnect-reload',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) {
        return code.replace(
          /case\s+"vite:ws:disconnect":[\s\S]*?location\.reload\(\);/m,
          `case "vite:ws:disconnect": {
            console.log("[vite] Silent background reconnect");`
        );
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), suppressDisconnectReload()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    allowedHosts: true,
  }
});
