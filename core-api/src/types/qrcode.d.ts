declare module 'qrcode' {
  export interface QRCodeToBufferOptions {
    width?: number
    margin?: number
  }

  const QRCode: {
    toBuffer(text: string, options?: QRCodeToBufferOptions): Promise<Buffer>
  }

  export default QRCode
}
