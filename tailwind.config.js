/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-500': 'hsla(191, 47%, 35%, 1)',
      },
    },
  },
  plugins: [],
}
