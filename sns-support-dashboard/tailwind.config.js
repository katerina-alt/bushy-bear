/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{jsx,js,html}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A1324", panel: "#111D33", raised: "#16243F", line: "#22314F" },
        ink: { DEFAULT: "#F4F6FA", soft: "#C9D2E0" },
        muted: { DEFAULT: "#94A3B8", dim: "#6B7A90" },
        save: { DEFAULT: "#4CBF86", bg: "#12301F" },
        caution: { DEFAULT: "#D9A441", bg: "#2E2412" },
        contrib: { DEFAULT: "#5B9BE6", bg: "#13284A" },
        neg: { DEFAULT: "#D27F7F", bg: "#331A1F" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
