/**
 * Vite 빌드 및 개발 서버 설정 파일.
 * - React + TypeScript 플러그인
 * - 개발 서버에서 기상청 API CORS 우회를 위한 프록시 설정
 * - Vitest 테스트 환경 설정
 */
/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 프로젝트 루트(../../)의 .env 파일에서 API 키를 로드
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const apiKey = env.API_KEY_DATA_GO_KR || '';

  return {
    plugins: [react()],

    server: {
      port: 3000,
      proxy: {
        // /api 경로를 기상청 API로 프록시 (CORS 우회 + API 키 자동 주입)
        '/api': {
          target: 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const separator = proxyReq.path.includes('?') ? '&' : '?';
              proxyReq.path += `${separator}serviceKey=${apiKey}`;
            });
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/__tests__/setup.ts',
      css: true,
    },
  };
});
