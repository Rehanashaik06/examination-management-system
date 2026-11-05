import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        exams: resolve(__dirname, 'exams.html'),
        questions: resolve(__dirname, 'questions.html'),
        students: resolve(__dirname, 'students.html'),
        results: resolve(__dirname, 'results.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
});
