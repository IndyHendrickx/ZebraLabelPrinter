import { getPixels as getNDPixels } from "ndarray-pixels";
import zlib from "zlib";
import { type NdArray } from "ndarray";

export type EncodeMethod = "Z64" | "ASCII";

export interface EncodeOptions {
  method?: EncodeMethod;
  mimeType?: string | null;
  threshold?: number;
  luminance?: { r: number; g: number; b: number };
}

export interface Bitmap {
  width: number;
  height: number;
  channels: number;
}

export interface ImageData {
  data: Uint8Array;
  getPixelColor: (x: number, y: number) => RGBA;
  bitmap: Bitmap;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface MonochromeImage {
  buffer: Buffer;
  width: number;
  height: number;
}

export interface DecodedImage {
  width: number;
  height: number;
  buffer: Uint8Array;
  getPixelBit: (x: number, y: number) => number;
}

// Map codes for run-length encoding
const mapCode: Record<number, string> = {
  1: "G", 2: "H", 3: "I", 4: "J", 5: "K", 6: "L", 7: "M", 8: "N", 9: "O", 10: "P", 11: "Q", 12: "R",
  13: "S", 14: "T", 15: "U", 16: "V", 17: "W", 18: "X", 19: "Y", 20: "g", 40: "h", 60: "i", 80: "j",
  100: "k", 120: "l", 140: "m", 160: "n", 180: "o", 200: "p", 220: "q", 240: "r", 260: "s", 280: "t",
  300: "u", 320: "v", 340: "w", 360: "x", 380: "y", 400: "z"
};
const pivotedMapCode: Record<string, number> = Object.fromEntries(Object.entries(mapCode).map(([k, v]) => [v, Number(k)]));

// CRC16 Table
const crcTable = [0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108,
  0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210,
  0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b,
  0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401,
  0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee,
  0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6,
  0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d,
  0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5,
  0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc,
  0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87, 0x4ce4,
  0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd,
  0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13,
  0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a,
  0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e,
  0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1,
  0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb,
  0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0,
  0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8,
  0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657,
  0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9,
  0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882,
  0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e,
  0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07,
  0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d,
  0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74,
  0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
];

export async function encode(
  file: ArrayBuffer | Uint8Array | ImageData,
  options?: EncodeOptions
): Promise<string> {
  const opts: Required<EncodeOptions> = {
    method: "Z64",
    mimeType: null,
    threshold: 0x80,
    luminance: { r: 0.2126, g: 0.7152, b: 0.0722 },
    ...options
  };
  if (!["Z64", "ASCII"].includes(opts.method)) throw new Error(`Method '${opts.method}' is not supported (Z64, ASCII)`);

  const image = (typeof (file as ImageData).bitmap !== "undefined")
    ? (file as ImageData)
    : await getImagePixels(file as ArrayBuffer | Uint8Array, opts);

  const mono = convertImageToMonochrome(image, opts);
  let data: string;
  if (opts.method === "Z64") {
    data = encodeZ64(mono.buffer);
  } else {
    data = encodeASCII(mono.buffer, mono.width);
  }
  return `^GFA,${mono.buffer.length},${mono.buffer.length},${mono.width / 8},${data}^FS`;
}

async function getImagePixels(
  file: Uint8Array | ArrayBuffer,
  opts: Required<EncodeOptions>
): Promise<ImageData> {

  const bytes = file instanceof Uint8Array ? file : new Uint8Array(file);
  const ndarrayImage: NdArray<Uint8Array> = await getNDPixels(bytes,opts.mimeType!);
  const shape = ndarrayImage.shape;
  const width = shape[0] ?? 0, height = shape[1] ?? 0, channels = shape[2] ?? 0;
  return {
    data: ndarrayImage.data,
    bitmap: { width, height, channels },
    getPixelColor: (x: number, y: number): RGBA => {
      const idx = (y * width + x) * channels;
      return {
        r: ndarrayImage.data[idx] ?? 0,
        g: channels > 1 ? ndarrayImage.data[idx + 1] ?? 0 : 0,
        b: channels > 2 ? ndarrayImage.data[idx + 2] ?? 0 : 0,
        a: channels > 3 ? ndarrayImage.data[idx + 3] ?? 0 : 255
      };
    }
  };
}

function convertImageToMonochrome(
  image: ImageData,
  opts: Required<EncodeOptions>
): MonochromeImage {
  const imgWidth = Math.ceil(image.bitmap.width / 8) * 8;
  const buffer = new Uint8Array((image.bitmap.height * imgWidth) / 8);

  let currentValue = 0, bitCounter = 0, index = 0;
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < imgWidth; x++) {
      let value = 0;
      if (x < image.bitmap.width) {
        let pixel = image.getPixelColor(x, y);
        const alpha = pixel.a / 255;
        const luminance =
          (pixel.r * opts.luminance.r +
            pixel.g * opts.luminance.g +
            pixel.b * opts.luminance.b) * alpha +
          255 * (1 - alpha);
        value = luminance < opts.threshold ? 1 : 0;
      }
      currentValue = currentValue | (value << (7 - bitCounter));
      bitCounter++;
      if (bitCounter === 8) {
        buffer[index++] = currentValue;
        currentValue = 0;
        bitCounter = 0;
      }
    }
  }
  return {
    buffer: Buffer.from(buffer),
    width: imgWidth,
    height: image.bitmap.height
  };
}

