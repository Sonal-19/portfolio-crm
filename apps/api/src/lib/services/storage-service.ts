import { Image } from "bun";
import { UPLOADS_DIR } from "$/env";

export const uploadFolders = [
  "brand",
  "gallery",
  "blog",
  "releases",
  "social",
] as const;
export type UploadFolder = (typeof uploadFolders)[number];

const WEBP_QUALITY = 80;
const MAX_SIZE_MB = 8;

class StorageService {
  /**
   * Converts an uploaded image file to WebP (via Bun's Image API) and
   * writes it to local disk under `UPLOADS_DIR/<folder>/<file>.webp`.
   * Returns the web-servable relative path, e.g. `/uploads/book/foo.webp`.
   */
  async saveImage(file: File, folder: UploadFolder): Promise<string> {
    this.#validate(file);

    const webpBuffer = await this.#convertToWebp(file);
    const sizeInMB = webpBuffer.byteLength / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      throw new Error(
        `Converted image exceeds ${MAX_SIZE_MB}MB limit (${sizeInMB.toFixed(2)}MB)`,
      );
    }

    const filename = `${this.#randomId()}.webp`;
    const diskPath = `${UPLOADS_DIR}/${folder}/${filename}`;
    await Bun.write(diskPath, webpBuffer);

    return `/uploads/${folder}/${filename}`;
  }

  #validate(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      throw new Error(
        `Image size must be less than ${MAX_SIZE_MB}MB (current: ${sizeInMB.toFixed(2)}MB)`,
      );
    }
  }

  async #convertToWebp(file: File) {
    try {
      return await new Image(file).webp({ quality: WEBP_QUALITY }).bytes();
    } catch (error) {
      console.error("WebP conversion error:", error);
      throw new Error(
        "Failed to convert image to WebP format. Please try a different image.",
      );
    }
  }

  #randomId() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    return `${ts}-${rand}`;
  }
}

export const storageService = new StorageService();
