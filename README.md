# enhance✨

Enhance is a module for rendering [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) on the server.

It enables a [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) workflow that embraces [templates and slots](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots).

Enhance works really well with [Architect](arc.codes).


## Install

`npm i @begin/enhance`

## Usage

By default enhance looks for templates in your projects `/src/views/templates` directory and loads components from your projects `/public/components` directory.

```javascript
// Template
module.exports = function MyCounter(state={}) {
  const { count=0 } = state
  return `
<h3>Count: ${count}</h3>
`
}
```

```javascript
// Render
const html = require('@begin/enhance')()
const data = { a: 1, b: 2 }
console.log(html`<my-element ...${data}></my-element>`)
```

