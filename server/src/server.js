const app = require('./app');
const db = require('./config/db');
const env = require('./config/env');
const seedCategories = require('./utils/seedCategories');

const startServer = async () => {
  try {
    await db.connect();
    await seedCategories();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
