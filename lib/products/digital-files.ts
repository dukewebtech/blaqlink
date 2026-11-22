// Shared by the upload form and the upload route. Types are decided by the
// file extension, because phones often send an empty or generic MIME type.
export const DIGITAL_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  epub: "application/epub+zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mov: "video/quicktime",
}

export const DIGITAL_FILE_ACCEPT = Object.keys(DIGITAL_FILE_TYPES)
  .map((ext) => `.${ext}`)
  .join(",")

export const MAX_DIGITAL_FILE_BYTES = 100 * 1024 * 1024
