import { get } from '@vercel/blob'

export async function readPdfAsBase64(fileUrl: string): Promise<string | null> {
  try {
    if (fileUrl.includes('.private.blob.vercel-storage.com')) {
      const result = await get(fileUrl, {
        access: 'private',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      if (!result || result.statusCode !== 200) return null

      const arrayBuffer = await new Response(result.stream).arrayBuffer()
      return Buffer.from(arrayBuffer).toString('base64')
    }

    const response = await fetch(fileUrl)
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer).toString('base64')
  } catch {
    return null
  }
}
