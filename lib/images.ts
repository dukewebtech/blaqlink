// Browser-only helpers for photos picked on a phone.

/** Resizes a photo to at most 1600px on its longest side, as JPEG. */
export async function shrinkImage(file: File): Promise<File> {
  if (file.size < 1.5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
  } catch {
    return file // browser can't decode it; let the size check decide
  }
}
