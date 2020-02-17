import * as http from 'http';
import * as stream from 'stream';
import { createHash } from 'crypto';
import { insertIf } from './util';

const log =  console.log;

const getAcceptValue = (acceptKey: string): string =>
  createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

const getProtocols = (protocolKey: string): string[] =>
  protocolKey ? protocolKey.split(',').map(s => s.trim()) : [];

const server = http.createServer((req, res) => {
  log(`${req.method} ${req.url}`);
});

server.on('upgrade', (req: http.IncomingMessage, socket: stream.Duplex) => {
  log('Request: ', `${req.method} ${req.url}`);
  log('Headers: ', req.headers);
  
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

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
});

server.listen(8080, () =>
  log('Started server @ http://127.0.0.1:8080'));
