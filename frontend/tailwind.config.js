/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bdgreen: { DEFAULT: "#006A4E", dark: "#004D38", light: "#E8F5F0" },
        bdred: "#C1272D",
        gold: { DEFAULT: "#C89B3C", light: "#FDF6E3" },
        navy: "#0A1628",
        ink: "#14110F",
        slate: "#5A6B7D",
        parchment: "#F0EDE7",
        paper: "#FBF8F2",
      },
      fontFamily: {
        bangla: ["'Noto Serif Bengali'", "serif"],
        display: ["'Noto Serif Bengali'", "serif"],
        body: ["'Hind Siliguri'", "sans-serif"],
        mono: ["'Space Grotesk'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
