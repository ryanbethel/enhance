export default function MyParagraph() {
  return `
<p>
  <slot name="my-text">
    My default text
  </slot>
</p>
`
}
