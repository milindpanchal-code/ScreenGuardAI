import type { Config } from "tailwindcss";

export default {
  content: ["./apps/extension/src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;
