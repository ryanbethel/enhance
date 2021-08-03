import test from 'tape'
import enhance from '..'
// Timed version
//import enhance from '../timed.js'
const strip = str => str.replace(/\r?\n|\r|\s\s+/g, '')

function doc(string) {
  return `<html><head></head><body>${string}</body></html>`
}

const html = enhance({
  templates: './test/fixtures/templates'
})

test('Enhance should', t => {
  t.ok(true, 'it really should')
  t.end()
})

test('exist', t => {
  t.ok(enhance, 'it lives')
  t.end()
})

test('return an html function', t => {
  t.ok(html, 'ah yes, this might come in handy')
  t.end()
})

test('expand template', t=> {
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
    'by gum, i do believe that it does expand that template with slotted default content'
  )
  t.end()
})

test('fill named slot', t=> {
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
    'fills that named slot alright'
  )
  t.end()
})

test('add authored children to unnamed slot', t=> {
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
    'adds unslotted children to the unnamed slot'
  )
  t.end()
})

test('pass attributes as state', t=> {
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
    'passes attributes as a state object when executing template functions'
  )
  t.end()
})

test('support spread of object attributes', t=> {
  const o = {
    href: '/yolo',
    text: 'sketchy',
    customAttribute: true
  }
  const actual = html`
<my-link ...${o}></my-link>
`
  const expected = doc(`
<my-link href="/yolo" text="sketchy" custom-attribute="custom-attribute">
  <a href="/yolo">sketchy</a>
</my-link>
<script src="/modules/my-link.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'supports spread operator for expanding entire object as attributes'
  )
  t.end()
})
test('pass attribute array values correctly', t => {
  const things = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
<my-list items="${things}"></my-list>
`
  const expected = doc(`
<my-list items="__b_1">
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
    'this means that encoding and decoding arrays and objects works, exciting'
  )
  t.end()
})


test('update deeply nested slots', t=> {
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
    'updates deeply nested slots SLOTS ON SLOTS ON SLOTS'
  )
  t.end()
})

test('fill nested rendered slots', t=> {
  const items = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
<my-list-container items="${items}">
  <span slot=title>YOLO</span>
</my-list-container>
  `
  const expected = doc(`
<my-list-container items="__b_2">
  <h2>My List Container</h2>
  <span slot="title">
    YOLO
  </span>
  <my-list items="__b_3">
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
    'Wow it renders nested custom elements by passing that handy render function when executing template functions'
  )
  t.end()
})

test('not throw when template not found', t => {
  t.ok(
    html`<missing-template></missing-template>`,
    'well that\'s nice, it warns instead of throwing.'
  )
  t.end()
})

