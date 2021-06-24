const { Readable } = require('stream')

module.exports = class ReadableStream extends Readable {
  constructor(props) {
    super(props)
  }
  _read() {}
}
