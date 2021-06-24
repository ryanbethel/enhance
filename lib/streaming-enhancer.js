require = require('esm')(module)
const Rewriter = require('./rewriting-stream')
const ReadableStream = require('./readable-stream')
const isCustomElement = require('./is-custom-element')
const streamToString = require('./stream-to-string')
const TEMPLATE_PATH = `../views/templates`
const MODULE_PATH = '/modules'

module.exports = async function Enhancer(html, state, options={}) {
  let {
    templatePath=TEMPLATE_PATH,
    modulePath=MODULE_PATH
  } = options
  const customElements = []
  const emissions = []
  const addModuleScriptTags = addScriptTags.bind(null, customElements, modulePath)
  const appender = new Rewriter()
  const slotter = new Rewriter({ sourceCodeLocationInfo: true })
  const readable = new ReadableStream({ objectMode: true })
  readable.push(html)
  readable.push(null)

  appender.on('startTag', appendTemplates)
  appender.on('endTag', appendScriptTags)

  slotter.on('startTag', findSlots)
  slotter.on('endTag', fillSlots)

  let slotTag
  let slotName
  let slotValue
  function appendTemplates(tag) {
    const {
      tagName,
      attrs
    } = tag

    if (isCustomElement(tagName)) {
      customElements.push(tagName)
      appender.emitStartTag(tag)
      appender.emitRaw(getTemplate(tagName, templatePath, attrs))
    }
    else {
      appender.emitStartTag(tag)
    }
  }

  function appendScriptTags(tag) {
    const { tagName } = tag
    if (tagName === 'body') {
      appender.emitRaw(addModuleScriptTags())
      appender.emitEndTag(tag)
    }
    else {
      appender.emitEndTag(tag)
    }
  }

  function findSlots(tag) {
    const {
      tagName,
      attrs
    } = tag
    let slotAttr = attrs.find(attr => attr.name === 'slot')
    slotValue = slotAttr && slotAttr.value
    if (tagName === 'slot') {
      let nameAttr = attrs.find(attr => attr.name === 'name')
      slotName = nameAttr.value
      slotTag = tag
    }
    if (slotValue && slotName && slotValue === slotName) {
      console.log('SLOT TAG: ', slotTag)
      console.log('SLOT NAME: ', slotName)
      console.log('SLOT VALUE: ', slotValue)
      console.log('TAG: ', tag)
      slotter.emitStartTag(tag)
    }
    else {
      slotter.emitStartTag(tag)
    }
  }

  function fillSlots(tag) {
    const {
      tagName
    } = tag

    if (tagName === 'slot') {
      console.log('END SLOT')
      slotter.emitEndTag(tag)
    }
    else {
      slotter.emitEndTag(tag)
    }
  }

  return await streamToString(readable.pipe(appender).pipe(slotter))
}

function normalizeAttrs(o, x = {}) {
  [...o].forEach(o => (x[o.name] = o.value))
  return x
}

function getTemplate(tagName, templatePath, attrs) {
  return require(`${templatePath}/${tagName}.js`).default(normalizeAttrs(attrs))
}

function addScriptTags(customElements, modulePath) {
  return customElements.map(c => `
<script src=${modulePath}/${c}.js type=module crossorigin></script>
  `).join('\n')
}
