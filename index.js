import { existsSync } from 'fs'
import path from 'path'
import { parse, parseFragment as fragment, serialize } from 'parse5'
import isCustomElement from './lib/is-custom-element.js'
const TEMPLATES = path.join('..', 'views', 'templates')
const MODULES = path.join('modules')

export default function Enhancer(options={}) {
  const {
    templates=TEMPLATES,
    modules=MODULES
  } = options

  function html(strings, ...values) {
    const doc = parse(render(strings, ...values))
    const body = doc.childNodes[0].childNodes[1]
    const customElements = processCustomElements(doc, templates)
    const moduleNames = [...new Set(customElements.map(node =>  node.tagName))]
    const scripts = fragment(moduleNames.map(name => script(modules, name)).join(''))
    addScriptTags(body, scripts)
    return serialize(doc)
  }

  return html
}

function render(strings, ...values) {
  const collect = []
  for (let i = 0; i < strings.length - 1; i++) {
    collect.push(strings[i], encode(values[i]))
  }
  collect.push(strings[strings.length - 1])
  return collect.join('')
}

function findSlots(node) {
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
  return elements
}

function findInserts(node) {
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
  return elements
}

function fillSlots(node, template) {
  const slots = findSlots(template)
  const inserts = findInserts(node)

  slots.forEach(slot => {
    const slotAttrs = slot.attrs || []
    let hasSlotName = false

    slotAttrs.forEach(attr => {
      if (attr.name === 'name') {
        hasSlotName = true
        const slotName = attr.value
        inserts.forEach(insert => {
          const insertAttrs = insert.attrs || []
          insertAttrs.forEach(attr => {
            if (attr.name === 'slot') {
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
          })
        })
      }
    })

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
  })
}

function processCustomElements(node, templates) {
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
  return elements
}

function expandTemplate(node, templates) {
  return fragment(renderTemplate(node.tagName, templates, node.attrs) || '')
}

function addScriptTags(body, scripts) {
  body.childNodes.push(...scripts.childNodes)
}

function attrsToState(attrs, state={}) {
  [...attrs].forEach(attr => state[attr.name] = decode(attr.value))
  return state
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

function script(modulePath, customElement) {
  return `
<script src="/${modulePath}/${customElement}.js" type="module" crossorigin></script>
  `
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
