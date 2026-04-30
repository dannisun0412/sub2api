const UTF8_BOM = '\ufeff'

const hasUtf8Bom = (bytes: Uint8Array) =>
  bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf

const stripBom = (text: string) => text.replace(/^\ufeff/, '')

const readAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }

  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

const decodeWith = (buffer: ArrayBuffer, encoding: string): string | null => {
  try {
    return stripBom(new TextDecoder(encoding, { fatal: true }).decode(buffer))
  } catch {
    return null
  }
}

export const readJsonFileText = async (file: File): Promise<string> => {
  const buffer = await readAsArrayBuffer(file)
  const bytes = new Uint8Array(buffer)
  const utf8Text = decodeWith(buffer, 'utf-8')

  if (utf8Text !== null && (hasUtf8Bom(bytes) || !utf8Text.includes('\ufffd'))) {
    return utf8Text
  }

  const gb18030Text = decodeWith(buffer, 'gb18030')
  if (gb18030Text !== null) {
    return gb18030Text
  }

  const gbkText = decodeWith(buffer, 'gbk')
  if (gbkText !== null) {
    return gbkText
  }

  return stripBom(new TextDecoder().decode(buffer))
}

export const createJsonDownloadBlob = (data: unknown) =>
  new Blob([UTF8_BOM, JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
