module.exports = function MyLink(state={}) {
  const { href='', text='' } = state
  return `
<a href="${href}">${text}</a>
  `
}
