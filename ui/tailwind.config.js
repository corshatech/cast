/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'corsha-brand-blue': '#0A2E3B',
        'corsha-brand-mid-blue': '#104457',
        'corsha-brand-green': '#77C043',
        'corsha-dark-green': '#57A61F',
        'main-grey': '#646F79', // 'Text Grey' in Design System colors
        'field-outline-grey': '#CBD5E1',
        'link-blue': '#167FA6',
        'highlight-blue': '#D5EBF3',
        'dark-green': '#276825',
        red: '#C10B00',
        orange: '#FA9357',
        yellow: '#FED766',
        purple: '#8850D0',
        'dark-blue': '#2C2DBE',
        'medium-blue': '#1378FF',
        'light-blue': '#37ADEB',
        grey: '#979797',
        'corsha-blue-light': '#10445799',
        'corsha-green-light': '#77C04399',
        'dark-green-light': '#27682599',
        'red-light': '#C10B0099',
        'orange-light': '#FA953799',
        'yellow-light': '#FED76699',
        'purple-light': '#8850D099',
        'dark-blue-light': '#2C2DBE99',
        'medium-blue-light': '#1378FF99',
        'light-blue-light': '#37ADEB99',
        'grey-light': '#97979799',
      },
      fontFamily: {
        poppins: ['Poppins', ...defaultTheme.fontFamily.sans],
        nunito: ['Nunito Sans', ...defaultTheme.fontFamily.sans],
        sans: ['Nunito Sans', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        h1: '2rem',
        h2: '1.5rem',
        h3: '1.25rem',
        h4: '1.25rem',
        body1: '1rem',
        body2: '.875rem',
        body3: '.75rem',
        body4: '.625rem',
        'icon-sm': '1rem',
        'icon-md': '1.25rem',
        'icon-lg': '1.5rem',
      },
    },
  },
  plugins: [],
};
