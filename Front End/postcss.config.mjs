/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    'postcss-import': {},
    'postcss-nested': {},
    'autoprefixer': {},
  },
};
