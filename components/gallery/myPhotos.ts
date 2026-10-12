/**
 * "Your photos": images a visitor adds to the gallery from their own device.
 * They are stored in this browser only (IndexedDB), never uploaded, so nobody else can see them and the
 * site has no upload endpoint to abuse. Clearing site data removes them.
 */
const DB = "ymi-gallery";
const STORE = "photos";

export const MAX_PHOTOS = 24;
export const MAX_FILE_MB = 20;
export const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export interface StoredPhoto { id: string; name: string; blob: Blob; addedAt: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export const listPhotos = async (): Promise<StoredPhoto[]> => {
  const all = (await run("readonly", (s) => s.getAll())) as StoredPhoto[];
  return all.sort((a, b) => a.addedAt - b.addedAt);
};
export const savePhoto = (p: StoredPhoto) => run("readwrite", (s) => s.put(p));
export const deletePhoto = (id: string) => run("readwrite", (s) => s.delete(id));

/** Downscales to at most 1600px on the long side and re-encodes, so storage stays small. */
export async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.88));
  if (!blob) throw new Error("encode failed");
  return blob;
}
