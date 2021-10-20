const { join } = require('path')
const { existsSync, readFileSync } = require('fs')
const STATIC_ROOT = '_static'

module.exports = function fingerprintedFilePath(asset) {
  const key = asset[0] === '/'
    ? asset.substring(1)
    : asset
  const isIndex = asset === '/'
  const mainfest = join(process.cwd(), '..', 'node_modules', '@architect', 'shared', 'static.json')
  const exists = existsSync(mainfest)
  const local = process.env.ARC_ENV
    ? process.env.ARC_ENV === 'testing'
    : process.env.NODE_ENV === 'testing'
  if (exists && !local && !isIndex) {
    const parsed = JSON.parse(readFileSync(mainfest).toString())
    const fingerprintedFileName = parsed[key]
    if (!fingerprintedFileName) {
      throw ReferenceError(`${key} not found in the fingerprinted file manifest static.json`)
    }
    return `/${STATIC_ROOT}/${fingerprintedFileName}`
  }
  return `/${STATIC_ROOT}/${ isIndex ? '' : asset }`
}
