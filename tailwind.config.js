/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '3xl': '1.5rem',
        '2xl': '1.25rem',
      },
      colors: {
        ios: {
          blue: '#007aff',
          green: '#34c759',
          indigo: '#5856d6',
          orange: '#ff9500',
          pink: '#ff2d55',
          purple: '#af52de',
          red: '#ff3b30',
          teal: '#5ac8fa',
          yellow: '#ffcc00',
          gray: {
            100: '#f2f2f7',
            200: '#e5e5ea',
            300: '#d1d1d6',
            400: '#c7c7cc',
            500: '#aeae82',
            600: '#8e8e93',
            700: '#636366',
            800: '#48484a',
            900: '#2c2c2e',
            950: '#1c1c1e',
          },
        },
        ink: {
          950: 'var(--color-bg-main)',
          900: 'var(--color-bg-card)',
          850: 'var(--color-bg-card-alt)',
          800: 'var(--color-border)',
          700: 'var(--color-border-subtle)',
          600: 'var(--color-border-muted)',
          500: 'var(--color-text-dim)',
          400: 'var(--color-text-muted)',
          300: 'var(--color-text-subtle)',
          200: 'var(--color-text-main)',
        },
        gold: {
          50: '#fffcf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#ff9500',
          500: '#e08200',
          600: '#b86800',
          700: '#8f4f00',
          800: '#663700',
        },
        flame: {
          400: '#ff453a',
          500: '#ff3b30',
          600: '#d70015',
        },
        emerald2: {
          400: '#30d158',
          500: '#34c759',
          600: '#248a3d',
        },
        azure: {
          400: '#0a84ff',
          500: '#007aff',
          600: '#0056b3',
        },
        violet2: {
          400: '#5e5ce6',
          500: '#5856d6',
          600: '#3d3b9e',
        },
      },
      boxShadow: {
        'ios-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'ios-lg': '0 12px 32px rgba(0, 0, 0, 0.12)',
        'ios-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float-up': 'float-up 1.5s ease-out forwards',
        'shimmer': 'shimmer 2.5s linear infinite',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(1.15)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(-80px) scale(1.2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
