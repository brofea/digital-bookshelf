import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        shelf: "0 18px 45px rgba(24, 20, 16, 0.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
