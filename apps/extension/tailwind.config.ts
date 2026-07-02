import type { Config } from "tailwindcss";

export default {
  content: ["./*.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;
