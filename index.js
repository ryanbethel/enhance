require = require('esm')(module)
const path = require('path')
const { parse, fragment } = require('@begin/jsdom')
const isCustomElement = require('./lib/is-custom-element')
const TEMPLATE_PATH = path.join('..', 'views', 'templates')
const MODULE_PATH = path.join('modules')

function Enhancer(options={}) {
  const {
    templatePath=TEMPLATE_PATH,
    modulePath=MODULE_PATH
  } = options

  function getActualTagName(node) {
    const { tagName } = node
    return tagName && tagName.toLowerCase()
  }

  function findCustomElements(node, customElements) {
    const childNodes = node.childNodes
    childNodes.forEach(child => {
      const actualTagName = getActualTagName(child)
      if (isCustomElement(actualTagName)) {
        const template = renderTemplate(actualTagName, templatePath, child.attributes)
        child.append(fragment(template))
        fillSlots(child)
        customElements.push(child)
      }

      if (child.childNodes) {
        findCustomElements(child, customElements)
      }
    })
  }

  function fillSlots(node) {
    const slots = node.querySelectorAll('slot[name]')
    const inserts = node.querySelectorAll('[slot]')
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

  function getWebComponents(acc, el) {
    const actualTagName = getActualTagName(el)
    acc[actualTagName] = actualTagName
    return acc
  }

  function html(strings, ...values) {
    const customElements = []
    // FIXME: state should be passed or created not in outer scope
    state = {}
    const dom = parse(render(strings, ...values).join(''))
    const body = dom.window.document.body
    findCustomElements(body, customElements)
    customElements.forEach(node => fillSlots(node))
    const webComponents = customElements.reduce(getWebComponents, {})

    Object.keys(webComponents)
      .forEach(key => body.append(fragment(scriptTag(modulePath, webComponents[key]))))

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
  <script src="/${modulePath}/${customElement}.js" type="module" crossorigin></script>
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
