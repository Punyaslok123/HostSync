const path = require("path");

// Export the root directory of the project (where app.js is usually located)
module.exports = path.dirname(require.main.filename);
