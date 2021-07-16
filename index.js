require = require('esm')(module)
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const isCustomElement = require('./lib/is-custom-element')
const TEMPLATE_PATH = `../views/templates`
const MODULE_PATH = '/modules'


function Enhancer(options={}) {
  const {
    templatePath=TEMPLATE_PATH,
    modulePath=MODULE_PATH
  } = options

  function html(strings, ...values) {
    const collect = []
    for (let i = 0; i < strings.length - 1; i++) {
      collect.push(strings[i], encode(values[i]))
    }
    collect.push(strings[strings.length - 1])

    const webComponents = {}
    const dom = new JSDOM(collect.join(''))
    const body = dom.window.document.body
    const findCustomElements = node => {
      const childNodes = node.childNodes
      childNodes.forEach(child => {
        const { tagName } = child
        const actualTagName = tagName && tagName.toLowerCase()
        if (isCustomElement(actualTagName)) {
          webComponents[actualTagName] = actualTagName

          const template = getTemplate(actualTagName, templatePath, child.attributes)
          const fragment = JSDOM.fragment(template)
          child.insertBefore(fragment, child.firstChild)
          const slots = child.querySelectorAll('slot[name]')
          const inserts = child.querySelectorAll('[slot]')
          slots.forEach(slot => {
            const slotName = slot.getAttribute('name')
            inserts.forEach(insert => {
              const insertSlot = insert.getAttribute('slot')
              if (slotName === insertSlot) {
                slot.replaceWith(insert)
              }
            })
          })
        }

        if (child.childNodes) {
          findCustomElements(child)
        }
      })
    }
    findCustomElements(body)

    Object.keys(webComponents)
      .forEach(key => body.append(JSDOM.fragment(scriptTag(modulePath, webComponents[key]))))

    return dom.serialize()
  }

  function attrsToState(attrs, state={}) {
    [...attrs].forEach(attr => state[attr.name] = decode(attr.value))
    return state
  }

  function getTemplate(tagName, templatePath, attrs) {
    return require(`${templatePath}/${tagName}.js`)
      .default(attrs && attrsToState(attrs), html)
  }

  function scriptTag(modulePath, customElement) {
    return `
  <script src="${modulePath}/${customElement}.js" type="module" crossorigin></script>
    `
  }

  return html
}

const state = {}
let place = 0
export function encode(value) {
  if (typeof value !== 'string') {
    const id = `__b_${place++}`
    state[id] = value
    return id
  }
  else {
    return value
  }
}

export function decode(value) {
  return value.startsWith('__b_')
    ? state[value]
    : value
}

Enhancer.encode = encode
Enhancer.decode = decode

export default Enhancer
