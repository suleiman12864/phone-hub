require('dotenv').config();
const app = require('./src/backend/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`PHONE HUB Server running at: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

