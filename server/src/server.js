import app from './app.js';
import { config } from './config/env.js';
import { testConnection } from './config/db.js';

async function startServer() {
  try {
    const dbInfo = await testConnection();
    console.log(`[EventSphere Backend] Database connected: ${dbInfo.db_name}`);

    const server = app.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(`  EventSphere Backend Server is running!`);
      console.log(`  Port:        ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  Client URL:  ${config.clientUrl}`);
      console.log(`=================================================`);
    });

    const shutdown = () => {
      console.log('\n[EventSphere Backend] Gracefully shutting down...');
      server.close(() => {
        console.log('[EventSphere Backend] Closed all connections.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[EventSphere Backend] Startup failure:', error.message);
    process.exit(1);
  }
}

startServer();
