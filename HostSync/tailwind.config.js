/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs", // For all .ejs files in views and subfolders
    "./public/**/*.html", // If you have HTML files in public folder
    "./*.html", // For root level HTML files (if any)
    "./*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

