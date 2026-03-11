/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#da5513',
        main: '#333333',
        muted: '#666666',
        surface: '#ffffff',
      }
    },
  },
  plugins: [],
}
