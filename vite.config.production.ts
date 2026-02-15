/**
 * Vite Production Configuration
 * Optimizations for production build
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Babel plugins for production optimization
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (better than gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'utils': ['./utils/balancingEngine.ts'],
          
          // Split screens into separate chunks
          'screens-main': [
            './screens/Dashboard.tsx',
            './screens/WelcomeScreen.tsx',
            './screens/LoginScreen.tsx',
          ],
          'screens-admin': [
            './screens/AdminDashboard.tsx',
            './screens/MemberManagement.tsx',
            './screens/FinancialReports.tsx',
          ],
          'screens-match': [
            './screens/MatchDetails.tsx',
            './screens/MatchCreate.tsx',
            './screens/TeamList.tsx',
          ],
          'screens-venue': [
            './screens/VenueList.tsx',
            './screens/VenueDetails.tsx',
            './screens/VenueOwnerDashboard.tsx',
          ],
        },
        
        // Asset file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Target modern browsers
    target: 'es2020',
    
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
  
  // Server configuration
  server: {
    port: 3002,
    strictPort: true,
    host: true,
    open: false,
    cors: true,
  },
  
  // Preview configuration
  preview: {
    port: 3003,
    strictPort: true,
    host: true,
    open: false,
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Base public path
  base: '/',
});
