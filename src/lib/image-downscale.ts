// Downscales a photograph in the browser before it is sent.
//
// A candidature carries up to six frames straight off a phone, which is tens of
// megabytes, and the serverless function that receives them rejects bodies over
// about 4.5 MB. Resizing here keeps the whole application inside one request and
// keeps the admin gallery quick to open. Reviewing an eye does not need 4000px.

const MAX_EDGE = 1800;
const QUALITY = 0.82;

/**
 * Returns a downscaled JPEG. If the browser cannot decode the file (Safari's
 * HEIC on some versions, a corrupt image), the original is returned untouched
 * and the size check upstream decides its fate.
 */
export async function downscaleImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

  // Already small enough, and re-encoding would only lose detail.
  if (scale === 1 && file.type === "image/jpeg") {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
