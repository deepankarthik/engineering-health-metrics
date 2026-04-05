import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        corp: {
          navy: "#0f2744",
          blue: "#1e5a8e",
          teal: "#0d9488",
          slate: "#64748b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
