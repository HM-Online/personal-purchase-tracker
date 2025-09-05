import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'Poppins' available as a font family
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'background-dark': '#1A202C',
        'surface-dark': '#2D3748',
        'text-light': '#E2E8F0',
        'text-muted': '#A0AEC0',
        'accent-primary': '#38B2AC',
        'accent-danger': '#E53E3E',
      },
    },
  },
  plugins: [],
};
export default config;