import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const server = createServer(app);

const port = Number(env.PORT);

server.listen(port, () => {
  console.log(`Training Studio backend running on http://localhost:${port}`);
});
