/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
