import path from 'path'
import { parse, fragment, serialize } from '@begin/parse5'
import isCustomElement from './lib/is-custom-element.js'
const TEMPLATES = path.join('..', 'views', 'templates')
const MODULES = path.join('modules')

export default function Enhancer(options={}) {
  const {
    templates=TEMPLATES,
    modules=MODULES
  } = options

  return function html(strings, ...values) {
    console.time('parsedoc')
    const doc = parse(render(strings, ...values))
    console.timeEnd('parsedoc')
    const body = doc.childNodes[0].childNodes[1]
    const customElements = processCustomElements(body, templates)
    const moduleNames = [...new Set(customElements.map(node =>  node.tagName))]
    const scripts = fragment(moduleNames.map(name => script(modules, name)).join(''))
    addScriptTags(body, scripts)
    return serialize(doc)
  }
}

function render(strings, ...values) {
  const collect = []
  for (let i = 0; i < strings.length - 1; i++) {
    collect.push(strings[i], encode(values[i]))
  }
  collect.push(strings[strings.length - 1])
  return collect.join('')
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

function processCustomElements(node, templates) {
  console.time('processCustomElements')
  const elements = []
  const find = (node) => {
    for (const child of node.childNodes) {
      if (isCustomElement(child.tagName)) {
        elements.push(child)
        const template = expandTemplate(child, templates)
        fillSlots(child, template)
        const nodeChildNodes = child.childNodes
        nodeChildNodes.splice(
          0,
          nodeChildNodes.length,
          ...template.childNodes
        )
      }
      if (child.childNodes) find(child)
    }
  }
  find(node)
  console.timeEnd('processCustomElements')
  return elements
}

function expandTemplate(node, templates) {
  return fragment(renderTemplate(node.tagName, templates, node.attrs) || '')
}

function renderTemplate(tagName, templates, attrs) {
  const templatePath = `${templates}/${tagName}.js`
  try {
    return require(templatePath)
      .default(attrs && attrsToState(attrs), render)
  }
  catch {
    console.warn(`🤷🏻‍♀️ Template file not found at: ${templatePath}`)
  }
}

function attrsToState(attrs, state={}) {
  [...attrs].forEach(attr => state[attr.name] = decode(attr.value))
  return state
}

export function decode(value) {
  return value.startsWith('__b_')
    ? state[value]
    : value
}

function fillSlots(node, template) {
  console.time('fillSlots')
  const slots = findSlots(template)
  const inserts = findInserts(node)

  const slotsLength = slots.length
  for (let i=0; i<slotsLength; i++) {
    let hasSlotName = false
    const slot = slots[i]
    const slotAttrs = slot.attrs || []

    const slotAttrsLength = slotAttrs.length
    for (let i=0; i < slotAttrsLength; i++) {
      const attr = slotAttrs[i]
      if (attr.name === 'name') {
        hasSlotName = true
        const slotName = attr.value

        const insertsLength = inserts.length
        for (let i=0; i < insertsLength; i ++) {
          const insert = inserts[i]
          const insertAttrs = insert.attrs || []

          const insertAttrsLength = insertAttrs.length
          for (let i=0; i < insertAttrsLength; i++) {
            const attr = insertAttrs[i]
            const insertSlot = attr.value

            if (insertSlot === slotName) {
              const slotParentChildNodes = slot.parentNode.childNodes
              slotParentChildNodes.splice(
                slotParentChildNodes
                  .indexOf(slot),
                1,
                insert
              )
            }
          }
        }
      }
    }

    if (!hasSlotName) {
      const children = node.childNodes.filter(n => !inserts.includes(n))
      const slotParentChildNodes = slot.parentNode.childNodes
      slotParentChildNodes.splice(
        slotParentChildNodes
          .indexOf(slot),
        1,
        ...children
      )
    }
  }
  console.timeEnd('fillSlots')
}


function findSlots(node) {
  console.time('findSlots')
  const elements = []
  const find = (node) => {
    for (const child of node.childNodes) {
      if (child.tagName === 'slot') {
        elements.push(child)
      }
      if (!isCustomElement(child.tagName) &&
        child.childNodes) {
        find(child)
      }
    }
  }
  find(node)
  console.timeEnd('findSlots')
  return elements
}

function findInserts(node) {
  console.time('findInserts')
  const elements = []
  const find = (node) => {
    for (const child of node.childNodes) {
      const attrs = child.attrs
      if (attrs) {
        for (let i=0; i < attrs.length; i++) {
          if (attrs[i].name === 'slot') {
            elements.push(child)
          }
        }
      }
      if (!isCustomElement(child.tagName) &&
        child.childNodes) {
        find(child)
      }
    }
  }
  find(node)
  console.timeEnd('findInserts')
  return elements
}

function script(modulePath, customElement) {
  return `
<script src="/${modulePath}/${customElement}.js" type="module" crossorigin></script>
  `
}

function addScriptTags(body, scripts) {
  body.childNodes.push(...scripts.childNodes)
}
