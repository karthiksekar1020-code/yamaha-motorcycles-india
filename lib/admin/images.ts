import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // what we accept from the browser
export const MAX_STORED_BYTES = 5 * 1024 * 1024; // what we keep (matches the storage bucket limit)
export const MIN_DIMENSION = 200;
export const MAX_DIMENSION = 8000;
const MAX_PIXELS = 40_000_000; // refuses decompression bombs before they are decoded
const OUTPUT_LONG_SIDE = 2400;

export type DetectedFormat = "jpeg" | "png" | "webp" | "avif";

export class ImageError extends Error {
  constructor(public code: "EMPTY" | "TOO_LARGE" | "UNSUPPORTED" | "CORRUPT" | "DIMENSIONS", message: string) {
    super(message);
  }
}

/** Identifies the format from the file's own header bytes. The filename and the browser's MIME type are never trusted. */
export function sniffFormat(b: Uint8Array): DetectedFormat | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (b.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "avif";
  return null;
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
  size: number;
  /** Storage object key: a fresh random name under a fixed folder, so no user input ever reaches the path. */
  storagePath: string;
  originalFormat: DetectedFormat;
}

/**
 * Validates an uploaded image and returns a clean WebP copy:
 * real format check, size and dimension limits, decode test, EXIF/GPS/metadata removed (re-encoding drops it),
 * resized to a sensible maximum, and stored under a generated name.
 */
export async function processUpload(input: Uint8Array): Promise<ProcessedImage> {
  if (input.length === 0) throw new ImageError("EMPTY", "The file is empty.");
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageError("TOO_LARGE", `The file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  const format = sniffFormat(input);
  if (!format) throw new ImageError("UNSUPPORTED", "Only JPEG, PNG, WebP and AVIF images are accepted.");

  try {
    const probe = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" }).metadata();
    const w0 = probe.width ?? 0, h0 = probe.height ?? 0;
    if (!w0 || !h0) throw new ImageError("CORRUPT", "The image could not be read.");
    if (w0 < MIN_DIMENSION || h0 < MIN_DIMENSION) throw new ImageError("DIMENSIONS", `The image is too small (minimum ${MIN_DIMENSION} × ${MIN_DIMENSION} pixels).`);
    if (w0 > MAX_DIMENSION || h0 > MAX_DIMENSION) throw new ImageError("DIMENSIONS", `The image is too large (maximum ${MAX_DIMENSION} × ${MAX_DIMENSION} pixels).`);

    let quality = 85;
    for (;;) {
      const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" })
        .rotate() // apply the camera's orientation before the metadata is dropped
        .resize({ width: OUTPUT_LONG_SIDE, height: OUTPUT_LONG_SIDE, fit: "inside", withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_STORED_BYTES || quality <= 50) {
        if (data.length > MAX_STORED_BYTES) throw new ImageError("TOO_LARGE", "The image is too detailed to store. Try a smaller one.");
        return { data, width: info.width, height: info.height, mimeType: "image/webp", size: data.length, storagePath: `gallery/${randomUUID()}.webp`, originalFormat: format };
      }
      quality -= 15;
    }
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError("CORRUPT", "The file is not a valid image.");
  }
}

export const imageErrorStatus = (e: ImageError) => (e.code === "TOO_LARGE" ? 413 : e.code === "UNSUPPORTED" ? 415 : 422);
