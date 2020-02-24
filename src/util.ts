import * as http from 'http';
import { createHash } from 'crypto';

export const PORT = 8080;

export const log = console.log;

export const OP_CODE = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xA,
};

export const insertIf = <T>(condition: boolean) => (...elements: T[]) =>
  condition ? elements : [];

export const logRequest = (req: http.IncomingMessage) => {
  log('-------------------------------------');
  log('Request: ', `${req.method} ${req.url}`);
  log('Headers: ', req.headers);
  log('-------------------------------------');
};

export const logMessage = (msg: any) => {
  log('-------------------------------------');
  log('Received: ', msg);
  log('-------------------------------------');
}

export const logOpCode = (opCode: number) => {
  switch (opCode) {
    case OP_CODE.CONTINUATION:
      return log('Continuation frame\n');
    case OP_CODE.CLOSE:
      return log('Close frame\n');
    case OP_CODE.TEXT:
      return log('Text frame\n');   
    case OP_CODE.BINARY:
      return log('Binary frame\n');
    case OP_CODE.PING:
      return log('Ping frame\n');
    case OP_CODE.PONG:
      return log('Pong frame\n');
    default:
      return;
  }
}

export const toByte = (b: number) =>
  b.toString(2).padStart(8, '0');

export const getProtocols = (protocolKey: string): string[] =>
  protocolKey ? protocolKey.split(',').map(s => s.trim()) : [];

export const getAcceptValue = (acceptKey: string): string =>
  createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

export const onListen = () => {
  log(`Started server @ http://127.0.0.1:${PORT}`);
}

export const onRequest = (req: http.IncomingMessage) => {
  log(`${req.method} ${req.url}`);
}
