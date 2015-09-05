const {transform:{fromAst},parse} = require('babel')
const {generate} = require('escodegen')
const assert = require('assert')
const JSX = require('../index')

const opts = {blacklist: ['react']}
const equiv = (a, b) =>
  generate(fromAst(JSX(parse(a)), null, opts).ast.program)
  ==
  generate(fromAst(JSX(parse(b)), null, opts).ast.program)

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
  assert(equiv('<span>{1}</span>', 'JSX("span", null, [1])'))
})

describe('With other ES6 features', () => {
  it('arrow functions', () => {
    assert(equiv('()=> <a href="a"/>', '()=> JSX("a", {href:"a"})'))
  })

  it('default parameters', () => {
    assert(equiv('(a=<a/>)=>null', '(a=JSX("a"))=>null'))
  })
})
