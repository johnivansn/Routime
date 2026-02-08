/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0b0f1a',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
          500: '#4b5563',
          400: '#6b7280',
          300: '#9ca3af',
          200: '#d1d5db',
          100: '#e5e7eb',
          50: '#f3f4f6',
        },
        accent: {
          600: '#14b8a6',
          500: '#2dd4bf',
          400: '#5eead4',
        },
        ember: {
          600: '#f97316',
          500: '#fb923c',
          400: '#fdba74',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        timer: ['96px', { lineHeight: '1' }],
        display: ['56px', { lineHeight: '1.05' }],
      },
      boxShadow: {
        glow: '0 0 40px rgba(20, 184, 166, 0.35)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(1200px circle at 10% 10%, rgba(20, 184, 166, 0.25), transparent 55%), radial-gradient(1200px circle at 90% 0%, rgba(251, 146, 60, 0.2), transparent 45%)',
      },
    },
  },
  plugins: [],
}
