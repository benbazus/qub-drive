import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // your backend API base URL
        changeOrigin: true,
        secure: false,
        // optional: rewrite '/api' → '' if your backend doesn’t use it
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // server: {
  //   port: 5173, // Specify the development server port
  //   open: true,  // Automatically open the app in the browser on server start

  //   // Example proxy configuration (uncomment if you need to proxy API requests)
  //   proxy: {
  //     //   // String shorthand: '/api' -> 'http://localhost:8080/api'
  //     '/api': 'http://localhost:5001',
  //     //
  //     //   // With options:
  //     //   '/api/v2': {
  //     //     target: 'http://your-api-server.com',
  //     //     changeOrigin: true, // Needed for virtual hosted sites
  //     //     rewrite: (path) => path.replace(/^\/api\/v2/, ''), // Rewrite path
  //     //   },
  //   }
  // },
})
