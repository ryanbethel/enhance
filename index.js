require = require('esm')(module)
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const isCustomElement = require('./lib/is-custom-element')
const TEMPLATE_PATH = `../views/templates`
const MODULE_PATH = '/modules'

module.exports = async function Enhancer(html, state, options={}) {
  const {
    templatePath=TEMPLATE_PATH,
    modulePath=MODULE_PATH
  } = options
  const customElements = {}
  const templates = {}
  const dom = new JSDOM(html)
  const body = dom.window.document.body
  const findCustomElements = node => {
    const childNodes = node.childNodes
    childNodes.forEach(child => {
      const { tagName } = child
      const actualTagName = tagName && tagName.toLowerCase()
      if (isCustomElement(actualTagName)) {
        customElements[actualTagName] = actualTagName
        const template = getTemplate(actualTagName, templatePath, child.attributes)
        const fragment = JSDOM.fragment(template)
        templates[actualTagName] = templateElement(actualTagName, template)
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

  Object.keys(templates)
    .forEach(key => body.insertBefore(JSDOM.fragment(templates[key]), body.firstChild))
  Object.keys(customElements)
    .forEach(key => body.append(JSDOM.fragment(scriptTag(modulePath, customElements[key]))))
  return dom.serialize()
}

function normalizeAttrs(o, x = {}) {
  [...o].forEach(o => (x[o.name] = o.value))
  return x
}

function getTemplate(tagName, templatePath, attrs) {
  return require(`${templatePath}/${tagName}.js`)
    .default(normalizeAttrs(attrs))
}

function templateElement(tagName, children) {
  return `
<template id="${tagName}-template">
  ${children}
</template>
`
}

function scriptTag(modulePath, customElement) {
  return `
<script src="${modulePath}/${customElement}.js" type="module" crossorigin></script>
  `
}
