export default function MyContent(state={}, html) {
  const { items } = state
  return html`
<h3>
  <slot name=title>Content</slot>
</h3>
<my-list items=${items}></my-list>
  `
}
