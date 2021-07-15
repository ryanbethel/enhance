export default function MyList(state={}) {
  const items = state.items || []
  const listItems = items &&
    items.map &&
    items.map(li => `<li>${li.title}</li>`)
    .join('')
  return `
<ul>
  ${listItems}
</ul>
`
}
