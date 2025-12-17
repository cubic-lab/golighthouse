import { hasProtocol, withBase, withLeadingSlash } from 'ufo'

export interface Route {
  siteUrl: string
  siteDomainRotation: boolean
  path: string
  url: string
}

export function newRoute(siteUrl: string, siteDomainRotation: boolean, url: string): Route {
  url = routeUrl(siteUrl, url)
  const newURL = new URL(url)
  const hash = newURL.hash.startsWith('#/') ? newURL.hash : ''
  const path = `${withLeadingSlash(newURL.pathname)}${hash}${newURL.search}`
  
  return {
    siteUrl,
    siteDomainRotation,
    url,
    path,
  }
}

export function routeUrl(siteUrl: string, url: string) {
  const baseURL = new URL(siteUrl)
  if (!hasProtocol(url)) {
    url = withBase(url, baseURL.origin)
  }

  return url
}