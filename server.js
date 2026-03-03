const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3003;
const BUILD_DIR = path.join(__dirname, 'build');

// Serve static files FIRST
app.use(express.static(BUILD_DIR));

// React fallback route (ONLY for non-static routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});