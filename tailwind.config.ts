import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f5",
          100: "#efeee9",
          200: "#ddd9cf",
          300: "#c7c0b0",
          400: "#a89f8b",
          500: "#857b67",
          600: "#665d4b",
          700: "#4d4537",
          800: "#302b22",
          900: "#1d1a15"
        },
        accent: {
          50: "#f4f7ef",
          100: "#e6edd7",
          200: "#cad7ad",
          300: "#a8bd78",
          400: "#86a449",
          500: "#67832f",
          600: "#536826",
          700: "#41501f",
          800: "#2d3716",
          900: "#1a210d"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(29, 26, 21, 0.08)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(82, 74, 60, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(82, 74, 60, 0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;