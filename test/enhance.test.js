const test = require('tape')
const enhancer = require('..')
const strip = str => str.replace(/\r?\n|\r|\s\s+/g, '')
const options = {
  templatePath: './test/fixtures/templates'
}
function doc(string) {
  return `<html><head></head><body>${string}</body></html>`
}

test('enhancer should exist', t=> {
  t.ok(enhancer)
  t.end()
})

test('should output template', t=> {
  const input = `<my-paragraph></my-paragraph>`
  const actual = enhancer(input, options)
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
  const input = `
  <my-paragraph>
    <span slot="my-text">Let's have some different text!</span>
  </my-paragraph>`
  const actual = enhancer(input, options)
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
  const input = `
  <my-paragraph>
    <span slot="my-text">Let's have some different text!</span>
    <my-paragraph>
      <span slot="my-text">Some other text</span>
    </my-paragraph>
  </my-paragraph>`
  const actual = enhancer(input, options)
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
    console.log('ACTUAL: ', actual, '\n')
    console.log('\nEXPECTED: ', expected, '\n')
  t.equal(
    strip(actual),
    strip(expected),
    'updates slot from children correctly'
  )
  t.end()
})

test('should pass attributes as state', t=> {
  const input = `
<my-link href='/yolo' text='sketchy'></my-link>
`
  const actual = enhancer(input, options)
  const expected = doc(`
<template id="my-link-template">
  <a href=""></a>
</template>
<my-link href="/yolo" text="sketchy">
  <a href="/yolo">sketchy</a>
</my-link>
<script src="/modules/my-link.js" type="module" crossorigin=""></script>
`)
  console.log('ACTUAL: ', actual, '\n')
  console.log('\nEXPECTED: ', expected, '\n')
  t.equal(
    strip(actual),
    strip(expected),
    'Passes attributes as state'
  )
  t.end()
})
