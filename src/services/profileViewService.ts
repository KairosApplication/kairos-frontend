import { profileDemo } from '../mocks/profileView'
import type { ProfileView } from '../types/profileView'
export function getProfileView(): Promise<ProfileView> { return Promise.resolve(structuredClone(profileDemo)) }

/** A prévia usa apenas pixels decodificados e exportados como PNG pelo navegador. */
export async function createProfilePhoto(file: File): Promise<Blob> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Invalid image')
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image preview unavailable')
    const side = Math.min(bitmap.width, bitmap.height)
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed')), 'image/png'))
  } finally { bitmap.close() }
}
