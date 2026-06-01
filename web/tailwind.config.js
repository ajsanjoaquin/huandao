/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          900: "#0f1f0f",
          800: "#1a2e1a",
          700: "#243d24",
          600: "#2e4d2e",
        },
        coral: {
          500: "#E05A2B",
          400: "#e87a54",
          300: "#f09a7d",
        },
        seafoam: {
          500: "#64b48c",
          400: "#87c7a8",
          200: "#c3e4d4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
