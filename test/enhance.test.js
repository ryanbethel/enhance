import test from 'tape'
import enhance from '..'
const strip = str => str.replace(/\r?\n|\r|\s\s+/g, '')

function doc(string) {
  return `<html><head></head><body>${string}</body></html>`
}

const html = enhance({
  templates: './test/fixtures/templates'
})

test('enhance should exist', t => {
  t.ok(html)
  t.end()
})

test('should expand template', t=> {
  const actual = html`<my-paragraph></my-paragraph>`
  const expected = doc(`
<my-paragraph>
  <p><slot name="my-text">My default text</slot></p>
</my-paragraph>
<script src="/modules/my-paragraph.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'expands template with slot default content correctly'
  )
  t.end()
})

test('should fill named slot', t=> {
  const actual = html`
<my-paragraph>
  <span slot="my-text">Slotted</span>
</my-paragraph>
  `
  const expected = doc(`
<my-paragraph>
  <p><span slot="my-text">Slotted</span></p>
</my-paragraph>
<script src="/modules/my-paragraph.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Fills named slot'
  )
  t.end()
})

test('should add authored children to unnamed slot.', t=> {
  const actual = html`
  <my-content>
    <h1>YOLO</h1>
    <h4 slot=title>Custom title</h4>
  </my-content>`
  const expected = doc(`
  <my-content>
    <h2>My Content</h2>
    <h4 slot="title">Custom title</h4>
    <h1>YOLO</h1>
  </my-content>
<script src="/modules/my-content.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Adds unslotted children to unnamed slot'
  )
  t.end()
})

test('should pass attributes as state', t=> {
  const actual = html`
<my-link href='/yolo' text='sketchy'></my-link>
`
  const expected = doc(`
<my-link href="/yolo" text="sketchy">
  <a href="/yolo">sketchy</a>
</my-link>
<script src="/modules/my-link.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Passes attributes as state'
  )
  t.end()
})

test('should pass attribute array values correctly', t => {
  const things = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
<my-list items="${things}"></my-list>
`
  const expected = doc(`
<my-list items="__b_0">
  <slot name="title">
    <h4>My list</h4>
  </slot>
  <ul>
    <li>one</li>
    <li>two</li>
    <li>three</li>
  </ul>
</my-list>
<script src="/modules/my-list.js" type="module" crossorigin=""></script>
  `)
  t.equal(
    strip(actual),
    strip(expected),
    'Passes complex attribute as state'
  )
  t.end()
})


test('should update deeply nested slots', t=> {
  const actual = html`
  <my-content>
    <my-content>
      <h3 slot="title">Second</h3>
      <my-content>
        <h3 slot="title">Third</h3>
      </my-content>
    </my-content>
  </my-content>`
  const expected = doc(`
  <my-content>
    <h2>My Content</h2>
    <slot name="title">
      <h3>
        Title
      </h3>
    </slot>
    <my-content>
      <h2>My Content</h2>
      <h3 slot="title">Second</h3>
      <my-content>
        <h2>My Content</h2>
        <h3 slot="title">Third</h3>
      </my-content>
    </my-content>
  </my-content>
<script src="/modules/my-content.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Updates deeply nested slots'
  )
  t.end()
})

test('should fill nested rendered slots', t=> {
  const items = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
<my-list-container items="${items}">
  <span slot=title>YOLO</span>
</my-list-container>
  `
  const expected = doc(`
<my-list-container items="__b_1">
  <h2>My List Container</h2>
  <span slot="title">
    YOLO
  </span>
  <my-list items="__b_2">
    <h4 slot="title">Content List</h4>
    <ul>
      <li>one</li>
      <li>two</li>
      <li>three</li>
    </ul>
  </my-list>
</my-list-container>
<script src="/modules/my-list-container.js" type="module" crossorigin=""></script>
<script src="/modules/my-list.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Renders nested custom elements by passing html function'
  )
  t.end()
})

test('should not throw when template not found', t => {
  t.ok(
    html`<missing-template></missing-template>`,
    'Warns instead of throwing.'
  )
  t.end()
})