function encodeASCII(buffer: Buffer, width: number): string {
  let lines: string[] = [], currentLine = "", lineLen = width / 8;
  for (let i = 0; i < buffer.length; i++) {
    currentLine += buffer[i]!.toString(16).padStart(2, "0");
    if ((i + 1) % lineLen === 0) {
      lines.push(currentLine);
      currentLine = "";
    }
  }
  const newLines = lines.map((line, idx, arr) =>
    line === arr[idx - 1] ? ":" : processAsciiLine(line)
  );
  const line = newLines.join("");
  let data = "";
  const nonCounting = [",", ":", "!"];
  let curr: string | undefined = undefined, count = 0, i = 0;
  while (i <= line.length) {
    const ch = line[i];
    const isNC = nonCounting.includes(curr!);
    if (!curr) {
      curr = ch;
      count = 1;
    } else {
      if (ch === curr && !isNC) count++;
      else {
        if (isNC || count === 1) data += curr;
        else data += `${getMapCodeValues(count)}${curr}`;
        curr = undefined;
        continue;
      }
    }
    i++;
  }
  return data;
}

function processAsciiLine(line: string): string {
  return line.toUpperCase().replace(/0+$/, ",");
}

function getMapCodeValues(count: number): string {
  if (mapCode[count]) return mapCode[count] ?? "";
  let out = "";
  while (count > 20) {
    out += getMapCodeValues(Math.floor(count / 20) * 20);
    count = count % 20;
  }
  out += mapCode[count];
  return out;
}

function encodeZ64(buffer: Buffer): string {
  const base64Value = zlib.deflateSync(buffer).toString("base64");
  const crc16Value = calculateCRC(base64Value);
  return `:Z64:${base64Value}:${crc16Value}`;
}

function calculateCRC(input: string): string {
  let crc = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    if (ch > 255) throw new RangeError();
    const crcIdx = (ch ^ (crc >> 8)) & 0xff;
    crc = crcTable[crcIdx]! ^ (crc << 8);
  }
  crc = (crc & 0xffff);
  return crc.toString(16).toLowerCase().padStart(4, "0");
}

export function decode(text: string): DecodedImage {
  let str = text.trim();
  if (!str.startsWith("^GFA") && !str.startsWith("A")) throw new Error("Unsupported encoding");
  if (str.startsWith("^GF")) str = str.substring(3);
  if (str.endsWith("^FS")) str = str.substring(0, str.length - 3);

  let idx = str.indexOf(",");
  const a = str.substring(0, idx); str = str.substring(idx + 1);
  idx = str.indexOf(",");
  const b = str.substring(0, idx); str = str.substring(idx + 1);
  idx = str.indexOf(",");
  const c = parseInt(str.substring(0, idx), 10); str = str.substring(idx + 1);
  idx = str.indexOf(",");
  const d = parseInt(str.substring(0, idx), 10);

  const data = str.substring(idx + 1);
  const width = d * 8;
  const height = c / d;
  let buffer: Uint8Array;

  if (data.startsWith(":Z64:")) buffer = decodeZ64(data);
  else buffer = decodeASCII(data, c, d);

  return {
    width, height, buffer,
    getPixelBit: (x: number, y: number) => {
      const byteIdx = y * (width / 8) + Math.floor(x / 8);
      const byte = buffer[byteIdx];
      return (byte! >> (7 - (x % 8))) & 0x01;
    }
  };
}

function decodeZ64(data: string): Uint8Array {
  const body = data.substring(5, data.length - 5);
  const deflated = Buffer.from(body, "base64");
  return zlib.inflateSync(deflated);
}

function decodeASCII(data: string, size: number, lineByteCount: number): Uint8Array {
  const buffer = new Uint8Array(size);
  const lineWordCount = lineByteCount * 2;
  let inflated = "", idx = 0;
  while (idx < data.length) {
    let ch = data[idx++] ?? "";
    if (pivotedMapCode[ch]) {
      let code = "";
      while (pivotedMapCode[ch]) {
        code += ch;
        ch = data[idx++] ?? "";
      }
      const mult = getMapCodeCount(code);
      inflated += ch.repeat(mult);
    } else {
      inflated += ch;
    }
  }
  let expanded = "", i = 0;
  while (i < inflated.length) {
    let ch = inflated[i++];
    let remain = lineWordCount - (expanded.length % lineWordCount);
    if (ch === ",") expanded += "0".repeat(remain);
    else if (ch === "!") expanded += "F".repeat(remain);
    else if (ch === ":") expanded += expanded.slice(expanded.length - lineWordCount, expanded.length);
    else expanded += ch;
  }
  let bIdx = 0;
  i = 0;
  while (i < expanded.length) {
    buffer[bIdx++] = parseInt(expanded[i++]! + expanded[i++], 16);
  }
  return buffer;
}

function getMapCodeCount(code: string): number {
  let value = 0;
  for (let i = 0; i < code.length; i++) value += pivotedMapCode[code[i] ?? ""] ?? 0;
  return value;
}
