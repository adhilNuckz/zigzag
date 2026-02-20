/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lime: {
          50: '#f0ffe0',
          100: '#d4ffa0',
          200: '#b8ff60',
          300: '#9cff20',
          400: '#80ff00',
          500: '#39ff14', // Primary neon lime
          600: '#2ecc10',
          700: '#23990c',
          800: '#186608',
          900: '#0d3304',
        },
        dark: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#111111',
          600: '#1a1a1a',
          500: '#222222',
          400: '#2a2a2a',
          300: '#333333',
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"Courier New"', 'monospace'],
        pixel: ['"Press Start 2P"', '"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 3s infinite',
        'scanline': 'scanline 8s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-in',
        'slideUp': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #39ff14, 0 0 10px #39ff14' },
          '100%': { textShadow: '0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 40px #39ff14' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
          '52%': { opacity: '0.8' },
          '54%': { opacity: '0.95' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px #39ff14, 0 0 10px #39ff1440',
        'neon-lg': '0 0 10px #39ff14, 0 0 20px #39ff1440, 0 0 40px #39ff1420',
      },
    },
  },
  plugins: [],
};
