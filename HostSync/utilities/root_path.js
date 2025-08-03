const path = require("path");

module.exports = path.dirname(require.main.filename); // anyone import the path and take it as a root directory
