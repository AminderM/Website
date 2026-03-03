// const express = require('express');
// const path = require('path');
// const app = express();

// const PORT = process.env.PORT || 3003;
// const BUILD_DIR = process.env.BUILD_DIR || path.join(__dirname, 'build');

// app.use('/api/site', express.static(BUILD_DIR));

// app.get('/api/site', (req, res) => {
//   res.sendFile(path.join(BUILD_DIR, 'index.html'));
// });

// app.get('/api/site/*', (req, res) => {
//   res.sendFile(path.join(BUILD_DIR, 'index.html'));
// });

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', port: PORT, buildDir: BUILD_DIR });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   console.log(`Serving React app from ${BUILD_DIR}`);
//   console.log(`App available at http://localhost:${PORT}/api/site`);
// });

