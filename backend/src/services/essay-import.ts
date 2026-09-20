import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { extractEssayTextFromImage } from './gemini.js'

const MAX_IMPORT_BYTES = 2 * 1024 * 1024
const MAX_IMPORT_CHARS = 15_000

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function extractTextFromUpload(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  if (buffer.byteLength > MAX_IMPORT_BYTES) {
    throw new Error('Arquivo muito grande (máximo 2 MB)')
  }

  const lowerName = originalName.toLowerCase()

  if (mimeType === 'text/plain' || lowerName.endsWith('.txt')) {
    return trimImportedText(buffer.toString('utf8'))
  }

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()
    return trimImportedText(parsed.text ?? '')
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const parsed = await mammoth.extractRawText({ buffer })
    return trimImportedText(parsed.value ?? '')
  }

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    const base64 = buffer.toString('base64')
    return trimImportedText(await extractEssayTextFromImage(base64, mimeType))
  }

  throw new Error('Formato não suportado. Use .txt, .pdf, .docx ou imagem (jpg/png/webp).')
}

function trimImportedText(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    throw new Error('Nenhum texto legível encontrado no arquivo')
  }

  if (normalized.length > MAX_IMPORT_CHARS) {
    return normalized.slice(0, MAX_IMPORT_CHARS)
  }

  return normalized
}
