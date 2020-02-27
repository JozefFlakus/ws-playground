import { createServer, IncomingMessage } from 'http';
import { Socket } from 'net';
import { insertIf, logRequest, PORT, logMessage, getProtocols, getAcceptValue, onRequest, onListen } from './util';
import { parseMessage, constructMessage } from './message.server';

// @TODO
const onData = (socket: Socket) => (buffer: Buffer) => {
  const msg = parseMessage(buffer);

  logMessage(msg);

  if (!msg) {
    const reply = constructMessage('Siema!');
    socket.write(reply);
  }
};

// @TODO
const onUpgrade = (req: IncomingMessage, socket: Socket) => {
  logRequest(req);

  const upgradeKey = req.headers['upgrade'];
  const acceptKey = req.headers['sec-websocket-key'] as string;
  const protocolKey = req.headers['sec-websocket-protocol'] as string;

  if (upgradeKey !== 'websocket') {
    return socket.end('HTTP/1.1 400 Bad Request');
  }

  const hash = getAcceptValue(acceptKey);
  const protocols = getProtocols(protocolKey);

  const response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: WebSocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${hash}`,
    ...insertIf(protocols.includes('plaintext'))(
      'Sec-WebSocket-Protocol: plaintext'),
  ];

  socket.on('data', onData(socket));
  socket.write(response.join('\r\n') + '\r\n\r\n');
};

const server = createServer();

server.on('request', onRequest);
server.on('upgrade', onUpgrade);
server.listen(PORT, onListen);
