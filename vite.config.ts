import { defineConfig, type UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';

// Fix for local ISP DNS hijacking of Supabase domain:
// Some ISPs poison UDP DNS queries for *.supabase.co to their captive portal IP, causing ECONNRESET during TLS handshake.
// We resolve to Cloudflare's official anycast edge IP (104.18.38.10) with SNI intact.
try {
  const originalLookup = dns.lookup;
  dns.lookup = (hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (hostname.endsWith('.supabase.co')) {
      if (options && options.all) {
        return callback(null, [{ address: '104.18.38.10', family: 4 }]);
      }
      return callback(null, '104.18.38.10', 4);
    }
    return originalLookup(hostname, options, callback);
  };
} catch {
  // Ignore in environments without dns module
}

interface VitestConfig extends UserConfig {
  test?: InlineConfig;
}

const targetSupabaseUrl = process.env.VITE_SUPABASE_URL || 'https://psyruoujpaitwiembsex.supabase.co';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/supabase-proxy': {
        target: targetSupabaseUrl,
        changeOrigin: true,
        secure: true,
        headers: {
          host: targetSupabaseUrl.replace(/^https?:\/\//, ''),
        },
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
    testTimeout: 15000,
    fileParallelism: false,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
  },
} as VitestConfig);
