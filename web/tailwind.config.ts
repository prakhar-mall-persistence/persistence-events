import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#7c3aed", fg: "#0f172a" },
      },
    },
  },
  plugins: [],
} satisfies Config;
