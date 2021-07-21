export default function MyContent(state={}, html) {
  const { items } = state
  return html`
<h3>Content</h3>
<my-list items=${items}></my-list>
  `
}
