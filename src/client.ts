import * as WebSocket from 'ws';
import { log, PORT, logMessage } from './util';

const webSocketServerAddress = `ws://127.0.0.1:${PORT}`;
const webSocketServer = new WebSocket(webSocketServerAddress);

webSocketServer.on('open', () => {
  log(`Connected client @ ${webSocketServerAddress}`);
  webSocketServer.send('Hello, world!');
  webSocketServer.close();
});

webSocketServer.on('message', logMessage);
