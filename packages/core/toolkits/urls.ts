import sanitize from 'sanitize-filename'
import slugify from 'slugify'
import { withLeadingSlash, withoutLeadingSlash, withoutTrailingSlash, withTrailingSlash } from 'ufo'

export function withSlashes(s: string)  {
  return withLeadingSlash(withTrailingSlash(s)) || '/'
}

export function trimSlashes(s: string) {
 return  withoutLeadingSlash(withoutTrailingSlash(s))
}

export function sanitizeUrlForFilePath(url: string) {
  url = trimSlashes(url)
  // URLs such as /something.html and /something to be considered the same
  if (url.endsWith('.html'))
    url = url.replace(/\.html$/, '')

  return url
    .split('/')
    .map(part => sanitize(slugify(part)))
    .join('/')
}