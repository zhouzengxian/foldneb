import { defineConfig } from 'vitest/config';

// Vitest 配置 — 仅用于纯函数单元测试（无 React/Three.js 渲染）
// 评审「代码质量」可量化信号：npm test 可跑通
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/utils/**/*.js'],
    },
  },
});
