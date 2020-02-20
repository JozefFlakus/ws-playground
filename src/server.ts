import * as http from 'http';
import * as stream from 'stream';
import { createHash } from 'crypto';
import { insertIf } from './util';

const log =  console.log;
const toByte = (b: number) => b.toString(2).padStart(8, '0');

const OP_CODE = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xA,
};

const getAcceptValue = (acceptKey: string): string =>
  createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

const getProtocols = (protocolKey: string): string[] =>
  protocolKey ? protocolKey.split(',').map(s => s.trim()) : [];

const parseMessage = (buffer: Buffer) => {
  const firstByte = buffer.readUInt8(0);
  const secondByte = buffer.readUInt8(1);

  console.log('firstByte'.padStart(10), toByte(firstByte), firstByte);
  console.log('secondByte'.padStart(10), toByte(secondByte), secondByte);
  
  // first byte parsing
  const endFrame = firstByte & 0b10000000;
  const opCode = firstByte & 0b00001111;

  console.log('opCode'.padStart(10), toByte(opCode), opCode);
  console.log('endFrame'.padStart(10), toByte(endFrame), endFrame);

  // second byte
  const masked = secondByte & 0b10000000;
  const isMasked = Boolean(masked);

  let currentOffset = 2;
  let payloadLength = secondByte & 0b01111111;

  // payload processing
  const data = Buffer.alloc(payloadLength);

  if (isMasked) {
    const maskingKey = buffer.readUInt32BE(currentOffset);
    const mask = (int32: number) => new Uint8Array([
      (int32 & 0xff000000) >> 24,
      (int32 & 0x00ff0000) >> 16,
      (int32 & 0x0000ff00) >> 8,
      (int32 & 0x000000ff),
    ]);
    
    currentOffset += 4;

    for (let i = 0; i < payloadLength; i++) {
      const byte = buffer.readUInt8(currentOffset++);
      data.writeUInt8(byte ^ mask(maskingKey)[i % 4], i);
    }
  } else {
    buffer.copy(data, 0, currentOffset++);
  }

  if (opCode === OP_CODE.CONTINUATION) console.log('Continuation frame\n');
  if (opCode === OP_CODE.CLOSE) console.log('Connection close frame\n');
  if (opCode === OP_CODE.TEXT) console.log('Text frame\n');
  if (opCode === OP_CODE.BINARY) console.log('Binary frame\n');
  if (opCode === OP_CODE.PING) console.log('Ping frame\n');
  if (opCode === OP_CODE.PONG) console.log('Pong frame\n');

  if (opCode === OP_CODE.CLOSE) return; 
  if (opCode !== OP_CODE.TEXT) return;

  return data.toString('utf8');
}

const constructMessage = (data: any) => {
  const msgBuffer = Buffer.from(data, 'utf8');
  return Buffer.from([129, msgBuffer.length, ...msgBuffer]);
};

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

  socket.on('data', (buffer: Buffer) => {
    const msg = parseMessage(buffer);
    console.log(msg);

    if (!msg) {
      const reply = constructMessage('Siema!');
      socket.write(reply);
    }
  });

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
});

server.listen(8080, () =>
  log('Started server @ http://127.0.0.1:8080'));
