import * as WebSocket from 'ws';

const webSocketServerAddress = 'ws://127.0.0.1:8080';
const webSocketServer = new WebSocket(webSocketServerAddress);

webSocketServer.on('open', () => {
  console.log(`Connected client @ ${webSocketServerAddress}`);
  webSocketServer.send('Hello, world!');
  webSocketServer.close();
});

webSocketServer.on('message', data =>
  console.log(`Recieved: ${data}`));
