import { describe, expect, it } from 'vitest'
import { createJsonDownloadBlob, readJsonFileText } from '@/utils/jsonFile'

const readBlobAsArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> =>
  await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })

describe('jsonFile', () => {
  it('adds a UTF-8 BOM to exported JSON', async () => {
    const blob = createJsonDownloadBlob({ name: '中文' })
    const bytes = new Uint8Array(await readBlobAsArrayBuffer(blob))

    expect(blob.type).toBe('application/json;charset=utf-8')
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
  })

  it('strips UTF-8 BOM while reading JSON files', async () => {
    const file = new File([new Uint8Array([0xef, 0xbb, 0xbf]), '{"name":"中文"}'], 'data.json', {
      type: 'application/json'
    })

    await expect(readJsonFileText(file)).resolves.toBe('{"name":"中文"}')
  })

  it('falls back to GB18030 for legacy Chinese JSON files', async () => {
    const gb18030Json = new Uint8Array([
      0x7b,
      0x22,
      0x6e,
      0x61,
      0x6d,
      0x65,
      0x22,
      0x3a,
      0x22,
      0xd6,
      0xd0,
      0xce,
      0xc4,
      0x22,
      0x7d
    ])
    const file = new File([gb18030Json], 'data.json', { type: 'application/json' })

    await expect(readJsonFileText(file)).resolves.toBe('{"name":"中文"}')
  })
})
