import { skeleton } from '@skeletonlabs/tw-plugin';
import { fileURLToPath } from 'url';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    fileURLToPath(new URL('./node_modules/@skeletonlabs/skeleton/dist/**/*.{html,js,svelte,ts}', import.meta.url))
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        'primary-light': '#eff6ff',
        ink: '#0f172a',
        muted: '#64748b',
        line: '#e2e8f0',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [skeleton({ themes: ['skeleton'] })]
};
