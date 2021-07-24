export default function MyContent(state={}, html) {
  const { items } = state
  return html`
<h2>My Content</h2>
<slot name=title>
  <h3>
    Title
  </h3>
</slot>
<my-list items=${items}>
  <h4 slot="title">Content List</h4>
</my-list>
  `
}
