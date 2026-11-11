/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0A14',
        'bg-raised': '#15101F',
        'bg-card': '#1E1729',
        accent: '#FF6B4A',
        'accent-dim': '#E8484A',
        ruby: '#9B7BFF',
        'ruby-dim': '#7C5CFF',
        'text-hi': '#FFFFFF',
        'text-mid': '#ECE6F5',
        'text-low': '#A59BB8',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['DM Sans', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
      },
    },
  },
  plugins: [],
};
