let manifest
try {
  manifest = require('@architect/shared/static.json')
}
catch(err) {
  // For when you are running in architect sandbox, but no static.json is present
}
const STATIC_ROOT = '_static'

module.exports = function fingerprintedFilePath(asset) {
  const key = asset[0] === '/'
    ? asset.substring(1)
    : asset
  const isIndex = asset === '/'
  const local = process.env.ARC_ENV
    ? process.env.ARC_ENV === 'testing'
    : process.env.NODE_ENV === 'testing'
  if (manifest && !local && !isIndex) {
    const fingerprintedFileName = manifest[key]
    if (!fingerprintedFileName) {
      throw ReferenceError(`${key} not found in the fingerprint manifest: static.json`)
    }
    return `/${STATIC_ROOT}/${fingerprintedFileName}`
  }
  return `/${STATIC_ROOT}/${ isIndex ? '' : key }`
}

