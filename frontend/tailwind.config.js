/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian-black': '#1a1a1a',
        'arc-teal': '#00cec9',
        'arc-orange': '#fd79a8',
      }
    },
  },
  plugins: [],
}
