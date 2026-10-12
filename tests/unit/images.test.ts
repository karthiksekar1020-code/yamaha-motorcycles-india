// @vitest-environment node
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ImageError, MAX_UPLOAD_BYTES, processUpload, sniffFormat } from "@/lib/admin/images";

const make = (w = 640, h = 480, fmt: "png" | "jpeg" | "webp" | "avif" = "png") =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 20, g: 90, b: 220 } } })[fmt]().toBuffer();

const reject = async (data: Uint8Array) => processUpload(data).then(() => null, (e) => e as ImageError);

describe("accepted uploads", () => {
  it.each(["png", "jpeg", "webp", "avif"] as const)("accepts a real %s and stores a clean WebP under a generated name", async (fmt) => {
    const out = await processUpload(await make(640, 480, fmt));
    expect(out.mimeType).toBe("image/webp");
    expect(sniffFormat(out.data)).toBe("webp");
    expect(out.width).toBe(640);
    expect(out.height).toBe(480);
    expect(out.originalFormat).toBe(fmt);
    expect(out.storagePath).toMatch(/^gallery\/[0-9a-f-]{36}\.webp$/);
  });

  it("generates a different unsafe-name-free path every time", async () => {
    const png = await make();
    expect((await processUpload(png)).storagePath).not.toBe((await processUpload(png)).storagePath);
  });

  it("shrinks very large images to a sensible size", async () => {
    const out = await processUpload(await make(5000, 3000, "jpeg"));
    expect(Math.max(out.width, out.height)).toBe(2400);
  });

  it("removes embedded metadata such as GPS and camera EXIF", async () => {
    const withExif = await sharp(await make()).jpeg().withExif({ IFD0: { Copyright: "SECRET-OWNER-NOTE", Artist: "Private Person" } }).toBuffer();
    expect(withExif.includes(Buffer.from("SECRET-OWNER-NOTE"))).toBe(true); // the test file really carries it
    const out = await processUpload(withExif);
    expect(out.data.includes(Buffer.from("SECRET-OWNER-NOTE"))).toBe(false);
    expect((await sharp(out.data).metadata()).exif).toBeUndefined();
  });
});

describe("rejected uploads", () => {
  it("rejects a non-image renamed to look like one", async () => {
    const e = await reject(Buffer.from("MZ\x90\x00 this is a Windows executable pretending to be photo.jpg"));
    expect(e?.code).toBe("UNSUPPORTED");
  });

  it("rejects SVG (can carry scripts), GIF and PHP", async () => {
    expect((await reject(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')))?.code).toBe("UNSUPPORTED");
    expect((await reject(Buffer.from("GIF89a\x01\x00\x01\x00")))?.code).toBe("UNSUPPORTED");
    expect((await reject(Buffer.from("<?php system($_GET['c']); ?>")))?.code).toBe("UNSUPPORTED");
  });

  it("rejects empty and oversized files", async () => {
    expect((await reject(new Uint8Array(0)))?.code).toBe("EMPTY");
    const big = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
    expect((await reject(big))?.code).toBe("TOO_LARGE");
  });

  it("rejects a truncated or corrupt image that only has a valid header", async () => {
    const png = await make();
    expect((await reject(png.subarray(0, 60)))?.code).toBe("CORRUPT");
    const jpegHeaderOnly = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
    expect((await reject(jpegHeaderOnly))?.code).toBe("CORRUPT");
  });

  it("rejects images that are too small or too large in pixels", async () => {
    expect((await reject(await make(50, 50)))?.code).toBe("DIMENSIONS");
    expect((await reject(await make(9000, 300, "png")))?.code).toBe("DIMENSIONS");
  });

  it("drops code hidden after a valid image (polyglot file)", async () => {
    const png = await make();
    const polyglot = Buffer.concat([png, Buffer.from("<?php system($_GET['cmd']); ?>")]);
    const out = await processUpload(polyglot);
    expect(out.data.includes(Buffer.from("<?php"))).toBe(false);
  });
});
