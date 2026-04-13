import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d1321",
        mist: "#f5f7fb",
        brand: {
          50: "#eef4ff",
          100: "#dce9ff",
          500: "#396dff",
          600: "#2e59d9"
        },
        accent: "#10b981",
        gold: "#c79f52"
      },
      boxShadow: {
        soft: "0 25px 70px rgba(13, 19, 33, 0.12)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(57, 109, 255, 0.26), transparent 35%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 30%)"
      }
    }
  },
  plugins: []
} satisfies Config;
