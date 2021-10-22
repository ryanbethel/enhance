let manifest
try {
  manifest = require('@architect/shared/static.json')
}
catch(err) {
  // For when you are running in architect sandbox, but no static.json is present
}
const STATIC_ROOT = '_static'

module.exports = function fingerprintedFilePath(rootRelativeAssetPath) {
  const asset = rootRelativeAssetPath[0] === '/'
    ? rootRelativeAssetPath.substring(1)
    : rootRelativeAssetPath
  const local = process.env.ARC_ENV
    ? process.env.ARC_ENV === 'testing'
    : process.env.NODE_ENV === 'testing'
  if (manifest && !local) {
    const fingerprintedFileName = manifest[asset]
    if (!fingerprintedFileName) {
      // You could have a custom element you want to render with enhance without a backing web component
      console.warn(`${asset} not found in the fingerprint manifest: static.json`)
    }
    return `/${STATIC_ROOT}/${fingerprintedFileName}`
  }
  return `/${STATIC_ROOT}/${asset}`
}

