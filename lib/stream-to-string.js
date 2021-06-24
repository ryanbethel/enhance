module.exports = async function streamToString(readable) {
  let result = ''
  for await (chunk of readable) {
    result += Buffer.from(chunk).toString('utf8')
  }
  return result
}
