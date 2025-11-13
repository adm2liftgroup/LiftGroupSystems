/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 aquí busca clases en tu frontend
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}