import * as http from 'http';
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
const onUpgrade = (req: http.IncomingMessage, socket: Socket) => {
  logRequest(req);

  const upgradeKey = req.headers['upgrade'];
  const acceptKey = req.headers['sec-websocket-key'] as string;
  const protocolKey = req.headers['sec-websocket-protocol'] as string;

  if (upgradeKey !== 'websocket') {
    return socket.end('HTTP/1.1 400 Bad Request');
  }

  const hash = getAcceptValue(acceptKey);
  const protocols = getProtocols(protocolKey);

  const responseHeaders = [
    'HTTP/1.1 101 Web Socket Protocol Handshake',
    'Upgrade: WebSocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${hash}`,
    ...insertIf(protocols.includes('json'))(
      'Sec-WebSocket-Protocol: json'),
  ];

  socket.on('data', onData(socket));
  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
};

const server = http.createServer();

server.on('request', onRequest);
server.on('upgrade', onUpgrade);
server.listen(PORT, onListen);
