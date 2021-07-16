export default function MyContent(state={}, html) {
  const { items } = state
  return html`
<my-list items=${items}></my-list>
  `
}
