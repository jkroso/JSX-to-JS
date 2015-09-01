const {generate} = require('escodegen')
const JSX = require('..')

const equiv = (a, b) => generate(JSX(a)) == generate(JSX(b))

it('out of scope nodes', () => {
  assert(equiv('<div/>', 'JSX("div")'))
  assert(equiv('<div class="a"/>', 'JSX("div", {class: "a"})'))
  assert(equiv('<div class="a" cursor={1}/>', 'JSX("div", {class: "a"}, null, {cursor: 1})'))
  assert(equiv('<div class="a" cursor={1} onClick={()=>null}/>'
             , 'JSX("div", {class: "a"}, null, {cursor: 1}, {click:()=>null})'))
  assert(equiv('<div onClick={()=>null}><a href="a">link</a></div>'
             , 'JSX("div", null, [JSX("a", {href:"a"}, ["link"])], null, {click:()=>null})'))
})

it('in scope node', () => {
  assert(equiv('var link = function() { return JSX("a", {href:"a"}) };<link/>'
             , 'var link = function() { return JSX("a", {href:"a"}) };JSX(link)'))
})
