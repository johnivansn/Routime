/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'var(--ink-900)',
          800: 'var(--ink-800)',
          700: 'var(--ink-700)',
          600: 'var(--ink-600)',
          500: 'var(--ink-500)',
          400: 'var(--ink-400)',
          300: 'var(--ink-300)',
          200: 'var(--ink-200)',
          100: 'var(--ink-100)',
          50: 'var(--ink-50)',
        },
        accent: {
          600: 'var(--accent-600)',
          500: 'var(--accent-500)',
          400: 'var(--accent-400)',
        },
        ember: {
          600: 'var(--ember-600)',
          500: 'var(--ember-500)',
          400: 'var(--ember-400)',
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
