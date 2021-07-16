export default function MyPage(state={}, html) {
  const { items=[] } = state
  return html`
<my-content items=${items}></my-content>
  `
}
