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
        heading: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '3xl': '1.5rem',
        '2xl': '1.25rem',
      },
      colors: {
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
          400: '#d9822b',
          500: '#b86a1f',
          600: '#965416',
          700: '#754110',
          800: '#522c09',
        },
        flame: {
          400: '#d4564e',
          500: '#bd3d35',
          600: '#9a2821',
        },
        emerald2: {
          400: '#4ca366',
          500: '#3d8c52',
          600: '#296a3c',
        },
        azure: {
          400: '#4d84c4',
          500: '#386fa8',
          600: '#255280',
        },
        violet2: {
          400: '#756cb8',
          500: '#62599c',
          600: '#484078',
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
