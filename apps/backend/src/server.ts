import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initDb } from './config/database';

async function start() {
  await initDb();

  const app = createApp();
  const server = createServer(app);
  const port = Number(env.PORT);

  server.listen(port, () => {
    console.log(`Training Studio backend running on http://localhost:${port}`);
  });
}

start().catch(error => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
