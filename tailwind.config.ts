import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'main-wide': '40rem',
      'footer-wide': '25rem',
      'footer-wide2': '45rem',
      'edit-wide': '50rem',
    },
  },
  plugins: [],
};
export default config;
