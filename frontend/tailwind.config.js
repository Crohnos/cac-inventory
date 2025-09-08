import tailwindForms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CACCC Brand Colors
        'caccc-grey': '#595a5c',
        'caccc-green': '#45b249',
        // Additional brand color variations
        'caccc-grey-light': '#6a6b6d',
        'caccc-grey-dark': '#484849',
        'caccc-green-light': '#56c95a',
        'caccc-green-dark': '#379a3b',
      },
      // Touch-friendly sizing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Large touch targets
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [
    tailwindForms,
  ],
}