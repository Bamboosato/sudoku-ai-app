const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85
const MAX_BYTE_SIZE = 4 * 1024 * 1024 // 4 MB

export class ImagePreprocessError extends Error {
  constructor(
    public code: 'UNSUPPORTED_IMAGE' | 'IMAGE_TOO_LARGE',
    message: string,
  ) {
    super(message)
    this.name = 'ImagePreprocessError'
  }
}

export interface PreprocessedImage {
  base64: string
  mimeType: 'image/jpeg'
  width: number
  height: number
  byteSize: number
}

/**
 * Preprocesses a user selected image:
 * 1. Decodes with createImageBitmap or HTMLImageElement (respecting EXIF orientation).
 * 2. Downscales if max dimension > 1600px while maintaining aspect ratio.
 * 3. Paints with white background (to avoid black background on transparent PNGs).
 * 4. Encodes to JPEG at 0.85 quality and converts to Base64 (without data URI prefix).
 * 5. Rejects if result exceeds 4 MB.
 */
export async function preprocessImage(file: File | Blob): Promise<PreprocessedImage> {
  let width = 0
  let height = 0
  let source: CanvasImageSource

  // 1. Decode image
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      width = bitmap.width
      height = bitmap.height
      source = bitmap
    } catch {
      // Fallback to Image() below
      source = await loadImageElement(file)
      width = (source as HTMLImageElement).naturalWidth
      height = (source as HTMLImageElement).naturalHeight
    }
  } else {
    source = await loadImageElement(file)
    width = (source as HTMLImageElement).naturalWidth
    height = (source as HTMLImageElement).naturalHeight
  }

  // 2. Compute scaled dimensions
  let targetWidth = width
  let targetHeight = height
  const maxDim = Math.max(width, height)
  if (maxDim > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxDim
    targetWidth = Math.round(width * scale)
    targetHeight = Math.round(height * scale)
  }

  // 3. Render on canvas with white background
  let blob: Blob | null = null

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImagePreprocessError('UNSUPPORTED_IMAGE', 'Canvas context unavailable')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
  } else {
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImagePreprocessError('UNSUPPORTED_IMAGE', 'Canvas context unavailable')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    })
  }

  // Cleanup ImageBitmap if applicable
  if (typeof (source as ImageBitmap).close === 'function') {
    ;(source as ImageBitmap).close()
  }

  if (!blob) {
    throw new ImagePreprocessError('UNSUPPORTED_IMAGE', '画像エンコードに失敗しました。')
  }

  if (blob.size > MAX_BYTE_SIZE) {
    throw new ImagePreprocessError('IMAGE_TOO_LARGE', '画像サイズが大きすぎます。別の画像を選択してください。')
  }

  const base64 = await blobToBase64(blob)

  return {
    base64,
    mimeType: 'image/jpeg',
    width: targetWidth,
    height: targetHeight,
    byteSize: blob.size,
  }
}

function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImagePreprocessError('UNSUPPORTED_IMAGE', 'この画像形式は読み込めません。JPEGまたはPNGをお試しください。'))
    }
    img.src = url
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // Strip "data:image/jpeg;base64,"
      const commaIdx = dataUrl.indexOf(',')
      if (commaIdx >= 0) {
        resolve(dataUrl.substring(commaIdx + 1))
      } else {
        resolve(dataUrl)
      }
    }
    reader.onerror = () => reject(new ImagePreprocessError('UNSUPPORTED_IMAGE', '画像の読み込みに失敗しました。'))
    reader.readAsDataURL(blob)
  })
}
