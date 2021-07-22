import test from 'tape'
import Enhancer from '..'
const html = Enhancer({
  templatePath: './test/fixtures/templates'
})
// Strip all whitespace for html string comparisons in tests
const strip = str => str.replace(/\r?\n|\r|\s\s+/g, '')
// JSDOM automatically wraps output with <html>...
//  so we need this to mimic output in tests
function doc(string) {
  return `<html><head></head><body>${string}</body></html>`
}

test('enhancer should exist', t=> {
  t.ok(Enhancer)
  t.end()
})

test('html function should exist', t=> {
  t.ok(html)
  t.end()
})

test('encode should exist', t=> {
  t.ok(Enhancer.encode)
  t.end()
})

test('should encode and decode string', t=> {
  const index = Enhancer.encode('worky')
  t.equals(Enhancer.decode(index), 'worky')
  t.end()
})

test('should encode and decode array', t=> {
  const a = [1,2,3]
  const index = Enhancer.encode(a)
  t.equals(Enhancer.decode(index), a)
  t.end()
})

test('should encode array of objects', t=> {
  const a = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const index = Enhancer.encode(a)
  t.equals(Enhancer.decode(index), a)
  t.end()
})

test('should output template', t=> {
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

test('should update slot', t=> {
  const actual = html`
  <my-paragraph>
    <span slot="my-text">Let's have some different text!</span>
  </my-paragraph>`
  const expected = doc(`
  <my-paragraph>
    <p>
      <span slot="my-text">Let's have some different text!</span>
    </p>
  </my-paragraph>
<script src="/modules/my-paragraph.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'updates slot from children correctly'
  )
  t.end()
})

test('should update nested slots', t=> {
  const actual = html`
  <my-paragraph>
    <span slot="my-text">Let's have some different text!</span>
    <my-paragraph>
      <span slot="my-text">Some other text</span>
    </my-paragraph>
  </my-paragraph>`
  const expected = doc(`
  <my-paragraph>
    <p>
      <span slot="my-text">Let's have some different text!</span>
    </p>
    <my-paragraph>
      <p>
        <span slot="my-text">Some other text</span>
      </p>
    </my-paragraph>
  </my-paragraph>
<script src="/modules/my-paragraph.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'updates slot from children correctly'
  )
  t.end()
})


test('should treat number attribute as pass through', t=> {
  const actual = html`
<my-counter count=5></my-counter>
  `
  const expected = doc(`
<my-counter count="5">
  <h3>Count: 5</h3>
</my-counter>
<script src="/modules/my-counter.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Treats numbers as pass through'
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
<my-list items="__b_2">
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

test('should render nested custom elements', t=> {
  const things = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
<my-page items=${things}></my-page>
  `
  const expected = doc(`
<my-page items="__b_3">
  <my-content items="__b_4">
    <h3>
      <slot name="title">Content</slot>
    </h3>
    <my-list items="__b_5">
      <ul>
        <li>one</li>
        <li>two</li>
        <li>three</li>
      </ul>
    </my-list>
  </my-content>
</my-page>
<script src="/modules/my-page.js" type="module" crossorigin=""></script>
<script src="/modules/my-content.js" type="module" crossorigin=""></script>
<script src="/modules/my-list.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Renders nested custom elements by passing html function'
  )
  t.end()
})

test('should fill nested rendered slots', t=> {
  const things = [{ title: 'one' },{ title: 'two' },{ title: 'three' }]
  const actual = html`
    <my-page items=${things}>
      <my-content>
        <span slot=title>YOLO</span>
      </my-content>
    </my-page>
  `
  const expected = doc(`
<my-page items="__b_3">
  <my-content items="__b_4">
    <h3>
      <span slot="title">YOLO</span>
    </h3>
    <my-list items="__b_5">
      <ul>
        <li>one</li>
        <li>two</li>
        <li>three</li>
      </ul>
    </my-list>
  </my-content>
</my-page>
<script src="/modules/my-page.js" type="module" crossorigin=""></script>
<script src="/modules/my-content.js" type="module" crossorigin=""></script>
<script src="/modules/my-list.js" type="module" crossorigin=""></script>
`)
  t.equal(
    strip(actual),
    strip(expected),
    'Renders nested custom elements by passing html function'
  )
  t.end()
})
