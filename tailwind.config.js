/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        empreasy: {
          teal: '#14b8a6',
          darkTeal: '#00a896',
          bgLight: '#f8fafc'
        }
      }
    },
  },
  plugins: [],
}