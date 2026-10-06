/** @type {import('tailwindcss').Config} */
// Utilities resolve to the Qetoret token layer (src/styles/tokens.css): four
// radii, one elevation, two type voices. Everything else stays Tailwind's.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: 'var(--q-radius-control)',
        lg: 'var(--q-radius-control)',
        xl: 'var(--q-radius-control)',
        '2xl': 'var(--q-radius-surface)',
        '3xl': 'var(--q-radius-dialog)',
        control: 'var(--q-radius-control)',
        surface: 'var(--q-radius-surface)',
        dialog: 'var(--q-radius-dialog)',
      },
      boxShadow: {
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'var(--q-elevation)',
        xl: 'var(--q-elevation)',
        '2xl': 'var(--q-elevation)',
        elevation: 'var(--q-elevation)',
      },
      fontFamily: {
        sans: ['var(--q-font-ui)'],
        serif: ['var(--q-font-editorial)'],
      },
    },
  },
  plugins: [],
}
