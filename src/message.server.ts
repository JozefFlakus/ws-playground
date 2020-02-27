import { log, toByte, logOpCode, OP_CODE } from './util';

export const parseMessage = (buffer: Buffer): string | undefined => {
  const firstByte = buffer.readUInt8(0);
  const secondByte = buffer.readUInt8(1);

  log('firstByte'.padStart(10), toByte(firstByte), firstByte);
  log('secondByte'.padStart(10), toByte(secondByte), secondByte);

  // first byte parsing
  const finalFrame = firstByte & 0b10000000;
  const opCode = firstByte & 0b00001111;

  // second byte
  const masked = secondByte & 0b10000000;
  const isMasked = Boolean(masked);
  const payloadLength = secondByte & 0b01111111;

  let currentOffset = 2;

  // payload processing
  const data = Buffer.alloc(payloadLength);

  if (isMasked) {
    const maskingKey = buffer.readUInt32BE(currentOffset);
    const mask = new Uint8Array([
      (maskingKey & 0xff000000) >> 24,
      (maskingKey & 0x00ff0000) >> 16,
      (maskingKey & 0x0000ff00) >> 8,
      (maskingKey & 0x000000ff),
    ]);

    currentOffset += 4;

    for (let i = 0; i < payloadLength; i++) {
      const byte = buffer.readUInt8(currentOffset++);
      data.writeUInt8(byte ^ mask[i % 4], i);
    }
  } else {
    buffer.copy(data, 0, currentOffset++);
  }

  logOpCode(opCode);

  if (opCode === OP_CODE.CLOSE) return;
  if (opCode !== OP_CODE.TEXT) return;

  return data.toString('utf8');
}

export const constructMessage = (data: string): Buffer => {
  const msgBuffer = Buffer.from(data, 'utf8');
  return Buffer.from([129, msgBuffer.length, ...msgBuffer]);
};
