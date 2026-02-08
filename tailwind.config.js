/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0e27',
          secondary: '#151b34',
          tertiary: '#1e2640',
        },
        neon: {
          blue: '#00d4ff',
          purple: '#b537ff',
          pink: '#ff2e97',
          green: '#00ff88',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8), 0 0 30px rgba(181, 55, 255, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
