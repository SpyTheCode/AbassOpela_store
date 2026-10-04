declare module "heic-convert" {
  type ConversionOptions = {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convertImage(options: ConversionOptions): Promise<Buffer>;
  export default convertImage;
}
