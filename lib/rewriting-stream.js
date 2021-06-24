const SAXParser = require('parse5-sax-parser');
const { escapeString } = require('parse5/lib/serializer');

class RewritingStream extends SAXParser {
  constructor() {
    super({ sourceCodeLocationInfo: true })
    this.posTracker = this.locInfoMixin.posTracker
  }

  _transformChunk(chunk) {
    super._transformChunk(chunk)
  }

  _getRawHtml(location) {
    const droppedBufferSize = this.posTracker.droppedBufferSize
    const start = location.startOffset - droppedBufferSize
    const end = location.endOffset - droppedBufferSize

    return this.tokenizer.preprocessor.html.slice(start, end)
  }

  _handleToken(token) {
    if (!super._handleToken(token)) {
      this.emitRaw(this._getRawHtml(token.location))
    }

    this.parserFeedbackSimulator.skipNextNewLine = false
  }

  _emitToken(eventName, token) {
    this.emit(eventName, token, this._getRawHtml(token.sourceCodeLocation))
  }

  emitDoctype(token) {
    let res = `<!DOCTYPE ${token.name}`

    if (token.publicId !== null) {
      res += ` PUBLIC "${token.publicId}"`
    } else if (token.systemId !== null) {
      res += ' SYSTEM'
    }

    if (token.systemId !== null) {
      res += ` "${token.systemId}"`
    }

    res += '>'

    this.push(res)
  }

  emitStartTag(token) {
    let res = `<${token.tagName}`
    const attrs = token.attrs

    for (let i = 0; i < attrs.length; i++) {
      res += ` ${attrs[i].name}="${escapeString(attrs[i].value, true)}"`
    }

    res += token.selfClosing ? '/>' : '>'

    this.push(res)
  }

  emitEndTag(token) {
    this.push(`</${token.tagName}>`)
  }

  emitText({ text }) {
    this.push(escapeString(text, false))
  }

  emitComment(token) {
    this.push(`<!--${token.text}-->`)
  }

  emitRaw(html) {
    this.push(html)
  }
}

module.exports = RewritingStream
