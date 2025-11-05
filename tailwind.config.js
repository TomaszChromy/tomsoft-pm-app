// TomSoft PM App - Tailwind Configuration
// Cyberpunk/Tech design system

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cyberpunk color palette
        neon: {
          cyan: '#00ffff',
          magenta: '#ff00ff',
          orange: '#ff6b35',
          blue: '#0080ff',
          purple: '#8b5cf6',
          green: '#39ff14',
        },
        dark: {
          bg: '#0a0a0f',
          darker: '#050508',
          card: '#111827',
          border: '#374151',
        },
        primary: {
          50: '#e0ffff',
          100: '#b3ffff',
          200: '#80ffff',
          300: '#4dffff',
          400: '#1affff',
          500: '#00ffff',
          600: '#00e6e6',
          700: '#00cccc',
          800: '#00b3b3',
          900: '#009999',
        },
        accent: {
          50: '#fff0e6',
          100: '#ffd9b3',
          200: '#ffbf80',
          300: '#ffa64d',
          400: '#ff8c1a',
          500: '#ff6b35',
          600: '#e65a2e',
          700: '#cc4a26',
          800: '#b3391f',
          900: '#992917',
        },
      },
      fontFamily: {
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        heading: ['Orbitron', 'monospace'],
        accent: ['Orbitron', 'monospace'],
        body: ['Tahoma', 'Rajdhani', 'sans-serif'],
      },
      gridTemplateColumns: {
        'golden': '1fr 1.618fr',
        'golden-reverse': '1.618fr 1fr',
      },
      spacing: {
        'fib-1': '1rem',
        'fib-2': '1.618rem',
        'fib-3': '2.618rem',
        'fib-4': '4.236rem',
        'fib-5': '6.854rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'pulseGlow': 'pulseGlow 2s ease-in-out infinite',
        'neonPulse': 'neonPulse 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s infinite',
        'lineFlow': 'lineFlow 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.5)' 
          },
        },
        neonPulse: {
          '0%, 100%': {
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px #00ffff'
          },
          '50%': {
            textShadow: '0 0 2px currentColor, 0 0 5px currentColor, 0 0 8px currentColor, 0 0 12px #00ffff'
          },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        lineFlow: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(100vw)', opacity: '0' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px currentColor, 0 0 20px currentColor, 0 0 35px currentColor',
        'neon-sm': '0 0 2px currentColor, 0 0 10px currentColor',
        'neon-lg': '0 0 10px currentColor, 0 0 40px currentColor, 0 0 80px currentColor',
      },
    },
  },
  plugins: [],
}

module.exports = config
