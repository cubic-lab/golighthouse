import { createHash } from 'node:crypto'
import { sanitizeUrlForFilePath } from './urls'

export function hashPath(path: string) {
  return createHash('md5')
    .update(sanitizeUrlForFilePath(path))
    .digest('hex')
    .substring(0, 6)
}