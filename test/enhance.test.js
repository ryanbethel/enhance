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
<template id="my-paragraph-template">
  <p>
    <slot name="my-text">My default text</slot>
  </p>
</template>
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
<template id="my-paragraph-template">
  <p>
    <slot name="my-text">My default text</slot>
  </p>
</template>
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
<template id="my-paragraph-template">
  <p>
    <slot name="my-text">My default text</slot>
  </p>
</template>
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

test('should pass attributes as state', t=> {
  const actual = html`
<my-link href='/yolo' text='sketchy'></my-link>
`
  const expected = doc(`
<template id="my-link-template">
  <a href=""></a>
</template>
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
<template id="my-list-template">
  <ul>
  </ul>
</template>
<my-list items="__b_0">
  <ul>
    <li>one</li>
    <li>two</li>
    <li>three</li>
  </ul>
</my-list>
<script src="/modules/my-list.js" type="module" crossorigin=""></script>
  `)
  console.log('ACTUAL: ', actual, '\n')
  console.log('\nEXPECTED: ', expected, '\n')
  t.equal(
    strip(actual),
    strip(expected),
    'Passes complex attribute as state'
  )
  t.end()
})
