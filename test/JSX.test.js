const {generate} = require('escodegen')
const JSX = require('../index')

const equiv = (a, b) => generate(JSX(a)) == generate(JSX(b))

it('out of scope nodes', () => {
  assert(equiv('<div/>', 'JSX("div")'))
  assert(equiv('<a.b/>', 'JSX("a.b")'))
  assert(equiv('<a.b.c/>', 'JSX("a.b.c")'))
})

it('in scope node', () => {
  const src = 'const link = () => JSX("a", {href:"a"});'
  assert(equiv(`${src}<link/>`, `${src}JSX(link)`))
  assert(equiv(`${src}<link.b/>`, `${src}JSX(link.b)`))
  assert(equiv(`${src}<link.b.c/>`, `${src}JSX(link.b.c)`))
})

it('attributes', () => {
  assert(equiv('<div class="a"/>', 'JSX("div", {class: "a"})'))
  assert(equiv('<div class="a" cursor={1}/>', 'JSX("div", {class: "a", cursor: 1})'))
  assert(equiv('<div class="a" cursor={1} onClick={()=>null}/>'
             , 'JSX("div", {class: "a", cursor: 1, onClick: ()=>null})'))
  assert(equiv('<div tip={<a/>}/>', 'JSX("div", {tip: JSX("a")})'))
})

it('spread attributes', () => {
  assert(equiv('<div {...rest}/>', 'JSX("div", rest)'))
  assert(equiv('<div a={1} {...rest}/>', 'JSX("div", Object.assign({a:1}, rest))'))
  assert(equiv('<div a={1} {...one} {...two}/>', 'JSX("div", Object.assign({a:1}, one, two))'))
  assert(equiv('<div a={1} {...one} b={2} {...two}/>'
             , 'JSX("div", Object.assign({a:1}, one, {b:2}, two))'))
  assert(equiv('<div {...one} b={2} {...two}/>'
             , 'JSX("div", Object.assign(Object.create(one), {b:2}, two))'))
})

it('children', () => {
  assert(equiv('<div onClick={()=>null}><a href="a">link</a></div>'
             , 'JSX("div", {onClick:()=>null}, [JSX("a", {href:"a"}, ["link"])])'))
  assert(equiv('<span>a</span>', 'JSX("span", null, ["a"])'))
})

it('handle es6 features', () => {
  assert(equiv('const link = ()=> <a href="a"/>', 'const link = ()=> JSX("a", {href:"a"})'))
})
