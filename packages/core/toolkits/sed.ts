export function base64ToBuffer(dataURI: string) {
  const base64 = dataURI.slice(dataURI.indexOf(',') + 1)

  return Buffer.from(base64, 'base64')
}