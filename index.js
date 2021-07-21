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

  function findCustomElements(node, webComponents) {
    const childNodes = node.childNodes
    childNodes.forEach(child => {
      const { tagName } = child
      const actualTagName = tagName && tagName.toLowerCase()
      if (isCustomElement(actualTagName)) {
        webComponents[actualTagName] = actualTagName
        const template = renderTemplate(actualTagName, templatePath, child.attributes)
        child.insertBefore(JSDOM.fragment(template), child.firstChild)
        fillSlots(child)
      }

      if (child.childNodes) {
        findCustomElements(child, webComponents)
      }
    })
  }

  function fillSlots(child) {
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

  // FIXME: this needs to fill slots as well
  function nested(strings, ...values) {
    return render(strings, ...values).join('')
  }

  function render(strings, ...values) {
    const collect = []
    for (let i = 0; i < strings.length - 1; i++) {
      collect.push(strings[i], encode(values[i]))
    }
    collect.push(strings[strings.length - 1])
    return collect
  }

  function html(strings, ...values) {
    const webComponents = {}
    // FIXME: this needs to be fixed
    state = {}
    const dom = new JSDOM(render(strings, ...values).join(''))
    const body = dom.window.document.body
    findCustomElements(body, webComponents)

    Object.keys(webComponents)
      .forEach(key => body.append(JSDOM.fragment(scriptTag(modulePath, webComponents[key]))))

    return dom.serialize()
  }

  function attrsToState(attrs, state={}) {
    [...attrs].forEach(attr => state[attr.name] = decode(attr.value))
    return state
  }

  function renderTemplate(tagName, templatePath, attrs) {
    return require(`${templatePath}/${tagName}.js`)
      .default(attrs && attrsToState(attrs), nested)
  }

  function scriptTag(modulePath, customElement) {
    return `
  <script src="${modulePath}/${customElement}.js" type="module" crossorigin></script>
    `
  }

  return html
}

let state = {}
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
